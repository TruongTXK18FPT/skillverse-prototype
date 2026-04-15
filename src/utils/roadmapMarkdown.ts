const unescapeMarkdown = (value: string): string =>
  value
    .replace(/\\n/g, "\n")
    .replace(/\\([`*_{}\[\]()#+\-.!>])/g, "$1");

export const normalizeRoadmapMarkdown = (value?: string | null): string =>
  unescapeMarkdown((value ?? "").trim());

export const toRoadmapPlainTextPreview = (
  value?: string | null,
  maxLength = 180,
): string => {
  const normalized = normalizeRoadmapMarkdown(value)
    .replace(/!\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/[*_~>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
};
