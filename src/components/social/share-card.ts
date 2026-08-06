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

export interface SocialChartPoint {
  name: string;
  type: "model" | "command";
  x: number;
  y: number;
}

export interface DefaultSocialCardData {
  agreementVariance: SocialChartPoint[];
}

const defaultAgreementVariance: SocialChartPoint[] = [
  { name: "Snyk Code SAST", type: "command", x: 0, y: 1 },
  {
    name: "Claude Opus 4.6 Medium",
    type: "model",
    x: 0.0024674185437360318,
    y: 0.7537982017982017,
  },
  {
    name: "Claude Opus 4.6 High",
    type: "model",
    x: 0.0028950633451438217,
    y: 0.7523507864684335,
  },
  {
    name: "Claude Sonnet 4.6 Medium",
    type: "model",
    x: 0.009170103518359875,
    y: 0.6741726708074535,
  },
  {
    name: "Claude Opus 4.7 Max",
    type: "model",
    x: 0.022273540769297218,
    y: 0.6876156355721573,
  },
  {
    name: "Claude Sonnet 4.6 High",
    type: "model",
    x: 0.03471337765983303,
    y: 0.6488264834580625,
  },
];

type RenderOptions =
  | { designTheme: "classic" }
  /* snyk-2026-audit:start */
  | { designTheme: "snyk-2026"; assets: BrandSocialAssets };
/* snyk-2026-audit:end */

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

/* snyk-2026-audit:start */
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
  <image href="${escapeXml(assets.wordmarkUrl)}" x="780" y="72" width="140" height="72" preserveAspectRatio="xMidYMid meet"/>`;
}

function renderBrandedReleaseCard(
  card: ReleaseShareCard,
  assets: BrandSocialAssets,
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(card.title)}</title>
  <desc id="description">${escapeXml(card.finding)}</desc>
  ${brandCanvas(assets)}
  <text x="70" y="74" fill="#FFFFFF" font-family="Geist Mono" font-size="18" font-weight="500" letter-spacing="1.5">${escapeXml(card.eyebrow.toUpperCase())}</text>
  <text fill="#FFFFFF" font-family="Geist" font-size="48" font-weight="700" letter-spacing="-1">${textLines(card.title, 70, 150, 53, 31)}</text>
  <text x="70" y="282" fill="#FFFFFF" font-family="Geist" font-size="25" font-weight="500">${escapeXml(card.finding)}</text>
  <text x="70" y="330" fill="#FFFFFF" fill-opacity="0.65" font-family="Geist Mono" font-size="15" font-weight="500" letter-spacing="1">${escapeXml(card.metric.toUpperCase())}</text>
  <text x="70" y="370" fill="#FFFFFF" font-family="Geist" font-size="28" font-weight="700">${escapeXml(card.value)} · ${escapeXml(card.unit)}</text>
  <rect x="70" y="405" width="860" height="82" fill="#030328" stroke="#FFFFFF" stroke-opacity="0.24"/>
  <text x="94" y="436" fill="#FFFFFF" fill-opacity="0.65" font-family="Geist Mono" font-size="14" font-weight="500" letter-spacing="1">KEEP IN MIND</text>
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

function scaleChartValue(
  value: number,
  minimum: number,
  maximum: number,
  start: number,
  end: number,
) {
  return start + ((value - minimum) / (maximum - minimum)) * (end - start);
}

function chartMarker(
  point: SocialChartPoint,
  index: number,
  x: number,
  y: number,
) {
  const color =
    point.type === "command"
      ? "#6F00DD"
      : ["#FF00FF", "#F3552E", "#FE9104", "#2B0250", "#6F00DD"][
          index % 5
        ];
  const common = `data-point-name="${escapeXml(point.name)}" fill="${color}" stroke="#030328" stroke-width="2"`;

  switch (index % 5) {
    case 1:
      return `<rect ${common} x="${x - 8}" y="${y - 8}" width="16" height="16"/>`;
    case 2:
      return `<path ${common} d="M ${x} ${y - 10} L ${x + 10} ${y} L ${x} ${y + 10} L ${x - 10} ${y} Z"/>`;
    case 3:
      return `<path ${common} d="M ${x} ${y - 10} L ${x + 10} ${y + 8} L ${x - 10} ${y + 8} Z"/>`;
    case 4:
      return `<path ${common} d="M ${x - 10} ${y} H ${x + 10} M ${x} ${y - 10} V ${y + 10}"/>`;
    default:
      return `<circle ${common} cx="${x}" cy="${y}" r="9"/>`;
  }
}

function renderLightAgreementChart(points: SocialChartPoint[]) {
  const plot = {
    left: 680,
    right: 1100,
    top: 170,
    bottom: 420,
  };
  const xMinimum = 0;
  const xMaximum = 0.04;
  const yMinimum = 0.6;
  const yMaximum = 1;
  const xTicks = [0, 0.01, 0.02, 0.03, 0.04];
  const yTicks = [0.6, 0.7, 0.8, 0.9, 1];
  const grid = [
    ...yTicks.map((tick) => {
      const y = scaleChartValue(
        tick,
        yMinimum,
        yMaximum,
        plot.bottom,
        plot.top,
      );
      return `<line x1="${plot.left}" x2="${plot.right}" y1="${y}" y2="${y}" stroke="#030328" stroke-opacity="0.12"/>`;
    }),
    ...xTicks.map((tick) => {
      const x = scaleChartValue(
        tick,
        xMinimum,
        xMaximum,
        plot.left,
        plot.right,
      );
      return `<line x1="${x}" x2="${x}" y1="${plot.top}" y2="${plot.bottom}" stroke="#030328" stroke-opacity="0.12"/>`;
    }),
  ].join("");
  const ticks = [
    ...yTicks.map((tick) => {
      const y = scaleChartValue(
        tick,
        yMinimum,
        yMaximum,
        plot.bottom,
        plot.top,
      );
      return `<text x="${plot.left - 18}" y="${y + 5}" text-anchor="end" fill="#030328" fill-opacity="0.68" font-family="Geist Mono" font-size="14">${Math.round(tick * 100)}%</text>`;
    }),
    ...xTicks.map((tick) => {
      const x = scaleChartValue(
        tick,
        xMinimum,
        xMaximum,
        plot.left,
        plot.right,
      );
      return `<text x="${x}" y="${plot.bottom + 28}" text-anchor="middle" fill="#030328" fill-opacity="0.68" font-family="Geist Mono" font-size="14">${(tick * 100).toFixed(0)} pp</text>`;
    }),
  ].join("");
  const markers = points
    .map((point, index) => {
      const x = scaleChartValue(
        point.x,
        xMinimum,
        xMaximum,
        plot.left,
        plot.right,
      );
      const y = scaleChartValue(
        point.y,
        yMinimum,
        yMaximum,
        plot.bottom,
        plot.top,
      );
      return chartMarker(point, index, x, y);
    })
    .join("");
  const legend = points
    .map((point, index) => {
      const label = point.name
        .replace("Claude ", "")
        .replace("Snyk Code SAST", "Snyk Code");
      const x = 610 + (index % 3) * 165;
      const y = 476 + Math.floor(index / 3) * 24;
      const symbol = ["●", "■", "◆", "▲", "✚"][index % 5];
      const color = point.type === "command" ? "#6F00DD" : "#F3552E";
      return `<text x="${x}" y="${y}" fill="#030328" font-family="Geist Mono" font-size="12"><tspan fill="${color}">${symbol}</tspan> ${escapeXml(label)}</text>`;
    })
    .join("");

  return `<text x="610" y="105" fill="#030328" font-family="Geist Mono" font-size="16" font-weight="500" letter-spacing="1">AGREEMENT VS REPEATED-RUN VARIANCE</text>
  <text x="610" y="132" fill="#030328" fill-opacity="0.68" font-family="Geist" font-size="17">Higher F1 and lower spread move toward the upper-left.</text>
  <rect x="595" y="72" width="555" height="465" fill="#FFFFFF" stroke="#030328" stroke-opacity="0.2"/>
  ${grid}
  <line x1="${plot.left}" x2="${plot.right}" y1="${plot.bottom}" y2="${plot.bottom}" stroke="#030328" stroke-width="2"/>
  <line x1="${plot.left}" x2="${plot.left}" y1="${plot.top}" y2="${plot.bottom}" stroke="#030328" stroke-width="2"/>
  ${ticks}
  ${markers}
  <text x="890" y="515" text-anchor="middle" fill="#030328" font-family="Geist Mono" font-size="14">F1 standard deviation (percentage points)</text>
  <text x="628" y="300" text-anchor="middle" transform="rotate(-90 628 300)" fill="#030328" font-family="Geist Mono" font-size="14">Snyk-reference F1 (%)</text>
  ${legend}`;
}

export function renderDefaultSocialCard(
  assets: BrandSocialAssets,
  data?: DefaultSocialCardData,
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" data-light-social-card="" role="img" aria-labelledby="title description">
  <title id="title">Snyk VulnBench JS 1.0</title>
  <desc id="description">Can LLMs find the same bugs twice? A repeatability and Snyk-reference agreement study.</desc>
  ${brandDefinitions(assets)}
  <rect data-social-background="" data-copy-region="" width="1200" height="630" fill="#FFFFFF"/>
  <rect data-gradient-accent="" data-brand-background="" width="1200" height="10" fill="url(#brand-gradient)"/>
  <text x="70" y="78" fill="#030328" font-family="Geist Mono" font-size="18" font-weight="500" letter-spacing="1.5">SNYK VULNBENCH JS 1.0</text>
  <text fill="#030328" font-family="Geist" font-size="55" font-weight="700" letter-spacing="-1.5">${textLines("Can LLMs find the same bugs twice?", 70, 165, 55, 18)}</text>
  <text fill="#030328" fill-opacity="0.68" font-family="Geist" font-size="20">${textLines("A repeatability and Snyk-reference agreement study", 70, 300, 27, 32)}</text>
  <rect x="70" y="350" width="455" height="132" fill="#FFFFFF" stroke="#030328" stroke-opacity="0.2"/>
  <text x="96" y="386" fill="#6F00DD" font-family="Geist Mono" font-size="15" font-weight="500" letter-spacing="1">SCIENTIFIC SCOPE</text>
  <text x="96" y="430" fill="#030328" font-family="Geist" font-size="34" font-weight="700">49.7%</text>
  <text x="250" y="430" fill="#030328" fill-opacity="0.68" font-family="Geist" font-size="18">unmatched findings</text>
  <text x="96" y="449" fill="#030328" fill-opacity="0.68" font-family="Geist Mono" font-size="13">appeared in only one of five runs</text>
  <text x="96" y="474" fill="#030328" fill-opacity="0.68" font-family="Geist Mono" font-size="13">80 of 161 unique unmatched signatures</text>
  <text x="70" y="506" fill="#030328" fill-opacity="0.68" font-family="Geist" font-size="17">Reference agreement is not universal accuracy.</text>
  <text x="70" y="548" fill="#030328" font-family="Geist Mono" font-size="15" font-weight="500">300 scans</text>
  <text x="190" y="548" fill="#030328" font-family="Geist Mono" font-size="15" font-weight="500">10 projects</text>
  <text x="325" y="548" fill="#030328" font-family="Geist Mono" font-size="15" font-weight="500">6 configurations</text>
  <text x="488" y="548" fill="#030328" font-family="Geist Mono" font-size="15" font-weight="500">5 repetitions</text>
  ${renderLightAgreementChart(data?.agreementVariance ?? defaultAgreementVariance)}
  <rect data-footer-background="" x="0" y="532" width="1200" height="98" fill="#000000"/>
  <image href="${escapeXml(assets.wordmarkUrl)}" x="70" y="559" width="108" height="43" preserveAspectRatio="xMidYMid meet"/>
  <text x="220" y="568" fill="#FFFFFF" fill-opacity="0.68" font-family="Geist Mono" font-size="12">Dataset 1.0.0 · deterministic Snyk Code reference set</text>
  <text x="220" y="592" fill="#FFFFFF" font-family="Geist Mono" font-size="12">Source: published benchmark evidence · vulnbench.com</text>
</svg>`;
}
/* snyk-2026-audit:end */
