/**
 * Normalize a taxonomy code to UPPER_SNAKE_CASE.
 * Mirrors the backend `TaxonomyServiceImpl.normalizeCode()` logic.
 *
 * Rules:
 *  - Trim whitespace
 *  - Uppercase
 *  - Replace spaces, hyphens, dots → underscore
 *  - Collapse multiple underscores → single underscore
 *  - Strip leading/trailing underscores
 *
 * Examples:
 *  "backend dev"      → "BACKEND_DEV"
 *  "se"               → "SE"
 *  "Backend-Dev"      → "BACKEND_DEV"
 *  "BACKEND_JAVA"     → "BACKEND_JAVA"
 *  " FRONTEND DEV "   → "FRONTEND_DEV"
 */
export function normalizeTaxonomyCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s\-.]+/g, '_') // Convert spaces/hyphens/dots to underscore
    .replace(/[^A-Z0-9_]/g, '') // Remove any other special characters
    .replace(/_+/g, '_')       // Collapse multiple underscores
    .replace(/^_/, '');        // Strip leading underscore only (allow trailing for typing)
}
