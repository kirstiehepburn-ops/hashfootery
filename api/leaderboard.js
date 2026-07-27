const sb   = require('./_db');
const cors = require('./_cors');

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // All registered players
  const { data: allPlayers } = await sb
    .from('hf_players')
    .select('id, name, bluesky_handle')
    .order('name');

  // Match predictions (scored only)
  const { data: preds } = await sb
    .from('hf_predictions')
    .select('player_id, points, hf_fixtures(status)')
    .eq('hf_fixtures.status', 'finished')
    .not('points', 'is', null);

  // Season predictions
  const { data: season } = await sb
    .from('hf_season_predictions')
    .select('player_id, pts_champion, pts_relegated, pts_top4, pts_golden_boot, pts_assists, pts_manager, pts_red_card, pts_hat_trick, pts_spurs');

  // Seed all players with 0 points
  const players = {};
  for (const p of allPlayers || []) {
    players[p.id] = {
      name:           p.name,
      bluesky_handle: p.bluesky_handle || null,
      match_pts:      0,
      season_pts:     0,
      total:          0,
      exact:          0,
      played:         0,
    };
  }

  for (const p of preds || []) {
    if (!players[p.player_id]) continue;
    players[p.player_id].match_pts += p.points;
    players[p.player_id].played    += 1;
    if (p.points === 3) players[p.player_id].exact += 1;
  }

  for (const s of season || []) {
    if (!players[s.player_id]) continue;
    const sp = (s.pts_champion||0) + (s.pts_relegated||0) + (s.pts_top4||0) +
               (s.pts_golden_boot||0) + (s.pts_assists||0) + (s.pts_manager||0) +
               (s.pts_red_card||0) + (s.pts_hat_trick||0) + (s.pts_spurs||0);
    players[s.player_id].season_pts += sp;
  }

  for (const p of Object.values(players)) {
    p.total = p.match_pts + p.season_pts;
  }

  const standings = Object.values(players)
    .sort((a, b) => b.total - a.total || b.exact - a.exact);

  res.json(standings);
};
