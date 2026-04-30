import { ExpertFieldResponse } from '../services/expertPromptService';

// ============================================================
// Types
// ============================================================
export interface SkillResolveResult {
  domain: string;
  industry: string;
  jobRole: string;
  keywords: string;
  score: number;
  matchDetails: string;
}

// ============================================================
// Common skill aliases — maps variant spellings to a canonical set
// so "react" also matches "reactjs", "react.js", etc.
// ============================================================
const SKILL_ALIAS_MAP: Record<string, string[]> = {
  react:        ['react', 'reactjs', 'react.js', 'react js'],
  vue:          ['vue', 'vuejs', 'vue.js', 'vue js'],
  angular:      ['angular', 'angularjs', 'angular.js'],
  node:         ['node', 'nodejs', 'node.js', 'node js'],
  next:         ['next', 'nextjs', 'next.js', 'next js'],
  nuxt:         ['nuxt', 'nuxtjs', 'nuxt.js'],
  express:      ['express', 'expressjs', 'express.js'],
  spring:       ['spring', 'springboot', 'spring boot', 'spring_boot', 'spring framework'],
  java:         ['java', 'java se', 'java ee', 'jdk'],
  python:       ['python', 'python3', 'py'],
  javascript:   ['javascript', 'js', 'ecmascript', 'es6', 'es2015'],
  typescript:   ['typescript', 'ts'],
  csharp:       ['c#', 'csharp', 'c sharp', 'dotnet', '.net', 'asp.net'],
  cpp:          ['c++', 'cpp', 'cplusplus'],
  ruby:         ['ruby', 'ruby on rails', 'rails', 'ror'],
  php:          ['php', 'laravel', 'symfony'],
  go:           ['go', 'golang'],
  rust:         ['rust', 'rustlang'],
  swift:        ['swift', 'swiftui'],
  kotlin:       ['kotlin', 'kotlin android'],
  flutter:      ['flutter', 'dart', 'flutter dart'],
  docker:       ['docker', 'dockerfile', 'docker compose', 'docker-compose'],
  kubernetes:   ['kubernetes', 'k8s', 'kube'],
  aws:          ['aws', 'amazon web services', 'amazon cloud'],
  azure:        ['azure', 'microsoft azure', 'ms azure'],
  gcp:          ['gcp', 'google cloud', 'google cloud platform'],
  sql:          ['sql', 'mysql', 'postgresql', 'postgres', 'mssql', 'sql server'],
  mongodb:      ['mongodb', 'mongo', 'mongoose'],
  redis:        ['redis', 'redis cache'],
  graphql:      ['graphql', 'gql', 'apollo graphql'],
  rest:         ['rest', 'restful', 'rest api', 'restapi'],
  figma:        ['figma', 'figma design'],
  photoshop:    ['photoshop', 'adobe photoshop', 'ps'],
  illustrator:  ['illustrator', 'adobe illustrator', 'ai design'],
  sketch:       ['sketch', 'sketch app'],
  ui:           ['ui', 'ui design', 'user interface'],
  ux:           ['ux', 'ux design', 'user experience', 'ux research'],
  uiux:         ['ui/ux', 'uiux', 'ui ux', 'ui/ux design'],
  ml:           ['ml', 'machine learning', 'deep learning'],
  ai:           ['ai', 'artificial intelligence', 'generative ai', 'gen ai'],
  devops:       ['devops', 'dev ops', 'ci/cd', 'cicd'],
  qa:           ['qa', 'quality assurance', 'testing', 'tester', 'qc'],
  selenium:     ['selenium', 'selenium webdriver'],
  git:          ['git', 'github', 'gitlab', 'bitbucket'],
  linux:        ['linux', 'ubuntu', 'centos', 'debian'],
  excel:        ['excel', 'microsoft excel', 'ms excel', 'spreadsheet'],
  powerbi:      ['powerbi', 'power bi', 'power_bi'],
  tableau:      ['tableau', 'tableau desktop'],
  seo:          ['seo', 'search engine optimization'],
  marketing:    ['marketing', 'digital marketing', 'online marketing'],
  sales:        ['sales', 'bán hàng', 'kinh doanh'],
  accounting:   ['accounting', 'kế toán', 'bookkeeping'],
  hr:           ['hr', 'human resources', 'nhân sự', 'tuyển dụng'],
};

// Build a reverse map: alias → canonical key
const REVERSE_ALIAS_MAP: Map<string, string> = new Map();
for (const [canonical, aliases] of Object.entries(SKILL_ALIAS_MAP)) {
  for (const alias of aliases) {
    REVERSE_ALIAS_MAP.set(alias, canonical);
  }
}

// ============================================================
// Normalization helpers
// ============================================================

/** Lowercase, collapse whitespace, strip leading/trailing junk */
const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[_\-/\\]+/g, ' ')
    .replace(/[^a-z0-9\s.#+]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Split into tokens, keeping multi-word aliases intact when possible */
const tokenize = (text: string): string[] => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
};

/**
 * Expand a skill input into a set of search terms including all known aliases.
 * e.g. "react" → Set{"react", "reactjs", "react.js", "react js"}
 */
const expandWithAliases = (input: string): Set<string> => {
  const normalized = normalizeText(input);
  const result = new Set<string>();
  result.add(normalized);

  // Add individual tokens
  const tokens = normalized.split(' ').filter(Boolean);
  for (const token of tokens) {
    result.add(token);
  }

  // Find canonical key for each token, then add all its aliases
  for (const token of [normalized, ...tokens]) {
    const canonical = REVERSE_ALIAS_MAP.get(token);
    if (canonical) {
      const aliases = SKILL_ALIAS_MAP[canonical];
      if (aliases) {
        for (const alias of aliases) {
          result.add(alias);
        }
      }
    }
  }

  return result;
};

const getBuiltInRoleHints = (jobRole: string, industry: string): string[] => {
  const role = normalizeText(jobRole);
  const sector = normalizeText(industry);
  const hints: string[] = [];

  if (role.includes('backend')) {
    hints.push('backend', 'api', 'server', 'java', 'spring', 'spring boot', 'node', 'express', 'nestjs', 'django', 'flask', 'laravel', 'php', 'c#', 'asp.net', 'sql', 'postgresql', 'mysql', 'redis', 'microservices');
  }
  if (role.includes('frontend')) {
    hints.push('frontend', 'react', 'reactjs', 'vue', 'angular', 'nextjs', 'javascript', 'typescript', 'html', 'css', 'tailwind', 'web ui');
  }
  if (role.includes('fullstack') || role.includes('full stack')) {
    hints.push('fullstack', 'full stack', 'mern', 'mean', 'react node', 'nextjs', 'spring react', 'web development');
  }
  if (role.includes('mobile')) {
    hints.push('mobile', 'android', 'ios', 'flutter', 'dart', 'react native', 'kotlin', 'swift');
  }
  if (role.includes('devops')) {
    hints.push('devops', 'ci cd', 'docker', 'kubernetes', 'k8s', 'terraform', 'jenkins', 'github actions');
  }
  if (role.includes('cloud')) {
    hints.push('cloud', 'aws', 'azure', 'gcp', 'google cloud', 'cloud architecture', 'cloud engineer');
  }
  if (role.includes('qa') || role.includes('tester')) {
    hints.push('qa', 'qc', 'testing', 'tester', 'selenium', 'automation test', 'manual test', 'playwright', 'cypress');
  }
  if (role.includes('ui') || role.includes('ux') || role.includes('designer')) {
    hints.push('ui', 'ux', 'ui ux', 'figma', 'wireframe', 'prototype', 'user experience', 'user interface', 'photoshop', 'illustrator');
  }
  if (role.includes('data analyst')) {
    hints.push('data analyst', 'sql', 'excel', 'power bi', 'powerbi', 'tableau', 'dashboard', 'data visualization');
  }
  if (role.includes('business intelligence') || role.includes('bi')) {
    hints.push('bi', 'business intelligence', 'power bi', 'powerbi', 'tableau', 'dashboard', 'data warehouse');
  }
  if (role.includes('data engineer')) {
    hints.push('data engineer', 'etl', 'spark', 'airflow', 'data pipeline', 'warehouse', 'big data');
  }
  if (role.includes('machine learning') || role.includes('ai engineer')) {
    hints.push('machine learning', 'ml', 'ai', 'python', 'tensorflow', 'pytorch', 'llm', 'deep learning', 'generative ai');
  }
  if (role.includes('cyber') || role.includes('security') || role.includes('pentester') || role.includes('soc')) {
    hints.push('security', 'cybersecurity', 'pentest', 'penetration testing', 'ethical hacker', 'soc', 'firewall', 'network security', 'threat');
  }
  if (role.includes('marketing') || sector.includes('marketing')) {
    hints.push('marketing', 'digital marketing', 'seo', 'ads', 'facebook ads', 'google ads', 'content marketing', 'social media', 'email marketing', 'brand');
  }
  if (role.includes('sales')) {
    hints.push('sales', 'ban hang', 'telesales', 'b2b sales', 'closing', 'crm');
  }
  if (role.includes('business analyst')) {
    hints.push('business analyst', 'ba', 'requirements', 'process', 'user story', 'brd');
  }
  if (role.includes('project manager')) {
    hints.push('project manager', 'pm', 'pmp', 'agile', 'scrum', 'kanban');
  }
  if (role.includes('hr') || role.includes('recruitment')) {
    hints.push('hr', 'human resources', 'recruitment', 'talent acquisition', 'headhunter', 'nhan su', 'tuyen dung');
  }
  if (role.includes('accounting') || role.includes('finance')) {
    hints.push('accounting', 'finance', 'ke toan', 'excel', 'financial analysis', 'bookkeeping');
  }
  if (role.includes('logistics') || role.includes('supply chain')) {
    hints.push('logistics', 'supply chain', 'procurement', 'inventory', 'import export', 'customs');
  }

  return hints;
};

/**
 * Check if two strings are "fuzzy equal" — handles cases like:
 *   "react" ↔ "reactjs"   (prefix/suffix match)
 *   "spring" ↔ "springboot" (prefix match)
 *   "c#" ↔ "csharp"       (alias match, handled separately)
 */
const fuzzyTokenMatch = (a: string, b: string): number => {
  if (a === b) return 100;

  // One contains the other exactly
  if (a.includes(b) || b.includes(a)) {
    const longer = Math.max(a.length, b.length);
    const shorter = Math.min(a.length, b.length);
    // Reward longer overlap
    return Math.round(60 + 30 * (shorter / longer));
  }

  // Strip common suffixes: "js", "lang"
  const stripSuffixes = (s: string) =>
    s.replace(/(?:js|lang|framework|dev|developer)$/i, '');
  const strippedA = stripSuffixes(a);
  const strippedB = stripSuffixes(b);
  if (strippedA && strippedB && strippedA === strippedB) return 85;
  if (strippedA && strippedB && (strippedA.includes(strippedB) || strippedB.includes(strippedA))) {
    return 70;
  }

  // Levenshtein distance for short strings (handle typos)
  if (a.length <= 12 && b.length <= 12) {
    const dist = levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    const similarity = 1 - dist / maxLen;
    if (similarity >= 0.75) {
      return Math.round(similarity * 60);
    }
  }

  return 0;
};

/** Classic Levenshtein distance */
const levenshteinDistance = (s1: string, s2: string): number => {
  const len1 = s1.length;
  const len2 = s2.length;
  const dp: number[][] = Array.from({ length: len1 + 1 }, () =>
    Array(len2 + 1).fill(0),
  );

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[len1][len2];
};

// ============================================================
// Main resolver
// ============================================================

/**
 * Resolve a skill name to the best matching career paths (domain / industry / job role).
 *
 * The algorithm works in three layers:
 *   1. **Alias expansion** — "react" expands to {"react","reactjs","react.js","react js"}
 *   2. **Keyword scoring** — each role's keywords are compared against the expanded set
 *   3. **Fuzzy fallback** — if no alias match, try substring/Levenshtein on individual tokens
 *
 * Returns an array sorted by score descending (best match first).
 */
export const resolveSkillToCareer = (
  skillInput: string,
  expertFields: ExpertFieldResponse[],
  options?: { maxResults?: number; minScore?: number },
): SkillResolveResult[] => {
  const { maxResults = 10, minScore = 15 } = options || {};
  const input = normalizeText(skillInput);
  if (!input) return [];

  const expandedTerms = expandWithAliases(input);
  const inputTokens = tokenize(input);
  const results: SkillResolveResult[] = [];

  for (const field of expertFields) {
    for (const industry of field.industries) {
      for (const role of industry.roles) {
        const roleKeywords = [
          ...(role.keywords || '')
          .split(',')
          .map((kw) => normalizeText(kw))
          .filter(Boolean),
          ...getBuiltInRoleHints(role.jobRole, industry.industry).map((kw) => normalizeText(kw)),
        ].filter(Boolean);

        const roleNameNormalized = normalizeText(role.jobRole);

        let bestScore = 0;
        let matchDetail = '';

        // ── Strategy 1: Expanded alias set vs keywords ──
        for (const term of expandedTerms) {
          for (const kw of roleKeywords) {
            if (term === kw) {
              const s = 95;
              if (s > bestScore) {
                bestScore = s;
                matchDetail = `Exact keyword: "${kw}"`;
              }
            }
          }
        }

        // ── Strategy 2: Fuzzy token match vs keywords ──
        if (bestScore < 90) {
          for (const token of inputTokens) {
            for (const kw of roleKeywords) {
              // Token against full keyword
              const s1 = fuzzyTokenMatch(token, kw);
              if (s1 > bestScore) {
                bestScore = s1;
                matchDetail = `Fuzzy keyword: "${token}" ≈ "${kw}" (${s1}%)`;
              }

              // Token against keyword tokens (for multi-word keywords like "spring boot")
              const kwTokens = kw.split(' ').filter(Boolean);
              for (const kwToken of kwTokens) {
                const s2 = fuzzyTokenMatch(token, kwToken);
                // Slightly lower weight for sub-token match
                const adjusted = Math.round(s2 * 0.9);
                if (adjusted > bestScore) {
                  bestScore = adjusted;
                  matchDetail = `Fuzzy sub-keyword: "${token}" ≈ "${kwToken}" (${adjusted}%)`;
                }
              }
            }
          }
        }

        // ── Strategy 3: Expanded alias set — fuzzy against keywords ──
        if (bestScore < 80) {
          for (const term of expandedTerms) {
            for (const kw of roleKeywords) {
              const s = fuzzyTokenMatch(term, kw);
              if (s > bestScore) {
                bestScore = s;
                matchDetail = `Alias fuzzy: "${term}" ≈ "${kw}" (${s}%)`;
              }
            }
          }
        }

        // ── Strategy 4: Match against job role name ──
        if (bestScore < 70) {
          for (const term of expandedTerms) {
            const s = fuzzyTokenMatch(term, roleNameNormalized);
            const adjusted = Math.round(s * 0.8);  // role name match is less precise
            if (adjusted > bestScore) {
              bestScore = adjusted;
              matchDetail = `Role name: "${term}" ≈ "${role.jobRole}" (${adjusted}%)`;
            }

            // Also match against role name tokens
            const roleTokens = roleNameNormalized.split(' ').filter(Boolean);
            for (const rt of roleTokens) {
              const s2 = fuzzyTokenMatch(term, rt);
              const adj2 = Math.round(s2 * 0.75);
              if (adj2 > bestScore) {
                bestScore = adj2;
                matchDetail = `Role token: "${term}" ≈ "${rt}" (${adj2}%)`;
              }
            }
          }
        }

        // ── Strategy 5: Match against industry name ──
        if (bestScore < 40) {
          const industryNorm = normalizeText(industry.industry);
          for (const term of expandedTerms) {
            if (industryNorm.includes(term) || term.includes(industryNorm)) {
              const s = 30;
              if (s > bestScore) {
                bestScore = s;
                matchDetail = `Industry match: "${term}" in "${industry.industry}"`;
              }
            }
          }
        }

        if (bestScore >= minScore) {
          results.push({
            domain: field.domain,
            industry: industry.industry,
            jobRole: role.jobRole,
            keywords: role.keywords || '',
            score: bestScore,
            matchDetails: matchDetail,
          });
        }
      }
    }
  }

  // Sort by score descending, then by jobRole alphabetically for stability
  results.sort((a, b) => b.score - a.score || a.jobRole.localeCompare(b.jobRole));

  return results.slice(0, maxResults);
};

/**
 * Quick check: does the given skill approximately match one of the verified skills?
 * Handles "react" matching verified "REACT", "REACTJS", "REACT_JS", etc.
 */
export const isSkillFuzzyVerified = (
  skillInput: string,
  verifiedSkills: string[],
): boolean => {
  if (!skillInput.trim()) return false;

  const expandedInput = expandWithAliases(skillInput);
  const normalizedInput = normalizeText(skillInput);

  for (const verified of verifiedSkills) {
    const normalizedVerified = normalizeText(verified);

    // Direct match after normalization
    if (normalizedInput === normalizedVerified) return true;

    // Expanded alias match
    if (expandedInput.has(normalizedVerified)) return true;

    // Expand verified skill too
    const expandedVerified = expandWithAliases(verified);
    for (const term of expandedInput) {
      if (expandedVerified.has(term)) return true;
    }

    // Fuzzy match
    const score = fuzzyTokenMatch(normalizedInput, normalizedVerified);
    if (score >= 70) return true;

    // Token-level fuzzy: "java springboot" vs "JAVA_SPRING_BOOT"
    const inputTokens = tokenize(skillInput);
    const verifiedTokens = tokenize(verified);
    if (inputTokens.length > 0 && verifiedTokens.length > 0) {
      let matchedTokens = 0;
      for (const it of inputTokens) {
        for (const vt of verifiedTokens) {
          if (fuzzyTokenMatch(it, vt) >= 70) {
            matchedTokens++;
            break;
          }
        }
      }
      if (matchedTokens >= Math.min(inputTokens.length, verifiedTokens.length)) {
        return true;
      }
    }
  }

  return false;
};
