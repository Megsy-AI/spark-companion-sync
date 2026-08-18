/** Deterministic SVG cover art for each game (no external assets needed). */

const PALETTES: [string, string][] = [
  ["#ff8a3d", "#ff2d55"],
  ["#5ac8fa", "#0a84ff"],
  ["#30d158", "#0a84ff"],
  ["#bf5af2", "#ff375f"],
  ["#ffd60a", "#ff9f0a"],
  ["#64d2ff", "#5e5ce6"],
  ["#ff375f", "#bf5af2"],
  ["#a3e635", "#16a34a"],
];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/** Returns a data-URI SVG cover for a game. */
export const gameArt = (slug: string, name: string): string => {
  const h = hash(slug);
  const [a, b] = PALETTES[h % PALETTES.length];
  const angle = h % 90;
  const dots = Array.from({ length: 7 }, (_, i) => {
    const x = ((hash(slug + i) % 90) + 5).toFixed(1);
    const y = ((hash(slug + "y" + i) % 90) + 5).toFixed(1);
    const r = ((hash(slug + "r" + i) % 8) + 3).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0.14" />`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="100%" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#g)"/>
  ${dots}
  <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
    font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700"
    fill="#fff" opacity="0.92">${initials(name)}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
