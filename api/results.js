const sb   = require('./_db');
const cors = require('./_cors');

// Scoring: 3pts exact score, 1pt correct outcome
function calcPoints(predH, predA, realH, realA) {
  if (predH === realH && predA === realA) return 3;
  const predOutcome = Math.sign(predH - predA);
  const realOutcome = Math.sign(realH - realA);
  return predOutcome === realOutcome ? 1 : 0;
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Auth via admin key
  const { admin_key, fixture_id, home_score, away_score } = req.body || {};
  if (admin_key !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorised' });
  if (!fixture_id || home_score == null || away_score == null)
    return res.status(400).json({ error: 'fixture_id, home_score, away_score required' });

  const h = parseInt(home_score), a = parseInt(away_score);

  // Save result on fixture
  const { error: fxErr } = await sb
    .from('hf_fixtures')
    .update({ home_score: h, away_score: a, status: 'finished' })
    .eq('id', fixture_id);
  if (fxErr) return res.status(500).json({ error: fxErr.message });

  // Score all predictions for this fixture
  const { data: preds } = await sb
    .from('hf_predictions')
    .select('id, home_score, away_score')
    .eq('fixture_id', fixture_id);

  if (preds?.length) {
    const updates = preds.map(p => ({
      id: p.id,
      points: calcPoints(p.home_score, p.away_score, h, a)
    }));
    for (const u of updates) {
      await sb.from('hf_predictions').update({ points: u.points }).eq('id', u.id);
    }
  }

  res.json({ ok: true, predictions_scored: preds?.length ?? 0 });
};
