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
const ALLOWED_ALPHA_BY_HEX = new Map([
  ["FFFFFF", new Set([0.04, 0.08, 0.12, 0.18, 0.24, 0.4, 0.65, 0.78])],
  ["030328", new Set([0.12, 0.3, 0.62, 0.72])],
  ["2B0250", new Set([0.04, 0.08, 0.12, 0.18, 0.24])],
  ["6F00DD", new Set([0.04, 0.08, 0.12, 0.18, 0.24])],
  ["FF00FF", new Set([0.04, 0.08, 0.12, 0.18, 0.24])],
  ["F3552E", new Set([0.04, 0.08, 0.12, 0.18, 0.24])],
  ["FE9104", new Set([0.04, 0.08, 0.12, 0.18, 0.24])],
]);
const ALLOWED_HEX_ALPHA_BY_HEX = new Map([
  ["FFFFFF", new Set(["0A", "14", "1F", "2E", "3D", "66", "A6", "C7"])],
  ["030328", new Set(["1F", "4D", "9E", "B8"])],
  ["2B0250", new Set(["0A", "14", "1F", "2E", "3D"])],
  ["6F00DD", new Set(["0A", "14", "1F", "2E", "3D"])],
  ["FF00FF", new Set(["0A", "14", "1F", "2E", "3D"])],
  ["F3552E", new Set(["0A", "14", "1F", "2E", "3D"])],
  ["FE9104", new Set(["0A", "14", "1F", "2E", "3D"])],
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
const CSS_NAMED_COLORS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque blanchedalmond
  blue blueviolet brown burlywood cadetblue chartreuse chocolate coral
  cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod
  darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange
  darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray
  darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey
  dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
  gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo
  ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue
  lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey
  lightpink lightsalmon lightseagreen lightskyblue lightslategray
  lightslategrey lightsteelblue lightyellow lime limegreen linen magenta
  maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
  mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue
  mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange
  orangered orchid palegoldenrod palegreen paleturquoise palevioletred
  papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
  rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna
  silver skyblue slateblue slategray slategrey snow springgreen steelblue tan
  teal thistle tomato turquoise violet wheat whitesmoke yellow yellowgreen`
    .split(/\s+/u)
    .filter(Boolean),
);
for (const systemColor of `accentcolor accentcolortext activetext buttonborder
  buttonface buttontext canvas canvastext field fieldtext graytext highlight
  highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext
  activeborder activecaption appworkspace background buttonhighlight
  buttonshadow captiontext inactiveborder inactivecaption inactivecaptiontext
  infobackground infotext menu menutext scrollbar threedarkshadow threedface
  threedhighlight threedlightshadow threedshadow window windowframe windowtext`
  .split(/\s+/u)
  .filter(Boolean)) {
  CSS_NAMED_COLORS.add(systemColor);
}
const ALLOWED_COLOR_KEYWORDS = new Set([
  "black",
  "white",
  "transparent",
  "currentcolor",
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  "none",
]);
const FORBIDDEN_CSS = [
  /-webkit-background-clip\s*:\s*text/giu,
  /(?<!-)background-clip\s*:\s*text/giu,
  /-webkit-text-fill-color\s*:\s*transparent/giu,
  /(?:-webkit-)?mask-image\s*:/giu,
  /(?:-webkit-)?mask-composite\s*:/giu,
];
const SOURCE_COMPOSITIONS = [
  {
    name: "branded page source",
    targets: [
      { path: "src/styles/tokens-snyk-2026.css" },
      { path: "src/styles/global.css", marked: true },
      { path: "src/layouts/BaseLayout.astro" },
      { path: "src/components/home/Hero.astro", marked: true },
      { path: "src/components/site/BrandFabric.astro" },
      { path: "src/components/site/PageHero.astro", marked: true },
      { path: "src/components/site/SiteFooter.astro", marked: true },
      { path: "src/components/site/SiteHeader.astro", marked: true },
      { path: "src/components/site/SnykLogo.astro" },
    ],
  },
  {
    name: "branded social source",
    targets: [
      { path: "src/components/social/share-card.ts", marked: true },
      { path: "src/pages/brand/snyk-2026/social.svg.ts" },
      { path: "src/pages/social/js-1.0/[view].svg.ts" },
    ],
  },
  {
    name: "branded favicon source",
    targets: [{ path: "public/brand/snyk-2026/favicon.svg" }],
  },
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
        ALLOWED_HEX_ALPHA_BY_HEX.get(color)?.has(alpha) === true);
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

function parseRgbChannel(value) {
  if (/^-?(?:\d+|\d*\.\d+)%$/u.test(value)) {
    return (Number.parseFloat(value) / 100) * 255;
  }
  return /^-?(?:\d+|\d*\.\d+)$/u.test(value)
    ? Number.parseFloat(value)
    : Number.NaN;
}

function parseAlpha(value) {
  if (value === undefined) return undefined;
  if (/^(?:\d+|\d*\.\d+)%$/u.test(value)) {
    return Number.parseFloat(value) / 100;
  }
  return /^(?:\d+|\d*\.\d+)$/u.test(value)
    ? Number.parseFloat(value)
    : Number.NaN;
}

function approvedAlpha(hex, alpha) {
  return ALLOWED_ALPHA_BY_HEX.get(hex)?.has(alpha) === true;
}

function parseRgbLiteral(body) {
  if (/\bfrom\b/iu.test(body)) return null;

  let channels;
  let alphaValue;
  const slashParts = body.split(/\s*\/\s*/u);
  if (slashParts.length > 2) return null;

  if (slashParts[0].includes(",")) {
    const parts = slashParts[0].split(/\s*,\s*/u);
    if (parts.length === 4 && slashParts.length === 1) {
      alphaValue = parts.pop();
    }
    if (parts.length !== 3) return null;
    channels = parts;
  } else {
    channels = slashParts[0].trim().split(/\s+/u);
    if (channels.length !== 3) return null;
  }
  if (slashParts.length === 2) alphaValue = slashParts[1].trim();

  const rgb = channels.map(parseRgbChannel);
  const alpha = parseAlpha(alphaValue);
  if (
    rgb.some(
      (channel) =>
        !Number.isFinite(channel) ||
        channel < 0 ||
        channel > 255 ||
        Math.abs(channel - Math.round(channel)) > 0.000001,
    ) ||
    (alpha !== undefined &&
      (!Number.isFinite(alpha) || alpha < 0 || alpha > 1))
  ) {
    return null;
  }

  const hex = rgb
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return {
    allowed:
      alpha === undefined || alpha === 1
        ? ALLOWED_HEX.has(hex)
        : approvedAlpha(hex, alpha),
  };
}

function auditColorFunctions(source, fileName) {
  const findings = [];
  for (const match of source.matchAll(/\b(rgb|rgba)\(([^)]*)\)/giu)) {
    const parsed = parseRgbLiteral(match[2]);
    if (!parsed?.allowed) {
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
  for (const match of source.matchAll(
    /\b(?:hsl|hsla|hwb|lab|lch|oklab|oklch|color|device-cmyk)\(/giu,
  )) {
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

function declarations(source) {
  return [...source.matchAll(/(--[\w-]+|[\w-]+)\s*:\s*([^;}\n]+)/giu)].map(
    (match) => ({
      index: match.index,
      property: match[1],
      value: match[2].trim(),
    }),
  );
}

function collectCustomProperties(source, customProperties = new Map()) {
  for (const declaration of declarations(source)) {
    if (!declaration.property.startsWith("--")) continue;
    const values = customProperties.get(declaration.property) ?? [];
    values.push(declaration.value);
    customProperties.set(declaration.property, values);
  }
  return customProperties;
}

function stripQuotedContent(value) {
  let quote = null;
  let escaped = false;
  return [...value]
    .map((character) => {
      if (escaped) {
        escaped = false;
        return quote ? " " : character;
      }
      if (character === "\\") {
        escaped = true;
        return quote ? " " : character;
      }
      if (quote) {
        if (character === quote) quote = null;
        return " ";
      }
      if (character === '"' || character === "'") {
        quote = character;
        return " ";
      }
      return character;
    })
    .join("");
}

function sanitizeQuotedCustomProperties(source) {
  return source.replace(
    /(--[\w-]+\s*:\s*)([^;}\n]+)/giu,
    (_match, prefix, value) => prefix + stripQuotedContent(value),
  );
}

function findVarCall(value) {
  const match = /\bvar\(/iu.exec(stripQuotedContent(value));
  if (!match) return null;
  const start = match.index;
  let depth = 1;
  for (let index = start + match[0].length; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    if (value[index] === ")") depth -= 1;
    if (depth === 0) {
      const body = value.slice(start + match[0].length, index);
      let nested = 0;
      let comma = -1;
      for (let bodyIndex = 0; bodyIndex < body.length; bodyIndex += 1) {
        if (body[bodyIndex] === "(") nested += 1;
        if (body[bodyIndex] === ")") nested -= 1;
        if (body[bodyIndex] === "," && nested === 0) {
          comma = bodyIndex;
          break;
        }
      }
      return {
        end: index + 1,
        fallback: comma >= 0 ? body.slice(comma + 1).trim() : undefined,
        name: (comma >= 0 ? body.slice(0, comma) : body).trim(),
        start,
      };
    }
  }
  return {
    end: value.length,
    fallback: undefined,
    name: "<unterminated>",
    start,
  };
}

function resolveCustomValue(value, customProperties, stack = []) {
  const call = findVarCall(value);
  if (!call) return { errors: [], values: [value] };
  if (!/^--[\w-]+$/u.test(call.name)) {
    return {
      errors: [
        {
          rule: "unresolved-custom-property",
          message: `Invalid custom-property reference ${call.name}`,
        },
      ],
      values: [],
    };
  }
  if (stack.includes(call.name)) {
    return {
      errors: [
        {
          rule: "custom-property-cycle",
          message: `Custom-property cycle: ${[...stack, call.name].join(" -> ")}`,
        },
      ],
      values: [],
    };
  }

  const definitions = customProperties.get(call.name);
  const candidates =
    definitions && definitions.length > 0
      ? definitions
      : call.fallback === undefined
        ? []
        : [call.fallback];
  if (candidates.length === 0) {
    return {
      errors: [
        {
          rule: "unresolved-custom-property",
          message: `Unresolved custom property ${call.name}`,
        },
      ],
      values: [],
    };
  }

  const errors = [];
  const values = [];
  for (const candidate of candidates) {
    const resolvedCandidate = resolveCustomValue(candidate, customProperties, [
      ...stack,
      call.name,
    ]);
    errors.push(...resolvedCandidate.errors);
    for (const replacement of resolvedCandidate.values) {
      const replaced =
        value.slice(0, call.start) + replacement + value.slice(call.end);
      const resolvedRemainder = resolveCustomValue(
        replaced,
        customProperties,
        stack,
      );
      errors.push(...resolvedRemainder.errors);
      values.push(...resolvedRemainder.values);
    }
  }
  return { errors, values };
}

function customPropertyFindings(
  resolution,
  source,
  fileName,
  index,
) {
  const seen = new Set();
  return resolution.errors.flatMap((error) => {
    const key = `${error.rule}:${error.message}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [finding(fileName, source, index, error.rule, error.message)];
  });
}

function auditCustomPropertyColors(source, fileName, customProperties) {
  const findings = [];
  for (const declaration of declarations(source)) {
    if (!declaration.property.startsWith("--")) continue;
    const resolution = resolveCustomValue(
      stripQuotedContent(declaration.value),
      customProperties,
    );
    findings.push(
      ...customPropertyFindings(
        resolution,
        source,
        fileName,
        declaration.index,
      ),
    );
    for (const value of resolution.values) {
      const unquoted = stripQuotedContent(value);
      findings.push(
        ...auditHexColors(unquoted, fileName),
        ...auditColorFunctions(unquoted, fileName),
        ...auditNamedColorValue(
          unquoted,
          source,
          fileName,
          declaration.index,
        ),
      );
    }
  }
  return findings;
}

function colorDeclarationValues(source) {
  const values = [];
  for (const declaration of declarations(source)) {
    const property = declaration.property.toLowerCase();
    const isColorProperty =
      /(?:color|background|border|outline|shadow|fill|stroke|paint|decoration|caret|accent|column-rule|surface|paper|ink|purple|matched|unmatched|warning|heatmap|series|focus|theme)/u.test(
        property,
      );
    if (isColorProperty) {
      values.push({ index: declaration.index, value: declaration.value });
    }
  }
  for (const match of source.matchAll(
    /\b(?:fill|stroke|color|stop-color|flood-color|lighting-color)=["']([^"']+)["']/giu,
  )) {
    values.push({ index: match.index, value: match[1] });
  }
  return values;
}

function auditNamedColorValue(value, source, fileName, index) {
  const findings = [];
  for (const token of value.match(/[a-z][a-z-]*/giu) ?? []) {
    const normalized = token.toLowerCase();
    if (
      CSS_NAMED_COLORS.has(normalized) &&
      !ALLOWED_COLOR_KEYWORDS.has(normalized)
    ) {
      findings.push(
        finding(
          fileName,
          source,
          index,
          "off-palette",
          `${token} is a named color outside the locked Snyk 2026 palette`,
        ),
      );
    }
  }
  return findings;
}

function auditResolvedColors(source, fileName, customProperties) {
  const findings = [];
  for (const declaration of colorDeclarationValues(source)) {
    const resolution = resolveCustomValue(
      declaration.value,
      customProperties,
    );
    findings.push(
      ...customPropertyFindings(
        resolution,
        source,
        fileName,
        declaration.index,
      ),
    );
    for (const value of resolution.values) {
      const unquoted = stripQuotedContent(value);
      findings.push(
        ...auditNamedColorValue(
          unquoted,
          source,
          fileName,
          declaration.index,
        ),
      );
      if (declaration.value.includes("var(")) {
        findings.push(
          ...auditHexColors(unquoted, fileName),
          ...auditColorFunctions(unquoted, fileName),
        );
      }
    }
  }
  return findings;
}

function fontDeclarationValues(source) {
  const values = declarations(source)
    .filter(({ property }) =>
      /^(?:--font[\w-]*|font-family|font)$/iu.test(property),
    )
    .map(({ index, value }) => ({ index, value }));
  for (const match of source.matchAll(/font-family\s*=\s*["']([^"']*)["']/giu)) {
    values.push({ index: match.index, value: match[1] });
  }
  return values;
}

function auditFonts(source, fileName, customProperties) {
  const findings = [];
  for (const declaration of fontDeclarationValues(source)) {
    const resolution = resolveCustomValue(
      declaration.value,
      customProperties,
    );
    findings.push(
      ...customPropertyFindings(
        resolution,
        source,
        fileName,
        declaration.index,
      ),
    );
    for (const stack of resolution.values) {
      for (const font of OFF_BRAND_FONTS) {
        if (
          new RegExp(`\\b${font.replace(" ", "\\s+")}\\b`, "iu").test(stack)
        ) {
          findings.push(
            finding(
              fileName,
              source,
              declaration.index,
              "off-brand-font",
              `'${font}' appears in a branded font-family; use Geist or Geist Mono`,
            ),
          );
        }
      }
    }
  }
  return findings;
}

function auditGradients(source, fileName, checkGradientCount = true) {
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

  if (checkGradientCount && sanctionedCount > 1) {
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
  return { findings, sanctionedCount };
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
  {
    customProperties,
    fileName = "<input>",
    checkGradientCount = true,
    checkOverflowGuard = true,
  } = {},
) {
  const resolvedCustomProperties =
    customProperties ?? collectCustomProperties(source);
  const literalAuditSource = sanitizeQuotedCustomProperties(source);
  const gradientAudit = auditGradients(
    source,
    fileName,
    checkGradientCount,
  );
  return [
    ...auditForbiddenCss(source, fileName),
    ...auditHexColors(literalAuditSource, fileName),
    ...auditColorFunctions(literalAuditSource, fileName),
    ...auditCustomPropertyColors(
      source,
      fileName,
      resolvedCustomProperties,
    ),
    ...auditResolvedColors(source, fileName, resolvedCustomProperties),
    ...auditFonts(source, fileName, resolvedCustomProperties),
    ...gradientAudit.findings,
    ...(checkOverflowGuard ? auditOverflowGuard(source, fileName) : []),
  ];
}

export function auditComposition(
  fragments,
  { fileName = "branded composition", checkOverflowGuard = false } = {},
) {
  const findings = [];
  let sanctionedCount = 0;
  const customProperties = new Map();
  for (const fragment of fragments) {
    collectCustomProperties(fragment.source, customProperties);
  }
  for (const fragment of fragments) {
    findings.push(
      ...auditText(fragment.source, {
        customProperties,
        fileName: fragment.fileName,
        checkGradientCount: false,
        checkOverflowGuard: false,
      }),
    );
    sanctionedCount += auditGradients(
      fragment.source,
      fragment.fileName,
      false,
    ).sanctionedCount;
  }
  if (sanctionedCount > 1) {
    findings.push({
      fileName,
      line: 0,
      rule: "gradient-count",
      message: `Found ${sanctionedCount} sanctioned gradients; one is allowed per composition`,
    });
  }
  if (checkOverflowGuard) {
    findings.push(
      ...auditOverflowGuard(
        fragments.map(({ source }) => source).join("\n"),
        fileName,
      ),
    );
  }
  return findings;
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

export function extractSnykAuditBlocks(source, fileName = "<mixed source>") {
  const startPattern =
    /(?:\/\*|<!--)\s*snyk-2026-audit:start\s*(?:\*\/|-->)/giu;
  const endPattern =
    /(?:\/\*|<!--)\s*snyk-2026-audit:end\s*(?:\*\/|-->)/giu;
  const blockPattern =
    /(?:\/\*|<!--)\s*snyk-2026-audit:start\s*(?:\*\/|-->)([\s\S]*?)(?:\/\*|<!--)\s*snyk-2026-audit:end\s*(?:\*\/|-->)/giu;
  const startCount = [...source.matchAll(startPattern)].length;
  const endCount = [...source.matchAll(endPattern)].length;
  const blocks = [...source.matchAll(blockPattern)].map((match) => match[1]);
  if (
    startCount === 0 ||
    startCount !== endCount ||
    blocks.length !== startCount
  ) {
    throw new Error(
      `${fileName} is missing snyk-2026 audit blocks or has unbalanced markers`,
    );
  }
  const outside = source.replace(blockPattern, "");
  if (
    /snyk-2026/iu.test(outside) ||
    /\bisSnyk2026Design\b/u.test(outside)
  ) {
    throw new Error(
      `${fileName} contains a Snyk-branded construct outside marked audit blocks`,
    );
  }
  return blocks.join("\n");
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
  for (const composition of SOURCE_COMPOSITIONS) {
    const fragments = [];
    for (const target of composition.targets) {
      const original = await readTarget(root, target.path);
      fragments.push({
        fileName: target.path,
        source: target.marked
          ? extractSnykAuditBlocks(original, target.path)
          : original,
      });
    }
    findings.push(
      ...auditComposition(fragments, {
        fileName: composition.name,
        checkOverflowGuard: composition.name === "branded page source",
      }),
    );
  }

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
