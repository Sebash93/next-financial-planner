const TAG_COLORS_PALETTE = [
  "#e60049",
  "#0bb4ff",
  "#50e991",
  "#e6d800",
  "#9b19f5",
  "#ffa300",
  "#dc0ab4",
  "#b3d4ff",
  "#00bfa0",
];

export const getNextTagColor = (tags?: string[]) => {
  const usedColors = new Set(tags);
  const availableColors = TAG_COLORS_PALETTE.filter((color) => !usedColors.has(color));
  return availableColors[0] || TAG_COLORS_PALETTE[0];
};
