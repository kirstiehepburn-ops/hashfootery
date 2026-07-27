const sb   = require('./_db');
const cors = require('./_cors');

const norm = s => (s||'').toLowerCase().replace(/[^a-z0-9]/g,'');

function scoreTop4(pred, results) {
  const actual = [results.top4_1, results.top4_2, results.top4_3, results.top4_4].map(norm);
  const picked = [pred.top4_1,   pred.top4_2,   pred.top4_3,   pred.top4_4  ].map(norm);
  let pts = 0;
  picked.forEach((team, i) => {
    if (!team) return;
    if (team === actual[i]) pts += 4;           // exact position
    else if (actual.includes(team)) pts += 2;   // in top 4, wrong spot
  });
  return pts;
}

function scoreAll(pred, r) {
  let pts = { champion:0, relegated:0, top4:0, golden_boot:0, assists:0, manager:0, red_card:0, hat_trick:0, spurs:0 };

  if (r.champion        && norm(pred.champion)        === norm(r.champion))        pts.champion    = 10;
  if (r.golden_boot     && norm(pred.golden_boot)     === norm(r.golden_boot))     pts.golden_boot = 8;
  if (r.most_assists    && norm(pred.most_assists)    === norm(r.most_assists))    pts.assists     = 6;
  if (r.manager_sacked  && norm(pred.manager_sacked)  === norm(r.manager_sacked))  pts.manager     = 6;
  if (r.first_hat_trick && norm(pred.first_hat_trick) === norm(r.first_hat_trick)) pts.hat_trick   = 6;
  if (r.spurs_position  && pred.spurs_position === r.spurs_position)               pts.spurs       = 5;

  // Relegated - 5pts each
  const rel = [r.relegated_1, r.relegated_2].filter(Boolean).map(norm);
  if (rel.includes(norm(pred.relegated_1))) pts.relegated += 5;
  if (rel.includes(norm(pred.relegated_2))) pts.relegated += 5;

  // Top 4
  if (r.top4_1) pts.top4 = scoreTop4(pred, r);

  // Red card - 5pts first, 3pts subsequent
  if (r.first_red_card && norm(pred.red_card) === norm(r.first_red_card)) {
    pts.red_card = 5;
  } else if (pred.red_card) {
    const others = (r.other_red_cards||[]).map(norm);
    if (others.includes(norm(pred.red_card))) pts.red_card = 3;
  }

  return pts;
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { admin_key, ...updates } = req.body || {};
  if (admin_key !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorised' });

  // Upsert results
  const { error: rErr } = await sb
    .from('hf_season_results')
    .update(updates)
    .eq('id', 1);
  if (rErr) return res.status(500).json({ error: rErr.message });

  // Fetch full results row + all player predictions
  const { data: r } = await sb.from('hf_season_results').select('*').eq('id', 1).single();
  const { data: preds } = await sb.from('hf_season_predictions').select('*');

  // Rescore all players
  let scored = 0;
  for (const pred of preds || []) {
    const pts = scoreAll(pred, r);
    await sb.from('hf_season_predictions').update({
      pts_champion:    pts.champion,
      pts_relegated:   pts.relegated,
      pts_top4:        pts.top4,
      pts_golden_boot: pts.golden_boot,
      pts_assists:     pts.assists,
      pts_manager:     pts.manager,
      pts_red_card:    pts.red_card,
      pts_hat_trick:   pts.hat_trick,
      pts_spurs:       pts.spurs,
    }).eq('id', pred.id);
    scored++;
  }

  res.json({ ok: true, players_scored: scored });
};
