function csvCell(value: string | number | null) {
  const rendered = value === null ? "N/A" : String(value);
  return /[",\r\n]/.test(rendered)
    ? `"${rendered.replaceAll('"', '""')}"`
    : rendered;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null>>,
) {
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")
    .concat("\r\n");
}

const lightExportPalette = {
  background: "#fffdf8",
  text: "#17141f",
  matched: "#087c71",
  unmatched: "#b54c31",
  neutral: "#55515f",
  fontSans:
    'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontMono:
    '"SFMono-Regular", Consolas, "Liberation Mono", ui-monospace, monospace',
};

function resolveCssValue(value: string, element?: Element): string {
  let resolved = value.trim();
  if (!resolved.includes("var(") || typeof getComputedStyle === "undefined") {
    return resolved;
  }

  const styles = getComputedStyle(element ?? document.documentElement);
  for (let depth = 0; depth < 8 && resolved.includes("var("); depth += 1) {
    const next = resolved.replace(
      /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g,
      (_match, property: string, fallback: string | undefined) =>
        styles.getPropertyValue(property).trim() || fallback?.trim() || "",
    );
    if (next === resolved) break;
    resolved = next;
  }
  return resolved.trim();
}

function activeThemeColor(property: string, fallback: string) {
  if (typeof document === "undefined" || typeof getComputedStyle === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
  return resolveCssValue(value || fallback, document.documentElement) || fallback;
}

const presentationProperties = [
  "color",
  "fill",
  "fill-opacity",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "opacity",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
] as const;

export function serializeSvg(svg: SVGElement) {
  const clone = svg.cloneNode(true) as SVGElement;
  if (!clone.hasAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  const sourceElements = [svg, ...svg.querySelectorAll("*")];
  const clonedElements = [clone, ...clone.querySelectorAll("*")];
  sourceElements.forEach((source, index) => {
    const target = clonedElements[index];
    if (!target) return;
    if (source.localName === "title" || source.localName === "desc") return;

    for (const attribute of Array.from(target.attributes)) {
      if (attribute.value.includes("var(")) {
        target.setAttribute(
          attribute.name,
          resolveCssValue(attribute.value, source),
        );
      }
    }

    if (typeof getComputedStyle === "undefined") return;
    const computed = getComputedStyle(source);
    for (const property of presentationProperties) {
      if (source.hasAttribute(property)) continue;
      const value = resolveCssValue(computed.getPropertyValue(property), source);
      if (value) target.setAttribute(property, value);
    }
    target.removeAttribute("class");
    target.removeAttribute("style");
  });

  const computedBackground =
    typeof getComputedStyle === "undefined"
      ? ""
      : resolveCssValue(getComputedStyle(svg).backgroundColor, svg);
  const background =
    computedBackground &&
    computedBackground !== "transparent" &&
    computedBackground !== "rgba(0, 0, 0, 0)"
      ? computedBackground
      : activeThemeColor("--paper-raised", lightExportPalette.background);
  const backgroundRect = clone.ownerDocument.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect",
  );
  backgroundRect.setAttribute("data-export-background", "");
  backgroundRect.setAttribute("width", "100%");
  backgroundRect.setAttribute("height", "100%");
  backgroundRect.setAttribute("fill", background);
  const title = clone.querySelector("title");
  title?.after(backgroundRect);
  if (!title) clone.prepend(backgroundRect);

  return new XMLSerializer().serializeToString(clone);
}

const xmlEscape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function barChartSvg(
  title: string,
  rows: Array<{
    label: string;
    value: number;
    maximum: number;
    displayValue?: string;
    tone?: "matched" | "unmatched" | "neutral";
  }>,
) {
  const palette = {
    background: activeThemeColor(
      "--paper-raised",
      lightExportPalette.background,
    ),
    text: activeThemeColor("--ink", lightExportPalette.text),
    matched: activeThemeColor("--matched", lightExportPalette.matched),
    unmatched: activeThemeColor("--unmatched", lightExportPalette.unmatched),
    neutral: activeThemeColor(
      "--series-fallback",
      lightExportPalette.neutral,
    ),
    fontSans: activeThemeColor("--font-sans", lightExportPalette.fontSans),
    fontMono: activeThemeColor("--font-mono", lightExportPalette.fontMono),
  };
  const width = 800;
  const labelWidth = 220;
  const chartWidth = 520;
  const rowHeight = 54;
  const height = 70 + rows.length * rowHeight;
  const bars = rows
    .map((row, index) => {
      const y = 54 + index * rowHeight;
      const barWidth =
        row.maximum <= 0 ? 0 : (row.value / row.maximum) * chartWidth;
      const barColor = palette[row.tone ?? "neutral"];
      return `<g><text x="16" y="${y + 18}" fill="${xmlEscape(palette.text)}" font-family="${xmlEscape(palette.fontSans)}" font-size="14">${xmlEscape(row.label)}</text><rect x="${labelWidth}" y="${y}" width="${barWidth}" height="24" fill="${xmlEscape(barColor)}"/><text x="${labelWidth + barWidth + 8}" y="${y + 18}" fill="${xmlEscape(palette.text)}" font-family="${xmlEscape(palette.fontMono)}" font-size="12">${xmlEscape(row.displayValue ?? `${row.value}/${row.maximum}`)}</text></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${xmlEscape(title)}" viewBox="0 0 ${width} ${height}"><title>${xmlEscape(title)}</title><rect width="100%" height="100%" fill="${xmlEscape(palette.background)}"/><text x="16" y="28" fill="${xmlEscape(palette.text)}" font-family="${xmlEscape(palette.fontSans)}" font-size="18" font-weight="700">${xmlEscape(title)}</text>${bars}</svg>`;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, csv: string) {
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

export function downloadSvg(filename: string, svg: SVGElement) {
  downloadBlob(
    filename,
    new Blob([serializeSvg(svg)], { type: "image/svg+xml;charset=utf-8" }),
  );
}

export function downloadSvgMarkup(filename: string, svg: string) {
  downloadBlob(
    filename,
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
}
