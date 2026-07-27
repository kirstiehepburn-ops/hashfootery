const sb   = require('./_db');
const cors = require('./_cors');

const BSKY_PUBLIC = 'https://public.api.bsky.app/xrpc';
const BSKY_API    = 'https://bsky.social/xrpc';
const HASHTAG     = '#hashfootery';

// Normalise team name for fuzzy matching
function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

function matchTeam(input, teamName) {
  const i = norm(input), t = norm(teamName);
  return i === t || t.startsWith(i) || i.startsWith(t);
}

// Parse "Arsenal 2-1 Chelsea" from post text
function parsePrediction(text, fixtures) {
  // Strip hashtags
  const clean = text.replace(/#\S+/g, ' ').replace(/\s+/g, ' ').trim();
  const scoreRe = /\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b/;
  const m = clean.match(scoreRe);
  if (!m) return null;

  const idx   = clean.indexOf(m[0]);
  const homePart = clean.slice(0, idx).trim();
  const awayPart = clean.slice(idx + m[0].length).trim();
  const homeGoals = parseInt(m[1]);
  const awayGoals = parseInt(m[2]);

  for (const f of fixtures) {
    // Only match if neither team is TBD and fixture isn't locked
    const lockAt = new Date(new Date(f.kickoff_utc).getTime() - 60 * 60 * 1000);
    if (new Date() >= lockAt) continue;
    if (matchTeam(homePart, f.home_team) && matchTeam(awayPart, f.away_team)) {
      return { fixture_id: f.id, home_score: homeGoals, away_score: awayGoals };
    }
  }
  return null;
}

async function getBotToken() {
  const r = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: process.env.BSKY_BOT_HANDLE,
      password:   process.env.BSKY_BOT_PASSWORD
    })
  });
  const j = await r.json();
  return { accessJwt: j.accessJwt, did: j.did };
}

async function replyToPost(token, botDid, post, message) {
  await fetch(`${BSKY_API}/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      repo:       botDid,
      collection: 'app.bsky.feed.post',
      record: {
        '$type': 'app.bsky.feed.post',
        text: message,
        reply: {
          root:   { uri: post.uri, cid: post.cid },
          parent: { uri: post.uri, cid: post.cid }
        },
        createdAt: new Date().toISOString()
      }
    })
  });
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Load poll state (cursor = last seen post timestamp)
    const { data: state } = await sb.from('hf_poll_state').select('*').eq('id', 1).single();
    const sinceDate = state?.last_cursor || new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Fetch recent #hashfootery posts
    const url = `${BSKY_PUBLIC}/app.bsky.feed.searchPosts?q=${encodeURIComponent(HASHTAG)}&limit=50&sort=latest`;
    const searchRes = await fetch(url);
    const { posts } = await searchRes.json();
    if (!posts?.length) return res.json({ ok: true, processed: 0 });

    // Only posts newer than last poll
    const newPosts = posts.filter(p => p.record?.createdAt > sinceDate);
    if (!newPosts.length) return res.json({ ok: true, processed: 0 });

    // Load all registered players (by bluesky handle)
    const { data: players } = await sb.from('hf_players').select('id, name, bluesky_handle').not('bluesky_handle', 'is', null);
    const handleMap = {};
    for (const p of players || []) {
      if (p.bluesky_handle) handleMap[p.bluesky_handle.replace(/^@/, '').toLowerCase()] = p;
    }

    // Load upcoming fixtures (not yet kicked off)
    const now = new Date().toISOString();
    const { data: fixtures } = await sb.from('hf_fixtures').select('*').gte('kickoff_utc', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()).eq('status', 'scheduled');

    // Load already-processed post URIs
    const { data: existingPreds } = await sb.from('hf_predictions').select('bluesky_post_uri').not('bluesky_post_uri', 'is', null);
    const processedUris = new Set((existingPreds || []).map(p => p.bluesky_post_uri));

    // Get bot credentials (only if needed)
    let botToken = null, botDid = null;
    const needBot = process.env.BSKY_BOT_HANDLE && process.env.BSKY_BOT_PASSWORD;

    let processed = 0;
    for (const post of newPosts) {
      if (processedUris.has(post.uri)) continue;
      const handle = post.author?.handle?.toLowerCase();
      const player = handleMap[handle];
      if (!player) continue; // Not a registered player

      const text = post.record?.text || '';
      const pred = parsePrediction(text, fixtures || []);
      if (!pred) continue;

      // Save prediction
      const { error } = await sb.from('hf_predictions').upsert(
        {
          player_id:        player.id,
          fixture_id:       pred.fixture_id,
          home_score:       pred.home_score,
          away_score:       pred.away_score,
          source:           'bluesky',
          bluesky_post_uri: post.uri
        },
        { onConflict: 'player_id,fixture_id' }
      );
      if (error) continue;

      // Reply to confirm
      if (needBot) {
        if (!botToken) ({ accessJwt: botToken, did: botDid } = await getBotToken());
        const fx = fixtures.find(f => f.id === pred.fixture_id);
        const msg = `✅ Got it, @${post.author.handle}! ${fx.home_team} ${pred.home_score}-${pred.away_score} ${fx.away_team} logged. Good luck! 🍀`;
        await replyToPost(botToken, botDid, post, msg);
      }
      processed++;
    }

    // Update cursor to newest post time
    const newest = newPosts[0]?.record?.createdAt;
    if (newest) {
      await sb.from('hf_poll_state').update({ last_cursor: newest, updated_at: new Date().toISOString() }).eq('id', 1);
    }

    res.json({ ok: true, processed });
  } catch (err) {
    console.error('poll-bluesky error:', err);
    res.status(500).json({ error: err.message });
  }
};
