export const themeIds = [
  'default',
  'EVA-01',
  'EVA-02',
] as const;

export type ThemeId = (typeof themeIds)[number];

export function isThemeId(value: string): value is ThemeId {
  return themeIds.includes(value as ThemeId);
}
