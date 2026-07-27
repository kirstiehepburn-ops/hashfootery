const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Get all scored predictions joined with player names
  const { data: preds, error } = await sb
    .from('hf_predictions')
    .select('player_id, points, home_score, away_score, fixture_id, hf_players(name), hf_fixtures(gameweek, home_score, away_score, status)')
    .eq('hf_fixtures.status', 'finished')
    .not('points', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  // Aggregate by player
  const players = {};
  for (const p of preds || []) {
    const name = p.hf_players?.name;
    if (!name) continue;
    if (!players[name]) players[name] = { name, total: 0, exact: 0, outcome: 0, played: 0 };
    players[name].total += p.points;
    players[name].played += 1;
    if (p.points === 3) players[name].exact += 1;
    else if (p.points === 1) players[name].outcome += 1;
  }

  const standings = Object.values(players)
    .sort((a, b) => b.total - a.total || b.exact - a.exact);

  res.json(standings);
};
