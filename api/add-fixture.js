const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { admin_key, gameweek, home_team, away_team, kickoff_utc } = req.body || {};
  if (admin_key !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorised' });
  if (!gameweek || !home_team || !away_team || !kickoff_utc)
    return res.status(400).json({ error: 'gameweek, home_team, away_team, kickoff_utc required' });

  const { data, error } = await sb
    .from('hf_fixtures')
    .insert({ gameweek, home_team, away_team, kickoff_utc })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, fixture: data });
};
