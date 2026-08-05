#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SANCTIONED_GRADIENT =
  "linear-gradient(90deg, #2B0250 0%, #6F00DD 6%, #FF00FF 30%, #F3552E 66%, #FE9104 100%)";
const SANCTIONED_SVG_STOPS = [
  ["0%", "#2B0250"],
  ["6%", "#6F00DD"],
  ["30%", "#FF00FF"],
  ["66%", "#F3552E"],
  ["100%", "#FE9104"],
];
const ALLOWED_HEX = new Set([
  "000000",
  "030328",
  "2B0250",
  "6F00DD",
  "F3552E",
  "FE9104",
  "FF00FF",
  "FFFFFF",
]);
const ALLOWED_WHITE_ALPHA = new Set([
  "0.04",
  "0.08",
  "0.12",
  "0.18",
  "0.24",
  "0.4",
  "0.40",
  "0.65",
  "0.78",
]);
const ALLOWED_WHITE_HEX_ALPHA = new Set([
  "0A",
  "14",
  "1F",
  "2E",
  "3D",
  "66",
  "A6",
  "C7",
]);
const OFF_BRAND_FONTS = [
  "Inter",
  "Aeonik",
  "DM Sans",
  "Roboto",
  "Montserrat",
  "Arial",
  "Helvetica",
];
const FORBIDDEN_CSS = [
  /-webkit-background-clip\s*:\s*text/giu,
  /(?<!-)background-clip\s*:\s*text/giu,
  /-webkit-text-fill-color\s*:\s*transparent/giu,
  /(?:-webkit-)?mask-image\s*:/giu,
  /(?:-webkit-)?mask-composite\s*:/giu,
];
const SOURCE_TARGETS = [
  "src/styles/tokens-snyk-2026.css",
  "src/layouts/BaseLayout.astro",
  "src/components/home/Hero.astro",
  "src/components/site/BrandFabric.astro",
  "src/components/site/SiteFooter.astro",
  "src/components/site/SiteHeader.astro",
  "src/components/site/SnykLogo.astro",
  "src/components/social/share-card.ts",
  "src/pages/brand/snyk-2026/social.svg.ts",
  "src/pages/social/js-1.0/[view].svg.ts",
  "public/brand/snyk-2026/favicon.svg",
];
const GENERATED_SVG_TARGETS = [
  "dist/brand/snyk-2026/social.svg",
  "dist/social/js-1.0/summary.svg",
  "dist/social/js-1.0/repeatability.svg",
  "dist/social/js-1.0/coverage.svg",
  "dist/social/js-1.0/efficiency.svg",
];

function lineNumberAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function finding(fileName, source, index, rule, message) {
  return {
    fileName,
    line: index < 0 ? 0 : lineNumberAt(source, index),
    rule,
    message,
  };
}

function canonicalGradient(value) {
  return value.replace(/\s+/gu, "").toLowerCase();
}

function expandHex(value) {
  if (value.length === 3 || value.length === 4) {
    return [...value].map((character) => character.repeat(2)).join("");
  }
  return value;
}

function auditHexColors(source, fileName) {
  const findings = [];
  for (const match of source.matchAll(
    /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![0-9a-f])/giu,
  )) {
    const expanded = expandHex(match[1]).toUpperCase();
    const color = expanded.slice(0, 6);
    const alpha = expanded.slice(6);
    const allowed =
      ALLOWED_HEX.has(color) &&
      (!alpha ||
        alpha === "FF" ||
        (color === "FFFFFF" && ALLOWED_WHITE_HEX_ALPHA.has(alpha)));
    if (!allowed) {
      findings.push(
        finding(
          fileName,
          source,
          match.index,
          "off-palette",
          `${match[0]} is outside the locked Snyk 2026 palette`,
        ),
      );
    }
  }
  return findings;
}

function auditRgbColors(source, fileName) {
  const findings = [];
  for (const match of source.matchAll(
    /\brgb(a)?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9.]+))?\s*\)/giu,
  )) {
    const channels = match.slice(2, 5).map(Number);
    const alpha = match[5];
    const hex = channels
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const allowed =
      channels.every((channel) => channel <= 255) &&
      (alpha === undefined
        ? ALLOWED_HEX.has(hex)
        : hex === "FFFFFF" && ALLOWED_WHITE_ALPHA.has(alpha));
    if (!allowed) {
      findings.push(
        finding(
          fileName,
          source,
          match.index,
          "off-palette",
          `${match[0]} is outside the locked Snyk 2026 palette`,
        ),
      );
    }
  }
  for (const match of source.matchAll(/\b(?:hsl|hsla|lab|lch|oklab|oklch)\(/giu)) {
    findings.push(
      finding(
        fileName,
        source,
        match.index,
        "off-palette",
        `${match[0]} is not an approved literal color form`,
      ),
    );
  }
  return findings;
}

function auditFonts(source, fileName) {
  const findings = [];
  const fontFamilyPattern =
    /font-family\s*(?::\s*([^;}\n]+)|=\s*"([^"]*)"|=\s*'([^']*)')/giu;
  for (const match of source.matchAll(fontFamilyPattern)) {
    const stack = match.slice(1).find((value) => value !== undefined) ?? "";
    for (const font of OFF_BRAND_FONTS) {
      if (new RegExp(`\\b${font.replace(" ", "\\s+")}\\b`, "iu").test(stack)) {
        findings.push(
          finding(
            fileName,
            source,
            match.index,
            "off-brand-font",
            `'${font}' appears in a branded font-family; use Geist or Geist Mono`,
          ),
        );
      }
    }
  }
  return findings;
}

function auditGradients(source, fileName) {
  const findings = [];
  let sanctionedCount = 0;

  for (const match of source.matchAll(
    /(?:linear|radial|conic)-gradient\([^)]*\)/giu,
  )) {
    if (
      canonicalGradient(match[0]) === canonicalGradient(SANCTIONED_GRADIENT)
    ) {
      sanctionedCount += 1;
    } else {
      findings.push(
        finding(
          fileName,
          source,
          match.index,
          "unauthorized-gradient",
          "Only the exact sanctioned Snyk Brand Gradient is allowed",
        ),
      );
    }
  }

  for (const match of source.matchAll(
    /<(linearGradient|radialGradient)\b([^>]*)>([\s\S]*?)<\/\1>/giu,
  )) {
    const [, kind, attributes, body] = match;
    const stops = [...body.matchAll(
      /<stop\b[^>]*offset=["']([^"']+)["'][^>]*stop-color=["']([^"']+)["'][^>]*\/?>/giu,
    )].map((stop) => [stop[1], stop[2].toUpperCase()]);
    const horizontal =
      /\bx1=["']0%["']/iu.test(attributes) &&
      /\by1=["']0%["']/iu.test(attributes) &&
      /\bx2=["']100%["']/iu.test(attributes) &&
      /\by2=["']0%["']/iu.test(attributes);
    if (
      kind.toLowerCase() === "lineargradient" &&
      horizontal &&
      JSON.stringify(stops) === JSON.stringify(SANCTIONED_SVG_STOPS)
    ) {
      sanctionedCount += 1;
    } else {
      findings.push(
        finding(
          fileName,
          source,
          match.index,
          "unauthorized-gradient",
          "SVG gradients must use the exact horizontal Snyk Brand Gradient",
        ),
      );
    }
  }

  if (sanctionedCount > 1) {
    findings.push(
      finding(
        fileName,
        source,
        0,
        "gradient-count",
        `Found ${sanctionedCount} sanctioned gradients; one is allowed per composition`,
      ),
    );
  }
  return findings;
}

function auditForbiddenCss(source, fileName) {
  const findings = [];
  for (const pattern of FORBIDDEN_CSS) {
    for (const match of source.matchAll(pattern)) {
      findings.push(
        finding(
          fileName,
          source,
          match.index,
          "forbidden-css",
          `${match[0]} is forbidden in branded browser output`,
        ),
      );
    }
  }

  for (const match of source.matchAll(
    /(?:class\s*=\s*["'][^"']*\b|\.)((?:hero|cta)-glow)\b/giu,
  )) {
    findings.push(
      finding(
        fileName,
        source,
        match.index,
        "glow-helper",
        `${match[1]} helper classes are forbidden`,
      ),
    );
  }

  for (const match of source.matchAll(
    /font-size\s*:\s*([0-9]+(?:\.[0-9]+)?)px/giu,
  )) {
    if (Number(match[1]) >= 40) {
      findings.push(
        finding(
          fileName,
          source,
          match.index,
          "fixed-display-px",
          `Display font-size ${match[1]}px must use clamp()`,
        ),
      );
    }
  }
  return findings;
}

function auditOverflowGuard(source, fileName) {
  const hasDisplayType =
    /\bclamp\(/iu.test(source) ||
    /<h1\b/iu.test(source) ||
    /font-size\s*:\s*(?:[4-9]\d|[1-9]\d{2,})px/iu.test(source);
  if (hasDisplayType && !/overflow-x\s*:\s*hidden/iu.test(source)) {
    return [
      finding(
        fileName,
        source,
        -1,
        "missing-overflow-guard",
        "Branded display output requires an explicit overflow-x: hidden guard",
      ),
    ];
  }
  return [];
}

export function auditText(
  source,
  { fileName = "<input>", checkOverflowGuard = true } = {},
) {
  return [
    ...auditForbiddenCss(source, fileName),
    ...auditHexColors(source, fileName),
    ...auditRgbColors(source, fileName),
    ...auditFonts(source, fileName),
    ...auditGradients(source, fileName),
    ...(checkOverflowGuard ? auditOverflowGuard(source, fileName) : []),
  ];
}

export function auditGeneratedMetadata(source, fileName = "<html>") {
  const findings = [];
  if (!/<html\b[^>]*data-design-theme=["']snyk-2026["']/iu.test(source)) {
    findings.push(
      finding(
        fileName,
        source,
        0,
        "design-theme-output",
        "Generated HTML is not marked as the Snyk 2026 design",
      ),
    );
  }
  if (
    !/<link\b[^>]*rel=["']icon["'][^>]*href=["']\/brand\/snyk-2026\/favicon\.svg["']/iu.test(
      source,
    )
  ) {
    findings.push(
      finding(
        fileName,
        source,
        0,
        "branded-favicon",
        "Generated HTML does not reference the branded favicon",
      ),
    );
  }
  const socialImage = source.match(
    /<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/iu,
  )?.[1];
  if (
    !socialImage ||
    !/\/(?:brand\/snyk-2026\/social|social\/js-1\.0\/(?:summary|repeatability|coverage|efficiency))\.svg$/u.test(
      socialImage,
    )
  ) {
    findings.push(
      finding(
        fileName,
        source,
        0,
        "branded-social-image",
        "Generated HTML does not reference an approved branded social image",
      ),
    );
  }
  return findings;
}

function brandedSourceSlice(fileName, source) {
  if (fileName.endsWith("src/components/social/share-card.ts")) {
    const marker = source.indexOf("function brandDefinitions");
    return marker >= 0 ? source.slice(marker) : source;
  }
  return source;
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

async function readTarget(root, target) {
  try {
    return await readFile(resolve(root, target), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read brand audit target ${target}: ${message}`);
  }
}

export async function auditBrandProject(root = process.cwd()) {
  const findings = [];
  const responsiveSources = [];

  for (const target of SOURCE_TARGETS) {
    const source = brandedSourceSlice(target, await readTarget(root, target));
    responsiveSources.push(source);
    findings.push(
      ...auditText(source, {
        fileName: target,
        checkOverflowGuard: false,
      }),
    );
  }
  findings.push(
    ...auditOverflowGuard(
      responsiveSources.join("\n"),
      "Snyk 2026 branded source aggregate",
    ),
  );

  for (const target of GENERATED_SVG_TARGETS) {
    const source = await readTarget(root, target);
    findings.push(
      ...auditText(source, {
        fileName: target,
        checkOverflowGuard: false,
      }),
    );
  }

  const buildRoot = resolve(root, "dist");
  for (const file of await walk(buildRoot)) {
    if (extname(file) !== ".html") continue;
    const source = await readFile(file, "utf8");
    findings.push(
      ...auditGeneratedMetadata(source, relative(root, file)),
    );
  }
  return findings;
}

function printFindings(findings) {
  for (const { fileName, line, rule, message } of findings) {
    console.error(`${fileName}:${line}: [${rule}] ${message}`);
  }
}

async function main(args) {
  let findings;
  if (args.length > 0) {
    findings = [];
    for (const target of args) {
      const source = await readFile(resolve(target), "utf8");
      findings.push(...auditText(source, { fileName: target }));
    }
  } else {
    findings = await auditBrandProject();
  }

  if (findings.length > 0) {
    printFindings(findings);
    console.error(
      `FAIL — ${findings.length} mechanical Snyk 2026 brand violation(s)`,
    );
    return 1;
  }
  console.log(
    "PASS — branded sources, generated identity SVGs, and HTML metadata references satisfy the mechanical Snyk 2026 audit",
  );
  return 0;
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  process.exitCode = await main(process.argv.slice(2));
}
