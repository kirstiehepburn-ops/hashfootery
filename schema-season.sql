-- Season predictions tables
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS hf_season_predictions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       uuid REFERENCES hf_players(id) ON DELETE CASCADE UNIQUE,
  -- Season picks
  champion        text,
  relegated_1     text,
  relegated_2     text,
  top4_1          text,
  top4_2          text,
  top4_3          text,
  top4_4          text,
  golden_boot     text,
  most_assists    text,
  manager_sacked  text,
  red_card        text,
  first_hat_trick text,
  spurs_position  int,
  submitted_at    timestamptz DEFAULT now(),
  -- Calculated points (set when results known)
  pts_champion    int,
  pts_relegated   int,
  pts_top4        int,
  pts_golden_boot int,
  pts_assists     int,
  pts_manager     int,
  pts_red_card    int,
  pts_hat_trick   int,
  pts_spurs       int
);

CREATE TABLE IF NOT EXISTS hf_season_results (
  id               int PRIMARY KEY DEFAULT 1,
  lock_at          timestamptz,
  champion         text,
  relegated_1      text,
  relegated_2      text,
  top4_1           text,
  top4_2           text,
  top4_3           text,
  top4_4           text,
  golden_boot      text,
  most_assists     text,
  manager_sacked   text,
  first_red_card   text,
  other_red_cards  text[] DEFAULT '{}',
  first_hat_trick  text,
  spurs_position   int
);
INSERT INTO hf_season_results (id) VALUES (1) ON CONFLICT DO NOTHING;
