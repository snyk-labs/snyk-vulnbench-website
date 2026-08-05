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

export function serializeSvg(svg: SVGElement) {
  const clone = svg.cloneNode(true) as SVGElement;
  if (!clone.hasAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
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
  }>,
) {
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
      return `<g><text x="16" y="${y + 18}" font-family="sans-serif" font-size="14">${xmlEscape(row.label)}</text><rect x="${labelWidth}" y="${y}" width="${barWidth}" height="24" fill="#087c71"/><text x="${labelWidth + barWidth + 8}" y="${y + 18}" font-family="monospace" font-size="12">${xmlEscape(row.displayValue ?? `${row.value}/${row.maximum}`)}</text></g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${xmlEscape(title)}" viewBox="0 0 ${width} ${height}"><title>${xmlEscape(title)}</title><rect width="100%" height="100%" fill="#fffdf8"/><text x="16" y="28" font-family="sans-serif" font-size="18" font-weight="700">${xmlEscape(title)}</text>${bars}</svg>`;
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
