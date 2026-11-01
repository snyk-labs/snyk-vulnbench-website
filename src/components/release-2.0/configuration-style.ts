import type { V20Configuration } from "../../data/releases/2.0-content";

const familyToken = {
  purple: "var(--figure-purple)",
  orange: "var(--figure-orange)",
  pink: "var(--figure-pink)",
} as const;

export function configurationColour({
  colourFamily,
  colourStrength,
}: Pick<V20Configuration, "colourFamily" | "colourStrength">) {
  if (colourFamily === "ink") return "var(--ink)";
  const colour = familyToken[colourFamily];
  return colourStrength >= 100
    ? colour
    : `color-mix(in srgb, ${colour} ${colourStrength}%, var(--paper-raised))`;
}
