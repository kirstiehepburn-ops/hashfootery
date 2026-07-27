const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { data, error } = await sb
    .from('hf_teams')
    .select('name, manager')
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
