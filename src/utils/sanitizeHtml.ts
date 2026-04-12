import DOMPurify from 'dompurify';

/** Layout-breaking CSS properties to strip from inline styles */
const BLOCKED_CSS_PROPS = [
  'width', 'min-width', 'max-width',
  'height', 'min-height', 'max-height',
  'position', 'top', 'left', 'right', 'bottom', 'z-index',
  'display',
  'overflow', 'overflow-x', 'overflow-y',
  'flex', 'flex-grow', 'flex-shrink', 'flex-direction', 'flex-wrap',
  'grid', 'grid-template', 'grid-area', 'grid-column', 'grid-row',
  'transform',
  'background-image',
];

/**
 * Normalize layout-breaking white-space values so code formatting is preserved
 * without causing horizontal overflow / layout collapse.
 *   pre  → pre-wrap  (allows wrapping, prevents horizontal scroll)
 *   nowrap → normal   (standard wrapping)
 */
const normalizeWhiteSpace = (rawStyle: string): string => {
  const wsMatch = rawStyle.match(/(?:^|;)\s*white-space\s*:\s*(\S+)/);
  if (!wsMatch) return rawStyle;
  const val = wsMatch[1].toLowerCase().trim();
  if (val === 'pre')         return rawStyle.replace(wsMatch[0], 'white-space: pre-wrap');
  if (val === 'nowrap')     return rawStyle.replace(wsMatch[0], 'white-space: normal');
  return rawStyle;
};

/** Strip layout-breaking CSS properties from a style string */
const stripBlockedStyles = (rawStyle: string): string => {
  const kept: string[] = [];
  for (const rule of rawStyle.split(';')) {
    const colonIdx = rule.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = rule.slice(0, colonIdx).trim().toLowerCase();
    const val = rule.slice(colonIdx + 1).trim();
    if (BLOCKED_CSS_PROPS.some(b => prop.startsWith(b))) continue;
    if (prop && val) kept.push(`${prop}:${val}`);
  }
  return kept.length ? kept.join('; ') : '';
};

// Register hook once — runs after every element is sanitized
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('style')) {
    const rawStyle = node.getAttribute('style') || '';
    const normalized = normalizeWhiteSpace(rawStyle);
    const cleaned = stripBlockedStyles(normalized);
    if (cleaned) {
      node.setAttribute('style', cleaned);
    } else {
      node.removeAttribute('style');
    }
  }
});

/**
 * Sanitize HTML content before rendering via dangerouslySetInnerHTML.
 * Strips dangerous tags/scripts while preserving safe formatting.
 * Layout-breaking inline styles (width, white-space, etc.) are automatically removed.
 * Use this for: student submissions, mentor descriptions, grading criteria.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'span', 'div', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'ul', 'ol', 'li', 'a', 'font', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    ],
    ALLOWED_ATTR: ['style', 'color', 'href', 'target', 'rel', 'class'],
    FORCE_BODY: true,
  });
};