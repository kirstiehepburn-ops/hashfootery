const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET ?player_id=X
  if (req.method === 'GET') {
    const { player_id } = req.query;
    if (!player_id) return res.status(400).json({ error: 'player_id required' });
    const { data, error } = await sb
      .from('hf_season_predictions')
      .select('*')
      .eq('player_id', player_id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // POST — save season predictions
  if (req.method === 'POST') {
    const { player_id, ...picks } = req.body || {};
    if (!player_id) return res.status(400).json({ error: 'player_id required' });

    // Check lock
    const { data: results } = await sb
      .from('hf_season_results')
      .select('lock_at')
      .eq('id', 1)
      .single();
    if (results?.lock_at && new Date() >= new Date(results.lock_at)) {
      return res.status(403).json({ error: 'Season predictions are locked' });
    }

    const { data, error } = await sb
      .from('hf_season_predictions')
      .upsert({ player_id, ...picks, submitted_at: new Date().toISOString() }, { onConflict: 'player_id' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, prediction: data });
  }

  res.status(405).end();
};
