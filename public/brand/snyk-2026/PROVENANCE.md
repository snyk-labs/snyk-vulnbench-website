# Snyk 2026 brand asset provenance

The files in this directory are byte-identical copies of approved assets from
the local Snyk 2026 brand-guidelines skill. They are served locally and must not
be edited or recompressed.

## `logo-snyk-white.png`

- Source: `/Users/lirantal/.cursor/skills/apply-brand-guidelines/assets/logo-snyk-white.png`
- Role: Official white Snyk wordmark
- Dimensions: 1276 × 659 pixels
- SHA-256: `f1cb84a4c98337403f7b2598eeeda0547735e0ffd9842d8211eb582eb3d8dd61`

## `BRC_Fabric_Gradient.png`

- Source: `/Users/lirantal/.cursor/skills/apply-brand-guidelines/assets/BRC_Fabric_Gradient.png`
- Role: Bottom-right full Brand Gradient fabric for Family A
- Dimensions: 5667 × 3316 pixels
- SHA-256: `2416ded175f378f9b4a69b233022084d0430a99a7124ee9a7b0590f182c42259`

## `BRC_Fabric_NoGradient.png`

- Source: `/Users/lirantal/.cursor/skills/apply-brand-guidelines/assets/BRC_Fabric_NoGradient.png`
- Role: Bottom-right purple-only fabric accent for Family B
- Dimensions: 5733 × 3355 pixels
- SHA-256: `84ab4f561189a7e3e92e58b7332c98d31fccdf481aa4d15894fa44f7b0c52385`

## `social-2.0.png`

- Source: the Snyk 2026 build's generated `/social/2.0/release.svg` card
- Role: Snyk VulnBench 2.0 Open Graph preview for unfurlers that do not render SVG
- Regenerate: serve a Snyk 2026 build with `npm run build && npm run preview`, then
  run `node scripts/rasterise-social-card.mjs <preview-origin>/social/2.0/release.svg public/brand/snyk-2026/social-2.0.png`
- Dimensions: 1200 × 630 pixels
- SHA-256: `346e48090d63c23a86ad9316bf22127e96ac5ffdd0fa6baa68d246b5a295722f`
