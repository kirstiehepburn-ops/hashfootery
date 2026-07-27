const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { gameweek, current } = req.query;
  let gw = gameweek ? parseInt(gameweek) : null;

  if (!gw && current === 'true') {
    const now = new Date().toISOString();
    // Prefer the gameweek with the next upcoming fixture
    const { data: upcoming } = await sb
      .from('hf_fixtures')
      .select('gameweek')
      .gte('kickoff_utc', now)
      .order('kickoff_utc')
      .limit(1);
    if (upcoming?.length) {
      gw = upcoming[0].gameweek;
    } else {
      // Fall back to most recent finished gameweek
      const { data: recent } = await sb
        .from('hf_fixtures')
        .select('gameweek')
        .order('kickoff_utc', { ascending: false })
        .limit(1);
      if (recent?.length) gw = recent[0].gameweek;
    }
  }

  let query = sb.from('hf_fixtures').select('*').order('kickoff_utc');
  if (gw) query = query.eq('gameweek', gw);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ gameweek: gw, fixtures: data });
};
