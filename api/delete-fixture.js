import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { admin_key, fixture_id } = req.body;

  if (admin_key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!fixture_id) return res.status(400).json({ error: 'fixture_id required' });

  // Delete any predictions for this fixture first
  await supabase.from('hf_predictions').delete().eq('fixture_id', fixture_id);

  // Delete the fixture
  const { error } = await supabase
    .from('hf_fixtures')
    .delete()
    .eq('id', fixture_id);

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ ok: true });
}
