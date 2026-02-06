export const formatThousands = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return String(value);
};

export const buildLabelTexts = (labels: string[], maxLabels: number = 6) => {
  if (labels.length <= maxLabels) return labels;
  const safeMax = Math.max(2, maxLabels);
  const step = Math.ceil((labels.length - 1) / (safeMax - 1));

  return labels.map((label, index) => {
    if (index === 0 || index === labels.length - 1 || index % step === 0) return label;
    return "";
  });
};

type RGB = { r: number; g: number; b: number };

const parseHex = (hex: string): RGB | null => {
  const normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
};

const parseRgb = (color: string): RGB | null => {
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1].split(",").map((part) => Number(part.trim()));
  if (parts.length < 3) return null;
  return { r: parts[0], g: parts[1], b: parts[2] };
};

const toRgb = (color: string): RGB | null => {
  if (!color) return null;
  if (color.startsWith("#")) return parseHex(color);
  if (color.startsWith("rgb")) return parseRgb(color);
  return null;
};

const mixColors = (color: string, target: string, amount: number) => {
  const c = toRgb(color);
  const t = toRgb(target);
  if (!c || !t) return color;
  const mix = (from: number, to: number) => Math.round(from + (to - from) * amount);
  return `rgb(${mix(c.r, t.r)}, ${mix(c.g, t.g)}, ${mix(c.b, t.b)})`;
};

export const lightenColor = (color: string, amount: number) => mixColors(color, "#ffffff", amount);
export const darkenColor = (color: string, amount: number) => mixColors(color, "#000000", amount);

export const withAlpha = (color: string, alpha: number) => {
  const rgb = toRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildThemePalette = (colors: Record<string, any>, isDark: boolean) => {
  const base = [
    colors.primary,
    colors.tertiary,
    colors.secondary,
    colors.inversePrimary,
    colors.primaryContainer,
    colors.tertiaryContainer,
    colors.secondaryContainer,
    colors.error,
    colors.outline,
    colors.surfaceVariant,
  ].filter(Boolean) as string[];

  return base.map((color) => (isDark ? lightenColor(color, 0.12) : darkenColor(color, 0.05)));
};
