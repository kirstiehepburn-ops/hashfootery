const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Body: { player_id, fixture_id, home_score, away_score }
  const { player_id, fixture_id, home_score, away_score } = req.body || {};
  if (!player_id || !fixture_id || home_score == null || away_score == null)
    return res.status(400).json({ error: 'player_id, fixture_id, home_score, away_score required' });

  // Check fixture exists and isn't locked (kicks off in > 1hr)
  const { data: fixture, error: fxErr } = await sb
    .from('hf_fixtures')
    .select('kickoff_utc, status')
    .eq('id', fixture_id)
    .single();
  if (fxErr || !fixture) return res.status(404).json({ error: 'fixture not found' });

  const lockAt = new Date(new Date(fixture.kickoff_utc).getTime() - 60 * 60 * 1000);
  if (new Date() >= lockAt)
    return res.status(403).json({ error: 'This match is locked for predictions' });

  const { data, error } = await sb
    .from('hf_predictions')
    .upsert(
      { player_id, fixture_id, home_score: parseInt(home_score), away_score: parseInt(away_score), source: 'web' },
      { onConflict: 'player_id,fixture_id' }
    )
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, prediction: data });
};
