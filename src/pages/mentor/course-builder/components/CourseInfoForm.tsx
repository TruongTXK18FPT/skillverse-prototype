import React, { useState, useRef, useCallback, useEffect } from "react";
import { FiInfo, FiImage, FiPlus, FiX } from "react-icons/fi";
import { CourseLevel } from "../../../../data/courseDTOs";
import { LANGUAGES } from "../courseBuilderConstants";
import { skillService } from "../../../../services/skillService";
import { SkillDto } from "../../../../data/skillDTOs";
import useClickOutside from "../../../../hooks/useClickOutside";
interface CourseInfoFormProps {
  courseForm: {
    title?: string;
    summary?: string;
    description?: string;
    category?: string;
    level?: CourseLevel;
    price?: number;
    estimatedDuration?: number;
    thumbnailUrl?: string;
    language?: string;
  };
  isRevisionMode: boolean;
  isEditable: boolean;
  changedCourseInfoFields: string[];
  learningObjectives: string[];
  requirements: string[];
  courseSkills: string[];
  CATEGORIES: string[];
  LEVELS: { value: CourseLevel; label: string }[];
  onUpdateCourseForm: (update: Partial<{
    title?: string;
    summary?: string;
    description?: string;
    category?: string;
    level?: CourseLevel;
    price?: number;
    estimatedDuration?: number;
    language?: string;
  }>) => void;
  onSetLearningObjectives: (objs: string[]) => void;
  onSetRequirements: (reqs: string[]) => void;
  onSetCourseSkills: (skills: string[]) => void;
  onThumbnailChange: (file: File) => void;
  onShowToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
  onBlurOnWheel: (e: React.WheelEvent<HTMLInputElement>) => void;
  thumbnailFile: File | null;
  onOpenThumbnailUpload: () => void;
}

// ---------- Skill Autocomplete Sub-Component ----------
interface SkillAutocompleteProps {
  onAddSkill: (skillName: string) => void;
  onShowToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

const SkillAutocomplete: React.FC<SkillAutocompleteProps> = ({
  onAddSkill,
  onShowToast,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<SkillDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Focus state
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Click outside to close panel
  const containerRef = useClickOutside<HTMLDivElement>(() => {
    setIsPanelOpen(false);
    setHighlightedIndex(-1);
  });

  // Fetch suggestions with debounce
  // NOTE: Always normalize prefix BEFORE searching so "java core" finds "JAVA_CORE"
  const fetchSuggestions = useCallback(async (rawInput: string) => {
    if (!rawInput.trim()) {
      setSuggestions([]);
      setIsPanelOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      // Normalize input so "java core" / "java-core" both search "JAVA_CORE"
      const normalized = skillService.normalize(rawInput);
      const results = await skillService.suggestByPrefix(normalized, 0, 10);
      setSuggestions(results);
      // Show panel if suggestions exist OR if typed value doesn't exactly match any
      const alreadyAdded = results.some(
        (s) => s.name.toUpperCase() === normalized,
      );
      setIsPanelOpen(results.length > 0 || !alreadyAdded);
      setHighlightedIndex(-1);
    } catch {
      setSuggestions([]);
      setIsPanelOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Add a skill tag
  const addSkillFromSuggestion = (skillName: string) => {
    const normalized = skillService.normalize(skillName);
    // Prevent duplicates (case-insensitive check against current tags)
    onAddSkill(normalized);
    setInputValue("");
    setSuggestions([]);
    setIsPanelOpen(false);
    setHighlightedIndex(-1);
  };

  // Add skill on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        // Keyboard-navigated selection
        addSkillFromSuggestion(suggestions[highlightedIndex].name);
      } else if (inputValue.trim()) {
        // Custom text → normalize and add
        addSkillFromSuggestion(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Escape") {
      setIsPanelOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Show panel if input has value and either: loading, results, or user is typing
  const showPanel = isPanelOpen && (
    isInputFocused || suggestions.length > 0 || (inputValue.trim().length > 0 && !isLoading)
  );

  return (
    <div className="cb-skill-autocomplete" ref={containerRef}>
      <div className="cb-skill-tags-input-row">
        <input
          type="text"
          className={`cb-input${isInputFocused ? " cb-skill-autocomplete__input--focused" : ""}`}
          placeholder="Nhập kỹ năng, ví dụ: JAVA, PYTHON, DOCKER..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsInputFocused(true);
            // Re-open panel if there are suggestions
            if (suggestions.length > 0) setIsPanelOpen(true);
          }}
          onBlur={() => setIsInputFocused(false)}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="cb-button cb-button--ghost cb-button--sm"
          onClick={() => {
            if (inputValue.trim()) addSkillFromSuggestion(inputValue);
          }}
          disabled={!inputValue.trim()}
        >
          <FiPlus /> Thêm
        </button>
      </div>

      {/* Floating suggestion panel */}
      {showPanel && (
        <div className="cb-skill-autocomplete__panel">
          {isLoading ? (
            <div className="cb-skill-autocomplete__loading">
              <div className="cb-skill-autocomplete__spinner" />
              <span>Đang tìm...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((skill, idx) => (
                <div
                  key={skill.id}
                  className={`cb-skill-autocomplete__item${
                    idx === highlightedIndex ? " cb-skill-autocomplete__item--highlighted" : ""
                  }`}
                  onMouseDown={(e) => {
                    // Use mousedown instead of click to prevent input blur closing panel
                    e.preventDefault();
                    addSkillFromSuggestion(skill.name);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <span className="cb-skill-autocomplete__name">
                    {skill.name}
                  </span>
                  {skill.category && (
                    <span className="cb-skill-autocomplete__category">
                      {skill.category}
                    </span>
                  )}
                </div>
              ))}
              <div className="cb-skill-autocomplete__empty">
                <span className="cb-skill-autocomplete__kbd-hint">
                  <kbd className="cb-skill-autocomplete__kbd">↑↓</kbd> di chuyển
                  <kbd className="cb-skill-autocomplete__kbd">Enter</kbd> chọn
                  <kbd className="cb-skill-autocomplete__kbd">Esc</kbd> đóng
                </span>
                <span className="cb-skill-autocomplete__empty-hint">
                  Nhấn Enter để tạo mới
                </span>
              </div>
            </>
          ) : inputValue.trim() ? (
            <div className="cb-skill-autocomplete__empty">
              <span>Không tìm thấy "{inputValue.trim()}"</span>
              <span
                className="cb-skill-autocomplete__empty-hint"
                onMouseDown={(e) => e.preventDefault()}
                style={{ cursor: "default" }}
              >
                Nhấn Enter để tạo mới
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// ---------- Main Component ----------
const CourseInfoForm: React.FC<CourseInfoFormProps> = ({
  courseForm,
  isRevisionMode,
  isEditable,
  changedCourseInfoFields,
  learningObjectives,
  requirements,
  courseSkills,
  CATEGORIES,
  LEVELS,
  onUpdateCourseForm,
  onSetLearningObjectives,
  onSetRequirements,
  onSetCourseSkills,
  onThumbnailChange,
  onShowToast,
  onBlurOnWheel,
  thumbnailFile,
  onOpenThumbnailUpload,
}) => {
  const addSkill = (tag: string) => {
    const normalized = skillService.normalize(tag);
    if (!normalized) return;
    if (courseSkills.some((s) => s === normalized)) {
      onShowToast("warning", "Tag đã tồn tại");
      return;
    }
    onSetCourseSkills([...courseSkills, normalized]);
  };

  const removeSkill = (tag: string) => {
    const normalized = skillService.normalize(tag);
    onSetCourseSkills(courseSkills.filter((s) => s !== normalized));
  };

  return (
    <div className="cb-main-content">
      <div className="cb-panel">
        <div className="cb-panel__header">
          <div className="cb-panel__title">
            <FiInfo /> Thông tin cơ bản
          </div>
        </div>
        <div className="cb-panel__body">
          {isRevisionMode && changedCourseInfoFields.length > 0 && (
            <div className="cb-course-change-banner">
              <strong>Đang có thay đổi so với phiên bản gốc:</strong>{" "}
              {changedCourseInfoFields.join(", ")}
            </div>
          )}
          <div className="cb-course-info-layout">
            <section className="cb-info-group cb-info-group--hero">
              <div className="cb-info-group__header">
                <h3 className="cb-info-group__title">Nhận diện khóa học</h3>
                <p className="cb-info-group__description">
                  Thiết lập thông tin chính và ảnh bìa hiển thị trên thẻ
                  khóa học.
                </p>
              </div>

              <div className="cb-info-hero-grid">
                <div className="cb-info-hero-grid__left">
                  <div className="cb-form-group">
                    <label className="cb-label cb-label--required">
                      Tên khóa học
                    </label>
                    <input
                      type="text"
                      className="cb-input"
                      value={courseForm.title || ""}
                      onChange={(e) =>
                        onUpdateCourseForm({ title: e.target.value })
                      }
                    />
                  </div>

                  <div className="cb-form-group">
                    <label className="cb-label">Mô tả ngắn</label>
                    <textarea
                      className="cb-input cb-textarea"
                      value={courseForm.summary || ""}
                      onChange={(e) =>
                        onUpdateCourseForm({ summary: e.target.value })
                      }
                      placeholder="Mô tả ngắn gọn về khóa học (hiển thị trên thẻ khóa học)"
                    />
                  </div>
                </div>

                <div className="cb-info-hero-grid__right">
                  <label className="cb-label">Ảnh bìa</label>
                  <div
                    className={`cb-course-upload${!isEditable ? " cb-course-upload--disabled" : ""}`}
                    onClick={() => {
                      if (!isEditable) {
                        onShowToast(
                          "info",
                          "Chỉ có thể xem trong trạng thái hiện tại. Tạo hoặc mở phiên bản nháp để chỉnh sửa.",
                        );
                        return;
                      }
                      onOpenThumbnailUpload();
                    }}
                  >
                    <input
                      id="thumbnail-upload"
                      type="file"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onThumbnailChange(file);
                        }
                      }}
                      accept="image/*"
                      disabled={!isEditable}
                    />

                    {thumbnailFile ? (
                      <img
                        className="cb-course-upload__preview"
                        src={URL.createObjectURL(thumbnailFile)}
                        alt="Thumbnail"
                      />
                    ) : courseForm.thumbnailUrl ? (
                      <img
                        className="cb-course-upload__preview"
                        src={courseForm.thumbnailUrl}
                        alt="Thumbnail"
                      />
                    ) : (
                      <div className="cb-course-upload__placeholder">
                        <FiImage size={32} />
                        <p>Tải ảnh lên</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="cb-info-group cb-info-group--details">
              <div className="cb-info-group__header">
                <h3 className="cb-info-group__title">
                  Nội dung giới thiệu
                </h3>
                <p className="cb-info-group__description">
                  Mô tả chi tiết khóa học và các thông tin định hướng cho
                  học viên.
                </p>
              </div>

              <div className="cb-info-stack">
                <div className="cb-info-subsection">
                  <div className="cb-form-group">
                    <label className="cb-label">Mô tả chi tiết</label>
                    <textarea
                      className="cb-input cb-textarea cb-textarea--lg"
                      value={courseForm.description || ""}
                      onChange={(e) =>
                        onUpdateCourseForm({ description: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="cb-info-subsection">
                  <h4 className="cb-info-subsection__title">
                    Kết quả học tập
                  </h4>
                  <p className="cb-info-subsection__description">
                    Mô tả những gì học viên đạt được sau khi hoàn thành khóa
                    học.
                  </p>

                  <div className="cb-dynamic-list">
                    {learningObjectives.map((obj, idx) => (
                      <div
                        key={idx}
                        className="cb-input-group cb-dynamic-list__row"
                      >
                        <input
                          className="cb-input"
                          value={obj}
                          placeholder={`Mục tiêu ${idx + 1}`}
                          onChange={(e) => {
                            const newObjs = [...learningObjectives];
                            newObjs[idx] = e.target.value;
                            onSetLearningObjectives(newObjs);
                            onUpdateCourseForm({
                              learningObjectives: newObjs,
                            });
                          }}
                        />

                        {learningObjectives.length > 1 && (
                          <button
                            type="button"
                            className="cb-icon-button cb-dynamic-list__remove"
                            onClick={() => {
                              const newObjs = learningObjectives.filter(
                                (_, i) => i !== idx,
                              );
                              onSetLearningObjectives(newObjs);
                              onUpdateCourseForm({
                                learningObjectives: newObjs,
                              });
                            }}
                            title="Xóa mục tiêu"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="cb-button cb-button--ghost cb-button--sm cb-dynamic-list__add"
                    onClick={() =>
                      onSetLearningObjectives([...learningObjectives, ""])
                    }
                  >
                    <FiPlus /> Thêm mục tiêu
                  </button>
                </div>

                <div className="cb-info-subsection">
                  <h4 className="cb-info-subsection__title">
                    Điều kiện tham gia
                  </h4>
                  <p className="cb-info-subsection__description">
                    Liệt kê kiến thức nền hoặc công cụ cần có trước khi học.
                  </p>

                  <div className="cb-dynamic-list">
                    {requirements.map((req, idx) => (
                      <div
                        key={idx}
                        className="cb-input-group cb-dynamic-list__row"
                      >
                        <input
                          className="cb-input"
                          value={req}
                          placeholder={`Yêu cầu ${idx + 1}`}
                          onChange={(e) => {
                            const newReqs = [...requirements];
                            newReqs[idx] = e.target.value;
                            onSetRequirements(newReqs);
                            onUpdateCourseForm({ requirements: newReqs });
                          }}
                        />

                        {requirements.length > 1 && (
                          <button
                            type="button"
                            className="cb-icon-button cb-dynamic-list__remove"
                            onClick={() => {
                              const newReqs = requirements.filter(
                                (_, i) => i !== idx,
                              );
                              onSetRequirements(newReqs);
                              onUpdateCourseForm({ requirements: newReqs });
                            }}
                            title="Xóa yêu cầu"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="cb-button cb-button--ghost cb-button--sm cb-dynamic-list__add"
                    onClick={() => onSetRequirements([...requirements, ""])}
                  >
                    <FiPlus /> Thêm yêu cầu
                  </button>
                </div>
              </div>
            </section>

            <section className="cb-info-group cb-info-group--commercial">
              <div className="cb-info-group__header">
                <h3 className="cb-info-group__title">
                  Phân loại và thương mại
                </h3>
                <p className="cb-info-group__description">
                  Thiết lập danh mục, độ khó và thông số kinh doanh của khóa
                  học.
                </p>
              </div>

              <div className="cb-grid cb-grid--2">
                <div className="cb-form-group">
                  <label className="cb-label">Danh mục</label>
                  <select
                    className="cb-input cb-select"
                    value={courseForm.category || ""}
                    onChange={(e) =>
                      onUpdateCourseForm({ category: e.target.value })
                    }
                  >
                    <option value="">Chọn danh mục</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Độ khó</label>
                  <select
                    className="cb-input cb-select"
                    value={courseForm.level || CourseLevel.BEGINNER}
                    onChange={(e) =>
                      onUpdateCourseForm({
                        level: e.target.value as CourseLevel,
                      })
                    }
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cb-grid cb-grid--2">
                <div className="cb-form-group">
                  <label className="cb-label">Giá (VND)</label>
                  <input
                    type="number"
                    className="cb-input"
                    value={courseForm.price ?? 0}
                    onWheel={onBlurOnWheel}
                    onChange={(e) =>
                      onUpdateCourseForm({
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="cb-form-group">
                  <label className="cb-label">Thời lượng (giờ)</label>
                  <input
                    type="number"
                    className="cb-input"
                    value={courseForm.estimatedDuration ?? 0}
                    onWheel={onBlurOnWheel}
                    onChange={(e) =>
                      onUpdateCourseForm({
                        estimatedDuration: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="cb-grid cb-grid--2">
                <div className="cb-form-group">
                  <label className="cb-label">Ngôn ngữ</label>
                  <select
                    className="cb-input cb-select"
                    value={courseForm.language || "Vietnamese"}
                    onChange={(e) =>
                      onUpdateCourseForm({ language: e.target.value })
                    }
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skill Tags — show read-only chips OR edit controls based on isEditable */}
              <div className="cb-form-group">
                <label className="cb-label">Kỹ năng / Tags</label>
                <div className="cb-skill-tags">
                  {courseSkills.map((skill) => (
                    <span key={skill} className="cb-skill-tag">
                      {skill}
                      {isEditable && (
                        <button
                          type="button"
                          className="cb-skill-tag__remove"
                          onClick={() => removeSkill(skill)}
                          title="Xóa tag"
                        >
                          <FiX size={12} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditable && (
                  <SkillAutocomplete
                    onAddSkill={addSkill}
                    onShowToast={onShowToast}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseInfoForm;