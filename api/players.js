const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/players?name=X  — look up player
  if (req.method === 'GET') {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'name required' });
    const { data, error } = await sb
      .from('hf_players')
      .select('*')
      .ilike('name', name)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // POST /api/players  — register { name, bluesky_handle }
  if (req.method === 'POST') {
    const { name, bluesky_handle } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'name required' });
    const { data, error } = await sb
      .from('hf_players')
      .upsert(
        { name: name.trim(), bluesky_handle: bluesky_handle?.trim() || null },
        { onConflict: 'name' }
      )
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  res.status(405).end();
};
