import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Check,
  ChevronRight,
  AlertTriangle,
  Zap,
  ArrowLeft,
  Sparkles,
  MousePointerClick,
  Brain,
  Loader2,
} from "lucide-react";
import {
  resolveSkill,
  SkillResolveResponse,
} from "../../services/questionBankService";
import {
  ExpertFieldResponse,
  getExpertFields,
} from "../../services/expertPromptService";
import {
  resolveSkillToCareer,
  isSkillFuzzyVerified,
  SkillResolveResult as _SkillResolveResult,
} from "../../utils/skillResolver";
import { getExpertDomainLabel } from "../../utils/expertFieldPresentation";
import "./SkillAutoResolve.css";

interface SkillAutoResolveProps {
  /** Current skill input value */
  skillInput: string;
  /** Called when user types in the skill box */
  onSkillChange: (skill: string) => void;
  /** Called when user confirms a resolved career path */
  onResolve: (result: {
    domain: string;
    industry: string;
    jobRole: string;
    keywords?: string;
  }) => void;
  /** Filter by allowed domains (e.g. mentor limited to IT/Business/Design) */
  allowedDomains?: string[];
  /** Show "chọn thủ công" fallback button */
  showManualFallback?: boolean;
  /** Called when user chooses manual selection */
  onManualFallback?: () => void;
  /** Verified skills for chip display + validation */
  verifiedSkills?: string[];
  /** Called when user clicks a verified skill chip */
  onSkillChipClick?: (skill: string) => void;
  /** Custom placeholder */
  placeholder?: string;
  /** Heading label */
  label?: string;
  /** Description text */
  description?: string;
  /** Called when user clicks the back button */
  onBack?: () => void;
  /** If true, use AI for resolution (requires backend). Default: true */
  useAi?: boolean;
}

const formatSkillLabel = (value?: string): string => {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

/**
 * Map short domain aliases to the real domain values from ExpertPromptConfig.
 * "IT" -> matches "Information Technology", "BUSINESS" -> "Business", "DESIGN" -> "Design"
 */
const isDomainAllowed = (
  domain: string,
  allowedDomains?: string[],
): boolean => {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const lower = domain.toLowerCase();
  return allowedDomains.some((allowed) => {
    const al = allowed.toLowerCase();
    // Direct match
    if (al === lower) return true;
    // Alias map
    if (al === "it" && lower.includes("information technology")) return true;
    if (
      al === "business" &&
      (lower.includes("business") || lower.includes("kinh doanh"))
    )
      return true;
    if (
      al === "design" &&
      (lower.includes("design") || lower.includes("thiết kế"))
    )
      return true;
    // Partial match
    if (lower.includes(al) || al.includes(lower)) return true;
    return false;
  });
};

type ResolveMode = "idle" | "resolving" | "done" | "error";

interface MergedResult {
  domain: string;
  industry: string;
  jobRole: string;
  confidence: number;
  source: "ai" | "local";
  reasoning?: string;
}

const SkillAutoResolve: React.FC<SkillAutoResolveProps> = ({
  skillInput,
  onSkillChange,
  onResolve,
  allowedDomains,
  showManualFallback = true,
  onManualFallback,
  verifiedSkills,
  onSkillChipClick,
  placeholder = "Ví dụ: React, Java Spring Boot, UI Design...",
  label = "Nhập skill để tự động xác định lộ trình",
  description,
  onBack,
  useAi = true,
}) => {
  const [expertFields, setExpertFields] = useState<ExpertFieldResponse[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  // AI resolve state
  const [resolveMode, setResolveMode] = useState<ResolveMode>("idle");
  const [aiResult, setAiResult] = useState<SkillResolveResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Merged results (AI primary + local fallback)
  const [mergedResults, setMergedResults] = useState<MergedResult[]>([]);

  // Load expert fields on mount (for local fallback + domain labels)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingFields(true);
        const data = await getExpertFields();
        if (!cancelled) setExpertFields(data || []);
      } catch {
        if (!cancelled) setExpertFields([]);
      } finally {
        if (!cancelled) setLoadingFields(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Verified skill fuzzy check
  const isVerified = useMemo(() => {
    if (!verifiedSkills || verifiedSkills.length === 0) return true;
    if (!skillInput.trim()) return false;
    return isSkillFuzzyVerified(skillInput, verifiedSkills);
  }, [skillInput, verifiedSkills]);

  // Debounced AI resolution trigger
  useEffect(() => {
    if (!skillInput.trim() || skillInput.trim().length < 2) {
      setMergedResults([]);
      setAiResult(null);
      setAiError(null);
      setResolveMode("idle");
      setSelectedIndex(0);
      setConfirmed(false);
      return;
    }

    setConfirmed(false);
    setSelectedIndex(0);

    // Step 1: Instant local matching
    if (expertFields.length > 0) {
      const localResults = resolveSkillToCareer(skillInput, expertFields, {
        maxResults: 5,
        minScore: 20,
      });
      const filtered = localResults.filter((r) =>
        isDomainAllowed(r.domain, allowedDomains),
      );
      setMergedResults(
        filtered.map((r) => ({
          domain: r.domain,
          industry: r.industry,
          jobRole: r.jobRole,
          confidence: r.score,
          source: "local" as const,
        })),
      );
    }

    // Step 2: Delayed AI call (only if enabled)
    if (!useAi) return;

    setResolveMode("resolving");
    const timer = setTimeout(async () => {
      try {
        const result = await resolveSkill(skillInput.trim());
        setAiResult(result);
        setAiError(null);

        // Merge AI result with local results
        const aiPrimary: MergedResult = {
          domain: result.domain,
          industry: result.industry,
          jobRole: result.jobRole,
          confidence: result.confidence,
          source: "ai",
          reasoning: result.reasoning,
        };

        const aiAlternatives: MergedResult[] = (result.alternatives || [])
          .filter((alt) => isDomainAllowed(alt.domain, allowedDomains))
          .map((alt) => ({
            domain: alt.domain,
            industry: alt.industry,
            jobRole: alt.jobRole,
            confidence: alt.confidence,
            source: "ai" as const,
          }));

        // Combine: AI primary first, then AI alternatives, deduped
        const combined: MergedResult[] = [];
        const seen = new Set<string>();

        if (isDomainAllowed(aiPrimary.domain, allowedDomains)) {
          const key = `${aiPrimary.domain}|${aiPrimary.industry}|${aiPrimary.jobRole}`;
          combined.push(aiPrimary);
          seen.add(key);
        }

        for (const alt of aiAlternatives) {
          const key = `${alt.domain}|${alt.industry}|${alt.jobRole}`;
          if (!seen.has(key)) {
            combined.push(alt);
            seen.add(key);
          }
        }

        // Add local results that aren't in AI results
        if (expertFields.length > 0) {
          const localResults = resolveSkillToCareer(skillInput, expertFields, {
            maxResults: 3,
            minScore: 40,
          });
          for (const lr of localResults) {
            if (!isDomainAllowed(lr.domain, allowedDomains)) continue;
            const key = `${lr.domain}|${lr.industry}|${lr.jobRole}`;
            if (!seen.has(key)) {
              combined.push({
                domain: lr.domain,
                industry: lr.industry,
                jobRole: lr.jobRole,
                confidence: lr.score,
                source: "local",
              });
              seen.add(key);
            }
          }
        }

        setMergedResults(combined.slice(0, 5));
        setResolveMode("done");
        setSelectedIndex(0);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "AI analysis failed";
        setAiError(message);
        setResolveMode("error");
        // Keep local results as fallback
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [skillInput, expertFields, allowedDomains, useAi]);

  const handleConfirm = useCallback(() => {
    if (mergedResults.length === 0) return;
    const picked = mergedResults[selectedIndex];
    if (!picked) return;
    setConfirmed(true);
    onResolve({
      domain: picked.domain,
      industry: picked.industry,
      jobRole: picked.jobRole,
    });
  }, [mergedResults, selectedIndex, onResolve]);

  const hasResults = mergedResults.length > 0;
  const noMatch =
    skillInput.trim().length > 1 &&
    resolveMode !== "resolving" &&
    !hasResults &&
    !loadingFields;

  return (
    <div className="sar-container">
      {/* Header */}
      <div className="sar-header">
        <div className="sar-header__icon">
          <Zap size={20} />
        </div>
        <div>
          <h3 className="sar-header__title">{label}</h3>
          {description && <p className="sar-header__desc">{description}</p>}
        </div>
      </div>

      {/* Verified skills chips */}
      {verifiedSkills && verifiedSkills.length > 0 && (
        <div className="sar-chips">
          <span className="sar-chips__label">Skill đã xác thực:</span>
          <div className="sar-chips__list">
            {verifiedSkills.map((skill) => {
              const active = isSkillFuzzyVerified(skillInput, [skill]);
              return (
                <button
                  key={skill}
                  type="button"
                  className={`sar-chip ${active ? "active" : ""}`}
                  onClick={() =>
                    onSkillChipClick?.(skill) ?? onSkillChange(skill)
                  }
                >
                  {formatSkillLabel(skill)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Skill input */}
      <div className="sar-input-wrap">
        <Search size={18} className="sar-input-icon" />
        <input
          className="sar-input"
          type="text"
          value={skillInput}
          onChange={(e) => onSkillChange(e.target.value)}
          placeholder={placeholder}
          disabled={loadingFields}
        />
        {resolveMode === "resolving" && <div className="sar-input-spinner" />}
      </div>

      {/* Verification status */}
      {verifiedSkills && verifiedSkills.length > 0 && skillInput.trim() && (
        <div className={`sar-verify-hint ${isVerified ? "valid" : "invalid"}`}>
          {isVerified
            ? `✓ Skill hợp lệ: ${formatSkillLabel(skillInput)}`
            : "✗ Skill này chưa nằm trong danh sách đã xác thực."}
        </div>
      )}

      {/* AI analyzing indicator */}
      {resolveMode === "resolving" && (
        <div className="sar-ai-analyzing">
          <Brain size={16} className="sar-ai-icon" />
          <span>AI đang phân tích skill...</span>
          <Loader2 size={14} className="sar-spin-icon" />
        </div>
      )}

      {/* AI reasoning */}
      {resolveMode === "done" && aiResult?.reasoning && (
        <div className="sar-ai-reasoning">
          <Brain size={14} />
          <span>{aiResult.reasoning}</span>
        </div>
      )}

      {/* Existing QB info */}
      {resolveMode === "done" && aiResult?.questionBankExists && (
        <div className="sar-existing-qb">
          <Sparkles size={14} />
          <span>
            Đã có Question Bank:{" "}
            <strong>{aiResult.existingQuestionBankTitle}</strong> (ID:{" "}
            {aiResult.existingQuestionBankId})
          </span>
        </div>
      )}

      {/* Loading state */}
      {loadingFields && (
        <div className="sar-loading">Đang tải dữ liệu ngành nghề...</div>
      )}

      {/* Results */}
      {!loadingFields && hasResults && (
        <div className="sar-results">
          <div className="sar-results__header">
            <Sparkles size={16} />
            <span>
              {resolveMode === "done"
                ? "AI gợi ý lộ trình phù hợp:"
                : "Gợi ý lộ trình phù hợp:"}
            </span>
          </div>
          <div className="sar-results__list">
            {mergedResults.map((result, index) => (
              <button
                key={`${result.domain}-${result.industry}-${result.jobRole}`}
                type="button"
                className={`sar-result-item ${selectedIndex === index ? "selected" : ""} ${confirmed && selectedIndex === index ? "confirmed" : ""}`}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={handleConfirm}
              >
                <div className="sar-result-radio">
                  {selectedIndex === index ? (
                    <div className="sar-radio-dot active" />
                  ) : (
                    <div className="sar-radio-dot" />
                  )}
                </div>
                <div className="sar-result-path">
                  <span className="sar-result-domain">
                    {getExpertDomainLabel(result.domain)}
                  </span>
                  <ChevronRight size={12} className="sar-result-sep" />
                  <span className="sar-result-industry">{result.industry}</span>
                  <ChevronRight size={12} className="sar-result-sep" />
                  <span className="sar-result-role">{result.jobRole}</span>
                </div>
                <div className="sar-result-meta">
                  {result.source === "ai" && (
                    <span className="sar-ai-badge" title="AI-powered">
                      <Brain size={10} /> AI
                    </span>
                  )}
                  <div className="sar-result-score">
                    <div className="sar-score-bar">
                      <div
                        className="sar-score-fill"
                        style={{
                          width: `${Math.min(result.confidence, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="sar-score-label">
                      {result.confidence}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Error — show as warning, not blocking (local results still shown) */}
      {resolveMode === "error" && aiError && (
        <div className="sar-ai-error">
          <AlertTriangle size={14} />
          <span>AI không phản hồi — sử dụng kết quả phân tích cục bộ.</span>
        </div>
      )}

      {/* No match warning */}
      {noMatch && (
        <div className="sar-no-match">
          <AlertTriangle size={18} />
          <div>
            <strong>Không tìm thấy lộ trình phù hợp</strong>
            <p>Thử nhập skill khác hoặc chọn thủ công bên dưới.</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="sar-actions">
        {onBack && (
          <button type="button" className="sar-btn secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            Quay lại
          </button>
        )}

        <div className="sar-actions-right">
          {showManualFallback && onManualFallback && (
            <button
              type="button"
              className="sar-btn subtle"
              onClick={onManualFallback}
            >
              <MousePointerClick size={16} />
              Chọn thủ công
            </button>
          )}

          {hasResults && (
            <button
              type="button"
              className="sar-btn primary"
              onClick={handleConfirm}
              disabled={
                !hasResults ||
                confirmed ||
                (verifiedSkills && verifiedSkills.length > 0 && !isVerified)
              }
            >
              <Check size={16} />
              {confirmed ? "Đã xác nhận" : "Xác nhận lộ trình"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillAutoResolve;
