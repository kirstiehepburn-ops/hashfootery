-- hashfootery DB schema
-- Run this in the Supabase SQL editor

-- Players
CREATE TABLE IF NOT EXISTS hf_players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text UNIQUE NOT NULL,
  bluesky_handle text UNIQUE,
  created_at    timestamptz DEFAULT now()
);

-- Fixtures (admin-entered per gameweek)
CREATE TABLE IF NOT EXISTS hf_fixtures (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gameweek      int NOT NULL,
  home_team     text NOT NULL,
  away_team     text NOT NULL,
  kickoff_utc   timestamptz NOT NULL,
  home_score    int,
  away_score    int,
  status        text DEFAULT 'scheduled', -- scheduled | finished
  created_at    timestamptz DEFAULT now()
);

-- Predictions
CREATE TABLE IF NOT EXISTS hf_predictions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        uuid REFERENCES hf_players(id) ON DELETE CASCADE,
  fixture_id       uuid REFERENCES hf_fixtures(id) ON DELETE CASCADE,
  home_score       int NOT NULL,
  away_score       int NOT NULL,
  source           text DEFAULT 'web', -- web | bluesky
  bluesky_post_uri text,
  submitted_at     timestamptz DEFAULT now(),
  points           int,
  UNIQUE(player_id, fixture_id)
);

-- Bluesky poll state (tracks last checked cursor)
CREATE TABLE IF NOT EXISTS hf_poll_state (
  id         int PRIMARY KEY DEFAULT 1,
  last_cursor text,
  updated_at  timestamptz DEFAULT now()
);
INSERT INTO hf_poll_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hf_fixtures_gw ON hf_fixtures(gameweek);
CREATE INDEX IF NOT EXISTS idx_hf_predictions_player ON hf_predictions(player_id);
CREATE INDEX IF NOT EXISTS idx_hf_predictions_fixture ON hf_predictions(fixture_id);
