const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { player_id, fixture_ids } = req.query;
  if (!player_id || !fixture_ids)
    return res.status(400).json({ error: 'player_id and fixture_ids required' });

  const ids = fixture_ids.split(',').filter(Boolean);
  const { data, error } = await sb
    .from('hf_predictions')
    .select('fixture_id, home_score, away_score, source, points')
    .eq('player_id', player_id)
    .in('fixture_id', ids);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
