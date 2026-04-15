import React from "react";
import { FiInfo, FiImage, FiPlus, FiX } from "react-icons/fi";
import { CourseLevel } from "../../../../data/courseDTOs";

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
  };
  isRevisionMode: boolean;
  isEditable: boolean;
  changedCourseInfoFields: string[];
  learningObjectives: string[];
  requirements: string[];
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
  }>) => void;
  onSetLearningObjectives: (objs: string[]) => void;
  onSetRequirements: (reqs: string[]) => void;
  onThumbnailChange: (file: File) => void;
  onShowToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
  onBlurOnWheel: (e: React.WheelEvent<HTMLInputElement>) => void;
  thumbnailFile: File | null;
  onOpenThumbnailUpload: () => void;
}

const CourseInfoForm: React.FC<CourseInfoFormProps> = ({
  courseForm,
  isRevisionMode,
  isEditable,
  changedCourseInfoFields,
  learningObjectives,
  requirements,
  CATEGORIES,
  LEVELS,
  onUpdateCourseForm,
  onSetLearningObjectives,
  onSetRequirements,
  onThumbnailChange,
  onShowToast,
  onBlurOnWheel,
  thumbnailFile,
  onOpenThumbnailUpload,
}) => {
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
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseInfoForm;
