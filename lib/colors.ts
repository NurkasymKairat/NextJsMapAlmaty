export const PALETTE: readonly string[] = [
  'oklch(0.62 0.085 18)',
  'oklch(0.66 0.085 40)',
  'oklch(0.70 0.085 62)',
  'oklch(0.72 0.085 88)',
  'oklch(0.74 0.075 110)',
  'oklch(0.66 0.085 135)',
  'oklch(0.64 0.080 155)',
  'oklch(0.62 0.075 175)',
  'oklch(0.62 0.080 195)',
  'oklch(0.62 0.085 215)',
  'oklch(0.60 0.090 235)',
  'oklch(0.58 0.090 260)',
  'oklch(0.58 0.085 285)',
  'oklch(0.60 0.080 305)',
  'oklch(0.62 0.080 325)',
  'oklch(0.60 0.085 350)',
  'oklch(0.55 0.060 50)',
  'oklch(0.50 0.040 200)',
  'oklch(0.68 0.060 95)',
  'oklch(0.55 0.075 25)',
];

export function pickColor(usedCount: number): string {
  return PALETTE[usedCount % PALETTE.length];
}
