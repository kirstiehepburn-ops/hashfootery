-- 2026-27 Premier League teams and managers
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS hf_teams (
  id      serial PRIMARY KEY,
  name    text NOT NULL UNIQUE,
  manager text
);

INSERT INTO hf_teams (name, manager) VALUES
  ('Arsenal',                  'Mikel Arteta'),
  ('Aston Villa',              'Unai Emery'),
  ('AFC Bournemouth',          'Marco Rose'),
  ('Brentford',                'Keith Andrews'),
  ('Brighton & Hove Albion',   'Fabian Hürzeler'),
  ('Chelsea',                  'Xabi Alonso'),
  ('Coventry City',            'Frank Lampard'),
  ('Crystal Palace',           'Pierre Sage'),
  ('Everton',                  'David Moyes'),
  ('Fulham',                   'Álvaro Arbeloa'),
  ('Hull City',                'Sergej Jakirovic'),
  ('Ipswich Town',             'Gary O''Neil'),
  ('Leeds United',             'Daniel Farke'),
  ('Liverpool',                'Andoni Iraola'),
  ('Manchester City',          'Enzo Maresca'),
  ('Manchester United',        'Michael Carrick'),
  ('Newcastle United',         'Eddie Howe'),
  ('Nottingham Forest',        'Oliver Glasner'),
  ('Sunderland',               'Regis Le Bris'),
  ('Tottenham Hotspur',        'Roberto De Zerbi')
ON CONFLICT (name) DO UPDATE SET manager = EXCLUDED.manager;
