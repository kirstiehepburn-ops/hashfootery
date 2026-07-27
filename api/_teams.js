// Canonical team names + aliases for fuzzy Bluesky prediction matching
// Keys must match exactly what's stored in hf_fixtures / hf_teams

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ALIASES = {
  'Arsenal':                ['arsenal', 'gunners'],
  'Aston Villa':            ['astonvilla', 'villa', 'villans', 'avfc'],
  'AFC Bournemouth':        ['bournemouth', 'afcbournemouth', 'cherries', 'boscombe'],
  'Brentford':              ['brentford', 'bees'],
  'Brighton & Hove Albion': ['brighton', 'brightonandhovealbion', 'bha', 'bhafc', 'seagulls'],
  'Chelsea':                ['chelsea', 'blues', 'cfc'],
  'Coventry City':          ['coventry', 'coventrycity', 'skyblues', 'ccfc'],
  'Crystal Palace':         ['crystalpalace', 'palace', 'eagles', 'cpfc'],
  'Everton':                ['everton', 'toffees', 'efc'],
  'Fulham':                 ['fulham', 'cottagers', 'ffc'],
  'Hull City':              ['hull', 'hullcity', 'tigers'],
  'Ipswich Town':           ['ipswich', 'ipswichtown', 'tractorboys', 'town', 'itfc'],
  'Leeds United':           ['leeds', 'leedsunited', 'whites', 'peacocks', 'lufc'],
  'Liverpool':              ['liverpool', 'reds', 'lfc', 'pool'],
  'Manchester City':        ['mancity', 'manchestercity', 'city', 'mcfc', 'citizens', 'manc'],
  'Manchester United':      ['manutd', 'manunited', 'manchesterunited', 'reddevils', 'mufc', 'united'],
  'Newcastle United':       ['newcastle', 'newcastleunited', 'magpies', 'toon', 'nufc'],
  'Nottingham Forest':      ['nottinghamforest', 'forest', 'nottmforest', 'nffc', 'nottingham'],
  'Sunderland':             ['sunderland', 'blackcats', 'safc'],
  'Tottenham Hotspur':      ['tottenham', 'spurs', 'tottenhamhotspur', 'tottenhamhotspurs', 'thfc'],
};

// Build reverse lookup: normalised alias → canonical name
const ALIAS_LOOKUP = {};
for (const [canonical, aliases] of Object.entries(ALIASES)) {
  ALIAS_LOOKUP[norm(canonical)] = canonical;
  for (const a of aliases) ALIAS_LOOKUP[a] = canonical;
}

/**
 * Given a raw user-typed string, return the canonical team name or null.
 * Tries exact alias match first, then prefix matching.
 */
function resolveTeam(input) {
  const i = norm(input);
  if (!i) return null;
  // Exact match
  if (ALIAS_LOOKUP[i]) return ALIAS_LOOKUP[i];
  // Prefix: input is a prefix of an alias ("bright" → "brighton" → Brighton & Hove Albion)
  for (const [alias, canonical] of Object.entries(ALIAS_LOOKUP)) {
    if (alias.startsWith(i) && i.length >= 4) return canonical;
  }
  return null;
}

/**
 * Does the input string match a given canonical team name?
 */
function matchTeam(input, canonicalTeamName) {
  const resolved = resolveTeam(input);
  if (resolved) return resolved === canonicalTeamName;
  // Fallback: old prefix matching against the canonical name directly
  const i = norm(input), t = norm(canonicalTeamName);
  return i === t || t.startsWith(i) || i.startsWith(t);
}

module.exports = { norm, matchTeam, resolveTeam, ALIASES, ALIAS_LOOKUP };
