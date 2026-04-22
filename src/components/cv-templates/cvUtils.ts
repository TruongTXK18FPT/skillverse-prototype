/** Strip stray JSON quotes from a plain string (name, title, etc.) */
export const cleanCVString = (value: string): string => {
  if (!value) return value;
  return value.replace(/^"(.*)"$/, "$1").replace(/\\"/g, '"').trim();
};
