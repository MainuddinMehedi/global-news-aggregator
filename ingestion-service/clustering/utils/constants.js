export const ALLOWED_IMPACTS = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export const ALLOWED_STATUSES = new Set([
  "EMERGING",
  "ESCALATING",
  "DEVELOPING",
  "SLOW_BURN",
  "STABLE",
  "RESOLVING",
  "ARCHIVED",
]);

export const ENTITY_ALIASES = new Map([
  ["u.s.", "united states"],
  ["us", "united states"],
  ["usa", "united states"],
  ["u.s.a.", "united states"],
  ["america", "united states"],
  ["uk", "united kingdom"],
  ["u.k.", "united kingdom"],
  ["britain", "united kingdom"],
  ["eu", "european union"],
  ["u.n.", "united nations"],
  ["un", "united nations"],
]);

export const ENTITY_TITLE_PREFIXES = [
  "president",
  "prime minister",
  "foreign minister",
  "defense minister",
  "defence minister",
  "secretary of state",
  "king",
  "queen",
  "prince",
  "princess",
  "dr",
  "mr",
  "mrs",
  "ms",
];
