-- Gameweek 1 fixtures — 2026/27 Premier League
-- All times UTC (BST = UTC+1)
-- Run in Supabase SQL editor AFTER adding fixtures via admin, or use this to bulk-insert

INSERT INTO hf_fixtures (gameweek, home_team, away_team, kickoff_utc, status) VALUES
  -- Friday 21 Aug
  (1, 'Arsenal',              'Coventry City',        '2026-08-21T19:00:00Z', 'scheduled'),   -- X
  -- Saturday 22 Aug
  (1, 'Hull City',            'Manchester United',    '2026-08-22T11:30:00Z', 'scheduled'),   -- X
  (1, 'Everton',              'Crystal Palace',       '2026-08-22T14:00:00Z', 'scheduled'),   -- X
  (1, 'Ipswich Town',         'Sunderland',           '2026-08-22T14:00:00Z', 'scheduled'),   -- X
  (1, 'Nottingham Forest',    'Leeds United',         '2026-08-22T14:00:00Z', 'scheduled'),   -- X
  (1, 'Brentford',            'Tottenham Hotspur',    '2026-08-22T16:30:00Z', 'scheduled'),   -- X
  -- Sunday 23 Aug
  (1, 'Brighton & Hove Albion', 'Aston Villa',        '2026-08-23T13:00:00Z', 'scheduled'),   -- X
  (1, 'Manchester City',      'AFC Bournemouth',      '2026-08-23T13:00:00Z', 'scheduled'),   -- X
  (1, 'Newcastle United',     'Liverpool',            '2026-08-23T15:30:00Z', 'scheduled'),   -- X
  -- Monday 24 Aug
  (1, 'Fulham',               'Chelsea',              '2026-08-24T19:00:00Z', 'scheduled')    -- X
ON CONFLICT DO NOTHING;
