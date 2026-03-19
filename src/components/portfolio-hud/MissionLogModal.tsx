import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Sparkles, Upload, Wand2, X } from 'lucide-react';
import MeowlKuruLoader from '../kuru-loader/MeowlKuruLoader';
import { PortfolioProjectDTO, ProjectType } from '../../data/portfolioDTOs';
import { useScrollLock } from './useScrollLock';
import SystemAlertModal from './SystemAlertModal';
import './dossier-portfolio-styles.css';

interface MissionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: PortfolioProjectDTO, thumbnail?: File) => Promise<void>;
  initialData?: PortfolioProjectDTO;
  mode: 'create' | 'edit';
}

const PROJECT_TYPE_OPTIONS: Array<{ value: ProjectType; label: string; hint: string }> = [
  { value: ProjectType.FREELANCE, label: 'Freelance', hint: 'Dự án làm cho khách hàng bên ngoài.' },
  { value: ProjectType.FULL_TIME, label: 'Toàn thời gian', hint: 'Sản phẩm hoặc sáng kiến trong công việc chính.' },
  { value: ProjectType.MICRO_JOB, label: 'Việc ngắn hạn', hint: 'Đầu việc nhỏ, hoàn thành nhanh theo đầu bài.' },
  { value: ProjectType.PERSONAL, label: 'Cá nhân', hint: 'Project tự khởi tạo để thể hiện năng lực.' },
  { value: ProjectType.ACADEMIC, label: 'Học tập', hint: 'Đồ án môn học, nghiên cứu, capstone.' },
  { value: ProjectType.OPEN_SOURCE, label: 'Mã nguồn mở', hint: 'Đóng góp cho cộng đồng hoặc sản phẩm public.' },
  { value: ProjectType.INTERNSHIP, label: 'Thực tập', hint: 'Sản phẩm thực hiện trong kỳ thực tập.' },
];

const TOOL_SUGGESTIONS = [
  'React',
  'TypeScript',
  'Node.js',
  'Spring Boot',
  'Figma',
  'PostgreSQL',
  'Docker',
  'AWS',
];

const OUTCOME_SUGGESTIONS = [
  'Tăng tỉ lệ chuyển đổi',
  'Rút ngắn thời gian xử lý',
  'Tăng độ ổn định hệ thống',
  'Ra mắt MVP đúng hạn',
  'Tăng mức hài lòng người dùng',
  'Tối ưu hiệu suất trang',
];

const DESCRIPTION_TEMPLATE = [
  'Bối cảnh: Dự án giải quyết bài toán gì, cho ai?',
  'Vai trò của tôi: Tôi chịu trách nhiệm chính ở những phần nào?',
  'Cách triển khai: Công nghệ, quy trình hoặc quyết định nổi bật.',
  'Kết quả: Chỉ số, tác động hoặc phản hồi thực tế.',
].join('\n');

const getInitialProjectState = (): PortfolioProjectDTO => ({
  title: '',
  description: '',
  clientName: '',
  projectType: ProjectType.PERSONAL,
  duration: '',
  completionDate: '',
  tools: [],
  outcomes: [],
  rating: 5,
  clientFeedback: '',
  projectUrl: '',
  githubUrl: '',
  thumbnailUrl: '',
  isFeatured: false,
});

export const MissionLogModal: React.FC<MissionLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  useScrollLock(isOpen);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PortfolioProjectDTO>(getInitialProjectState());
  const [thumbnail, setThumbnail] = useState<File | undefined>();
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [outcomeInput, setOutcomeInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...getInitialProjectState(),
          ...initialData,
          tools: initialData.tools || [],
          outcomes: initialData.outcomes || [],
        });
        setThumbnailPreview(initialData.thumbnailUrl || '');
        setShowAdvanced(
          Boolean(
            initialData.clientName ||
            initialData.duration ||
            initialData.projectUrl ||
            initialData.githubUrl ||
            initialData.clientFeedback ||
            initialData.isFeatured,
          ),
        );
      } else {
        setFormData(getInitialProjectState());
        setThumbnailPreview('');
        setShowAdvanced(false);
      }

      setThumbnail(undefined);
      setToolInput('');
      setOutcomeInput('');
    }
  }, [initialData, isOpen]);

  const activeType = useMemo(
    () => PROJECT_TYPE_OPTIONS.find((option) => option.value === formData.projectType),
    [formData.projectType],
  );

  const updateField = <K extends keyof PortfolioProjectDTO>(field: K, value: PortfolioProjectDTO[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAlertModal({
        show: true,
        message: 'Vui lòng chọn một tệp ảnh hợp lệ cho ảnh dự án.',
        type: 'warning',
      });
      return;
    }

    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const appendUnique = (items: string[] | undefined, value: string) => {
    const nextValue = value.trim();
    if (!nextValue) {
      return items || [];
    }

    if ((items || []).some((item) => item.toLowerCase() === nextValue.toLowerCase())) {
      return items || [];
    }

    return [...(items || []), nextValue];
  };

  const addTool = (value = toolInput) => {
    const nextTools = appendUnique(formData.tools, value);
    updateField('tools', nextTools);
    setToolInput('');
  };

  const removeTool = (tool: string) => {
    updateField('tools', (formData.tools || []).filter((item) => item !== tool));
  };

  const addOutcome = (value = outcomeInput) => {
    const nextOutcomes = appendUnique(formData.outcomes, value);
    updateField('outcomes', nextOutcomes);
    setOutcomeInput('');
  };

  const removeOutcome = (outcome: string) => {
    updateField('outcomes', (formData.outcomes || []).filter((item) => item !== outcome));
  };

  const appendDescriptionTemplate = () => {
    updateField(
      'description',
      formData.description
        ? `${formData.description.trim()}\n\n${DESCRIPTION_TEMPLATE}`
        : DESCRIPTION_TEMPLATE,
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await onSubmit(
        {
          ...formData,
          tools: formData.tools || [],
          outcomes: formData.outcomes || [],
          rating: Math.min(5, Math.max(1, Number(formData.rating || 5))),
        },
        thumbnail,
      );
      onClose();
    } catch (error) {
      console.error('Error submitting project:', error);
      setAlertModal({
        show: true,
        message: 'Không thể lưu dự án. Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dossier-modal-overlay" onClick={onClose}>
      <div className="dossier-modal-container dossier-modal-container--wide" onClick={(event) => event.stopPropagation()}>
        <div className="dossier-modal-header">
          <div>
            <h2 className="dossier-modal-title">{mode === 'create' ? 'Thêm dự án' : 'Cập nhật dự án'}</h2>
            <p className="dossier-modal-subtitle">Hoàn thiện một case study rõ vai trò, cách làm và tác động.</p>
          </div>
          <button className="dossier-modal-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form id="mission-log-form" onSubmit={handleSubmit} className="dossier-modal-body">
          <div className="dossier-entry-banner">
            <div className="dossier-entry-banner__content">
              <h3 className="dossier-entry-banner__title">Case study nổi bật sẽ thuyết phục hơn</h3>
              <p className="dossier-entry-banner__text">
                Ưu tiên nêu rõ bạn làm gì, dùng gì và kết quả ra sao. Thông tin hỗ trợ như link demo,
                feedback khách hàng hay đánh giá có thể để ở phần nâng cao.
              </p>
            </div>
            <div className="dossier-entry-banner__meta">
              {activeType?.label || 'Dự án'} {mode === 'create' ? 'mới' : 'đang chỉnh sửa'}
            </div>
          </div>

          <div className="dossier-entry-grid">
            <div className="dossier-form-section">
              <h3 className="dossier-form-section-title">Thông tin chính</h3>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Tên dự án *</label>
                <input
                  type="text"
                  className="dossier-input"
                  value={formData.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  placeholder="Ví dụ: Nâng cấp trải nghiệm mua hàng trên ứng dụng bán lẻ"
                  required
                />
                <p className="dossier-entry-help">Một tiêu đề tốt nên cho thấy loại sản phẩm hoặc kết quả chính.</p>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Loại dự án *</label>
                <div className="dossier-entry-pill-row">
                  {PROJECT_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`dossier-entry-pill ${formData.projectType === option.value ? 'dossier-entry-pill--active' : ''}`}
                      onClick={() => updateField('projectType', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="dossier-entry-help">{activeType?.hint}</p>
              </div>

              <div className="dossier-entry-field-grid">
                <div className="dossier-form-group">
                  <label className="dossier-form-label">Đơn vị / khách hàng</label>
                  <input
                    type="text"
                    className="dossier-input"
                    value={formData.clientName || ''}
                    onChange={(event) => updateField('clientName', event.target.value)}
                    placeholder="Ví dụ: SkillVerse hoặc khách hàng SME"
                  />
                </div>

                <div className="dossier-form-group">
                  <label className="dossier-form-label">Thời lượng</label>
                  <input
                    type="text"
                    className="dossier-input"
                    value={formData.duration || ''}
                    onChange={(event) => updateField('duration', event.target.value)}
                    placeholder="Ví dụ: 6 tuần"
                  />
                </div>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Mô tả dự án *</label>
                <textarea
                  className="dossier-textarea"
                  value={formData.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Tóm tắt bối cảnh, vai trò của bạn, cách triển khai và kết quả nổi bật."
                  rows={8}
                  required
                />
                <div className="dossier-entry-inline" style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="dossier-btn-secondary" onClick={appendDescriptionTemplate}>
                    <Wand2 size={16} />
                    Chèn mẫu mô tả
                  </button>
                </div>
              </div>
            </div>

            <div className="dossier-form-section">
              <h3 className="dossier-form-section-title">Ảnh đại diện dự án</h3>

              <div className="dossier-entry-upload">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Xem trước dự án" className="dossier-entry-upload__preview" />
                ) : (
                  <div className="dossier-entry-upload__placeholder">
                    <Upload size={28} />
                    <strong>Thêm ảnh bìa để hồ sơ trực quan hơn</strong>
                    <span>Ảnh giao diện, sản phẩm hoàn thiện hoặc poster dự án đều phù hợp.</span>
                  </div>
                )}

                <div className="dossier-entry-upload__meta">
                  Khuyến nghị ảnh ngang rõ nội dung chính. File ảnh sẽ được dùng làm thumbnail trên portfolio.
                </div>

                <input
                  id="mission-log-thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="mission-log-thumbnail" className="dossier-btn-primary" style={{ cursor: 'pointer' }}>
                  <Upload size={16} />
                  {thumbnailPreview ? 'Đổi ảnh dự án' : 'Tải ảnh dự án'}
                </label>
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <h3 className="dossier-form-section-title">Công cụ và kết quả</h3>

            <div className="dossier-entry-support-grid" style={{ marginBottom: '1rem' }}>
              <div className="dossier-entry-support-card">
                <h4 className="dossier-entry-support-title">Gợi ý công cụ</h4>
                <p className="dossier-entry-support-text">Liệt kê stack, nền tảng hoặc phương pháp bạn trực tiếp sử dụng.</p>
              </div>
              <div className="dossier-entry-support-card">
                <h4 className="dossier-entry-support-title">Gợi ý kết quả</h4>
                <p className="dossier-entry-support-text">Ưu tiên số liệu, tốc độ hoàn thành, impact với người dùng hoặc phản hồi thực tế.</p>
              </div>
            </div>

            <div className="dossier-entry-field-grid">
              <div className="dossier-form-group">
                <label className="dossier-form-label">Công cụ / công nghệ</label>
                <div className="dossier-entry-chipbox">
                  <div className="dossier-module-tags">
                    {(formData.tools || []).map((tool) => (
                      <span key={tool} className="dossier-module-tag">
                        {tool}
                        <button type="button" onClick={() => removeTool(tool)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="dossier-entry-inline">
                    <input
                      type="text"
                      className="dossier-input"
                      value={toolInput}
                      onChange={(event) => setToolInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addTool();
                        }
                      }}
                      placeholder="Ví dụ: React, Figma, Spring Boot"
                    />
                    <button type="button" className="dossier-btn-primary" onClick={() => addTool()}>
                      Thêm
                    </button>
                  </div>

                  <div className="dossier-entry-pill-row">
                    {TOOL_SUGGESTIONS.map((tool) => (
                      <button key={tool} type="button" className="dossier-entry-pill" onClick={() => addTool(tool)}>
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="dossier-form-group">
                <label className="dossier-form-label">Kết quả nổi bật</label>
                <div className="dossier-entry-chipbox">
                  <div className="dossier-module-tags">
                    {(formData.outcomes || []).map((outcome) => (
                      <span key={outcome} className="dossier-module-tag">
                        {outcome}
                        <button type="button" onClick={() => removeOutcome(outcome)} style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="dossier-entry-inline">
                    <input
                      type="text"
                      className="dossier-input"
                      value={outcomeInput}
                      onChange={(event) => setOutcomeInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addOutcome();
                        }
                      }}
                      placeholder="Ví dụ: Tăng 24% tỉ lệ hoàn tất hồ sơ"
                    />
                    <button type="button" className="dossier-btn-primary" onClick={() => addOutcome()}>
                      Thêm
                    </button>
                  </div>

                  <div className="dossier-entry-pill-row">
                    {OUTCOME_SUGGESTIONS.map((outcome) => (
                      <button key={outcome} type="button" className="dossier-entry-pill" onClick={() => addOutcome(outcome)}>
                        {outcome}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dossier-form-section">
            <button
              type="button"
              className="dossier-entry-advanced-toggle"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              <span>Thông tin nâng cao</span>
              <ChevronDown
                size={16}
                style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
              />
            </button>

            {showAdvanced && (
              <div style={{ marginTop: '1rem' }}>
                <div className="dossier-entry-field-grid dossier-entry-field-grid--triple">
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Ngày hoàn thành</label>
                    <input
                      type="date"
                      className="dossier-input"
                      value={formData.completionDate || ''}
                      onChange={(event) => updateField('completionDate', event.target.value)}
                    />
                  </div>

                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Đánh giá (1-5)</label>
                    <input
                      type="number"
                      className="dossier-input"
                      min={1}
                      max={5}
                      value={formData.rating || 5}
                      onChange={(event) => updateField('rating', Number(event.target.value) || 5)}
                    />
                  </div>

                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Đánh dấu nổi bật</label>
                    <label className="dossier-toggle-card" style={{ marginTop: '0.25rem' }}>
                      <input
                        type="checkbox"
                        className="dossier-toggle-input"
                        checked={formData.isFeatured || false}
                        onChange={(event) => updateField('isFeatured', event.target.checked)}
                      />
                      <span className="dossier-toggle-content">
                        <span className="dossier-toggle-title">Hiển thị như dự án nổi bật</span>
                        <span className="dossier-toggle-desc">Dùng cho dự án bạn muốn recruiter hoặc khách hàng nhìn thấy trước.</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="dossier-entry-field-grid">
                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Link sản phẩm / demo</label>
                    <input
                      type="url"
                      className="dossier-input"
                      value={formData.projectUrl || ''}
                      onChange={(event) => updateField('projectUrl', event.target.value)}
                      placeholder="https://san-pham-cua-ban.com"
                    />
                  </div>

                  <div className="dossier-form-group">
                    <label className="dossier-form-label">Link GitHub / source</label>
                    <input
                      type="url"
                      className="dossier-input"
                      value={formData.githubUrl || ''}
                      onChange={(event) => updateField('githubUrl', event.target.value)}
                      placeholder="https://github.com/ban/du-an"
                    />
                  </div>
                </div>

                <div className="dossier-form-group">
                  <label className="dossier-form-label">Phản hồi khách hàng / đội nhóm</label>
                  <textarea
                    className="dossier-textarea"
                    value={formData.clientFeedback || ''}
                    onChange={(event) => updateField('clientFeedback', event.target.value)}
                    placeholder="Trích một nhận xét ngắn giúp hồ sơ đáng tin hơn."
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="dossier-modal-footer">
          <button type="button" onClick={onClose} className="dossier-btn-secondary" disabled={loading}>
            Hủy
          </button>
          <button type="submit" form="mission-log-form" className="dossier-btn-primary" disabled={loading}>
            {loading ? (
              <>
                <MeowlKuruLoader size="tiny" text="" />
                Đang lưu...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {mode === 'create' ? 'Lưu dự án' : 'Cập nhật dự án'}
              </>
            )}
          </button>
        </div>

        <SystemAlertModal
          isOpen={alertModal.show}
          onClose={() => setAlertModal((prev) => ({ ...prev, show: false }))}
          message={alertModal.message}
          type={alertModal.type}
        />
      </div>
    </div>
  );
};

export default MissionLogModal;
