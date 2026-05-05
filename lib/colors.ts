export const PALETTE: readonly string[] = [
  '#E63946', // crimson
  '#F4A261', // sandy orange
  '#E9C46A', // mustard
  '#2A9D8F', // teal
  '#264653', // deep slate
  '#8AB17D', // sage green
  '#BC4749', // brick
  '#588157', // forest
  '#A663CC', // violet
  '#4361EE', // royal blue
  '#3A86FF', // sky blue
  '#FF006E', // hot pink
  '#FB5607', // bright orange
  '#FFBE0B', // amber
  '#7209B7', // deep purple
  '#06A77D', // emerald
  '#D62828', // pure red
  '#003049', // navy
  '#9D4EDD', // lavender
  '#EF476F', // rose
];

export function pickColor(usedCount: number): string {
  return PALETTE[usedCount % PALETTE.length];
}
