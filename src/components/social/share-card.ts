export interface ReleaseShareCard {
  eyebrow: string;
  title: string;
  finding: string;
  metric: string;
  value: string;
  unit: string;
  source: string;
  caveat: string;
}

export interface BrandSocialAssets {
  geistFontUrl: string;
  geistMonoFontUrl: string;
  wordmarkUrl: string;
}

type RenderOptions =
  | { designTheme: "classic" }
  | { designTheme: "snyk-2026"; assets: BrandSocialAssets };

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

function wrapText(value: string, maximumCharacters: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maximumCharacters || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(
  value: string,
  x: number,
  y: number,
  lineHeight: number,
  maximumCharacters: number,
) {
  return wrapText(value, maximumCharacters)
    .map(
      (line, index) =>
        `<tspan x="${x}" y="${y + index * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
}

function renderClassicReleaseCard(card: ReleaseShareCard) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(card.title)}</title>
  <desc id="description">${escapeXml(card.finding)}</desc>
  <rect width="1200" height="630" fill="#f7f4ed"/>
  <rect x="0" width="28" height="630" fill="#4b2be3"/>
  <text x="80" y="92" fill="#4b2be3" font-family="monospace" font-size="24" font-weight="700">${escapeXml(card.eyebrow.toUpperCase())}</text>
  <text x="80" y="190" fill="#17141f" font-family="Arial, sans-serif" font-size="58" font-weight="700">${escapeXml(card.title)}</text>
  <rect x="80" y="252" width="1040" height="2" fill="#aaa1b0"/>
  <text x="80" y="315" fill="#17141f" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeXml(card.finding)}</text>
  <text x="80" y="365" fill="#625d68" font-family="monospace" font-size="17">${escapeXml(card.metric.toUpperCase())}</text>
  <text x="80" y="400" fill="#4b2be3" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeXml(card.value)} · ${escapeXml(card.unit)}</text>
  <rect x="80" y="430" width="1040" height="92" fill="#eee9df" stroke="#aaa1b0"/>
  <text x="108" y="468" fill="#625d68" font-family="monospace" font-size="18">KEEP IN MIND</text>
  <text x="108" y="498" fill="#17141f" font-family="Arial, sans-serif" font-size="22">${escapeXml(card.caveat)}</text>
  <text x="80" y="560" fill="#625d68" font-family="monospace" font-size="16">Source: ${escapeXml(card.source)}</text>
  <text x="80" y="592" fill="#625d68" font-family="monospace" font-size="18">Dataset 1.0.0 · Snyk VulnBench JS 1.0 · vulnbench.com</text>
</svg>`;
}

function brandDefinitions(assets: BrandSocialAssets) {
  return `<defs>
    <style>
      @font-face { font-family: "Geist"; src: url("${escapeXml(assets.geistFontUrl)}") format("woff2"); font-style: normal; font-weight: 100 900; }
      @font-face { font-family: "Geist Mono"; src: url("${escapeXml(assets.geistMonoFontUrl)}") format("woff2"); font-style: normal; font-weight: 100 900; }
    </style>
    <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2B0250"/>
      <stop offset="6%" stop-color="#6F00DD"/>
      <stop offset="30%" stop-color="#FF00FF"/>
      <stop offset="66%" stop-color="#F3552E"/>
      <stop offset="100%" stop-color="#FE9104"/>
    </linearGradient>
  </defs>`;
}

function brandCanvas(assets: BrandSocialAssets) {
  return `${brandDefinitions(assets)}
  <rect data-brand-background="" width="1200" height="630" fill="url(#brand-gradient)"/>
  <rect data-copy-region="" width="1000" height="630" fill="#030328"/>
  <line x1="999" y1="0" x2="999" y2="630" stroke="#FFFFFF" stroke-opacity="0.24"/>
  <image href="${escapeXml(assets.wordmarkUrl)}" x="800" y="48" width="140" height="72" preserveAspectRatio="xMidYMid meet"/>`;
}

function renderBrandedReleaseCard(
  card: ReleaseShareCard,
  assets: BrandSocialAssets,
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(card.title)}</title>
  <desc id="description">${escapeXml(card.finding)}</desc>
  ${brandCanvas(assets)}
  <text x="70" y="74" fill="#FFFFFF" font-family="Geist Mono" font-size="18" font-weight="600" letter-spacing="1.5">${escapeXml(card.eyebrow.toUpperCase())}</text>
  <text fill="#FFFFFF" font-family="Geist" font-size="48" font-weight="700" letter-spacing="-1">${textLines(card.title, 70, 150, 53, 31)}</text>
  <text x="70" y="282" fill="#FFFFFF" font-family="Geist" font-size="25" font-weight="500">${escapeXml(card.finding)}</text>
  <text x="70" y="330" fill="#FFFFFF" fill-opacity="0.65" font-family="Geist Mono" font-size="15" font-weight="600" letter-spacing="1">${escapeXml(card.metric.toUpperCase())}</text>
  <text x="70" y="370" fill="#FFFFFF" font-family="Geist" font-size="28" font-weight="700">${escapeXml(card.value)} · ${escapeXml(card.unit)}</text>
  <rect x="70" y="405" width="860" height="82" fill="#030328" stroke="#FFFFFF" stroke-opacity="0.24"/>
  <text x="94" y="436" fill="#FFFFFF" fill-opacity="0.65" font-family="Geist Mono" font-size="14" font-weight="600" letter-spacing="1">KEEP IN MIND</text>
  <text x="94" y="468" fill="#FFFFFF" font-family="Geist" font-size="20">${escapeXml(card.caveat)}</text>
  <text x="70" y="535" fill="#FFFFFF" fill-opacity="0.65" font-family="Geist Mono" font-size="15">Source: ${escapeXml(card.source)}</text>
  <text x="70" y="575" fill="#FFFFFF" font-family="Geist Mono" font-size="16">Dataset 1.0.0 · Snyk VulnBench JS 1.0 · vulnbench.com</text>
</svg>`;
}

export function renderReleaseShareCard(
  card: ReleaseShareCard,
  options: RenderOptions,
) {
  return options.designTheme === "classic"
    ? renderClassicReleaseCard(card)
    : renderBrandedReleaseCard(card, options.assets);
}

export function renderDefaultSocialCard(assets: BrandSocialAssets) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">Snyk VulnBench JS 1.0</title>
  <desc id="description">Can LLMs find the same bugs twice? A repeatability and Snyk-reference agreement study.</desc>
  ${brandCanvas(assets)}
  <text x="70" y="78" fill="#FFFFFF" font-family="Geist Mono" font-size="18" font-weight="600" letter-spacing="1.5">SNYK VULNBENCH JS 1.0</text>
  <text fill="#FFFFFF" font-family="Geist" font-size="55" font-weight="700" letter-spacing="-1.5">${textLines("Can LLMs find the same bugs twice?", 70, 170, 62, 27)}</text>
  <text x="70" y="302" fill="#FFFFFF" font-family="Geist" font-size="24">A repeatability and Snyk-reference agreement study</text>
  <line x1="70" y1="340" x2="930" y2="340" stroke="#FFFFFF" stroke-opacity="0.24"/>
  <text x="70" y="392" fill="#FFFFFF" font-family="Geist Mono" font-size="17" font-weight="600">300 scans</text>
  <text x="250" y="392" fill="#FFFFFF" font-family="Geist Mono" font-size="17" font-weight="600">10 projects</text>
  <text x="430" y="392" fill="#FFFFFF" font-family="Geist Mono" font-size="17" font-weight="600">6 configurations</text>
  <text x="675" y="392" fill="#FFFFFF" font-family="Geist Mono" font-size="17" font-weight="600">5 repetitions</text>
  <rect x="70" y="426" width="860" height="74" fill="#030328" stroke="#FFFFFF" stroke-opacity="0.24"/>
  <text x="94" y="455" fill="#FFFFFF" fill-opacity="0.65" font-family="Geist Mono" font-size="13" font-weight="600" letter-spacing="1">SCIENTIFIC SCOPE</text>
  <text x="94" y="483" fill="#FFFFFF" font-family="Geist" font-size="19">Reference agreement is not universal accuracy.</text>
  <text x="70" y="543" fill="#FFFFFF" fill-opacity="0.65" font-family="Geist Mono" font-size="14">Source: published benchmark evidence</text>
  <text x="70" y="579" fill="#FFFFFF" font-family="Geist Mono" font-size="16">Dataset 1.0.0 · Deterministic Snyk Code reference set · vulnbench.com</text>
</svg>`;
}
