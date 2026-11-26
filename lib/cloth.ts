export const CLOTH_COLORS = [
  "#1f4a3a",
  "#7b2d26",
  "#2f3e5c",
  "#5d4a6b",
  "#3c5a3f",
  "#6b5532",
  "#24343f",
  "#8a3a2c",
] as const;

export function clothColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return CLOTH_COLORS[Math.abs(hash) % CLOTH_COLORS.length];
}
