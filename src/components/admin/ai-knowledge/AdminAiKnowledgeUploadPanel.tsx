import React, { useRef, useState, useEffect, useMemo } from 'react';
import { FileUp, FileText, Layers3 } from 'lucide-react';
import {
  AI_KNOWLEDGE_INDUSTRY_OPTIONS,
  AI_KNOWLEDGE_LEVEL_OPTIONS,
  AdminChatbotKnowledgeUploadRequest,
  AdminRoadmapKnowledgeUploadRequest,
} from '../../../types/aiKnowledge';
import { LocalSearchSelect } from '../roadmap/JobPositionTrackSkillTab';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { Skill } from '../../../types/skillRegistry';

type UploadTab = 'chatbot' | 'roadmap';

interface AdminAiKnowledgeUploadPanelProps {
  uploadingKind: UploadTab | null;
  onUploadChatbotDocument: (payload: AdminChatbotKnowledgeUploadRequest) => Promise<void>;
  onUploadRoadmapDocument: (payload: AdminRoadmapKnowledgeUploadRequest) => Promise<void>;
}

const AdminAiKnowledgeUploadPanel: React.FC<AdminAiKnowledgeUploadPanelProps> = ({
  uploadingKind,
  onUploadChatbotDocument,
  onUploadRoadmapDocument,
}) => {
  const chatbotFileRef = useRef<HTMLInputElement>(null);
  const roadmapFileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<UploadTab>('chatbot');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const [chatbotForm, setChatbotForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    industry: '',
    level: '',
  });

  const [roadmapForm, setRoadmapForm] = useState({
    file: null as File | null,
    title: '',
    description: '',
    skillName: '',
    industry: '',
    level: '',
  });

  const loadSkills = () => {
    setSkillsLoading(true);
    setSkillsError(null);
    adminSkillRegistryService.getActiveSkills()
      .then((data) => {
        setSkills(data);
        setSkillsError(null);
      })
      .catch((err) => {
        console.error("Failed to load skills for upload panel:", err);
        setSkillsError("Không thể tải danh sách kỹ năng");
      })
      .finally(() => {
        setSkillsLoading(false);
      });
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const skillOptions = useMemo(() => {
    return skills.map((s) => ({ id: s.name, label: s.name }));
  }, [skills]);

  const handleChatbotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatbotForm.file) {
      return;
    }

    try {
      await onUploadChatbotDocument({
        file: chatbotForm.file,
        title: chatbotForm.title,
        description: chatbotForm.description || undefined,
        industry: chatbotForm.industry || undefined,
        level: chatbotForm.level || undefined,
      });
      setChatbotForm({
        file: null,
        title: '',
        description: '',
        industry: '',
        level: '',
      });
      if (chatbotFileRef.current) {
        chatbotFileRef.current.value = '';
      }
    } catch {
      return;
    }
  };

  const handleRoadmapSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roadmapForm.file || !roadmapForm.skillName.trim()) {
      return;
    }

    try {
      await onUploadRoadmapDocument({
        file: roadmapForm.file,
        title: roadmapForm.title,
        description: roadmapForm.description || undefined,
        skillName: roadmapForm.skillName,
        industry: roadmapForm.industry || undefined,
        level: roadmapForm.level || undefined,
      });
      setRoadmapForm({
        file: null,
        title: '',
        description: '',
        skillName: '',
        industry: '',
        level: '',
      });
      if (roadmapFileRef.current) {
        roadmapFileRef.current.value = '';
      }
    } catch {
      return;
    }
  };

  return (
    <section className="adminaiknowledge-card adminaiknowledge-upload-panel">
      <div className="adminaiknowledge-section-header">
        <div>
          <span className="adminaiknowledge-section-eyebrow">Upload trực tiếp</span>
          <h2>Tạo tài liệu AI mới</h2>
          <p>Admin có thể tải tài liệu chatbot hoặc roadmap ở dạng PDF, DOCX, MD, hoặc TXT để lưu trữ và kích hoạt quy trình ingest hiện tại.</p>
        </div>
      </div>

      <div className="adminaiknowledge-upload-tabs">
        <button
          type="button"
          className={`adminaiknowledge-tab-btn ${activeTab === 'chatbot' ? 'active' : ''}`}
          onClick={() => setActiveTab('chatbot')}
        >
          <FileText size={16} />
          Chatbot global
        </button>
        <button
          type="button"
          className={`adminaiknowledge-tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          <Layers3 size={16} />
          Roadmap skill
        </button>
      </div>

      {activeTab === 'chatbot' && (
        <form className="adminaiknowledge-form-grid" onSubmit={(event) => void handleChatbotSubmit(event)}>
          <label className="adminaiknowledge-field adminaiknowledge-field--full">
            <span>Tệp tài liệu</span>
            <input
              ref={chatbotFileRef}
              type="file"
              accept=".pdf,.docx,.md,.txt"
              required
              onChange={(event) =>
                setChatbotForm((previous) => ({
                  ...previous,
                  file: event.target.files?.[0] ?? null,
                }))
              }
            />
          </label>

          <label className="adminaiknowledge-field">
            <span>Tiêu đề</span>
            <input
              type="text"
              value={chatbotForm.title}
              required
              onChange={(event) =>
                setChatbotForm((previous) => ({
                  ...previous,
                  title: event.target.value,
                }))
              }
            />
          </label>

          <label className="adminaiknowledge-field">
            <span>Industry</span>
            <select
              value={chatbotForm.industry}
              onChange={(event) =>
                setChatbotForm((previous) => ({
                  ...previous,
                  industry: event.target.value,
                }))
              }
            >
              {AI_KNOWLEDGE_INDUSTRY_OPTIONS.map((option) => (
                <option key={option.value || 'general'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="adminaiknowledge-field">
            <span>Level</span>
            <select
              value={chatbotForm.level}
              onChange={(event) =>
                setChatbotForm((previous) => ({
                  ...previous,
                  level: event.target.value,
                }))
              }
            >
              {AI_KNOWLEDGE_LEVEL_OPTIONS.map((option) => (
                <option key={option.value || 'general'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="adminaiknowledge-field adminaiknowledge-field--full">
            <span>Mô tả</span>
            <textarea
              rows={4}
              value={chatbotForm.description}
              onChange={(event) =>
                setChatbotForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <div className="adminaiknowledge-form-actions">
            <button
              type="submit"
              className="adminaiknowledge-primary-btn"
              disabled={uploadingKind === 'chatbot' || !chatbotForm.file || !chatbotForm.title.trim()}
            >
              <FileUp size={16} />
              {uploadingKind === 'chatbot' ? 'Đang tải lên...' : 'Tải tài liệu chatbot'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'roadmap' && (
        <form className="adminaiknowledge-form-grid" onSubmit={(event) => void handleRoadmapSubmit(event)}>
          <label className="adminaiknowledge-field adminaiknowledge-field--full">
            <span>Tệp tài liệu</span>
            <input
              ref={roadmapFileRef}
              type="file"
              accept=".pdf,.docx,.md,.txt"
              required
              onChange={(event) =>
                setRoadmapForm((previous) => ({
                  ...previous,
                  file: event.target.files?.[0] ?? null,
                }))
              }
            />
          </label>

          <label className="adminaiknowledge-field">
            <span>Tiêu đề</span>
            <input
              type="text"
              value={roadmapForm.title}
              required
              onChange={(event) =>
                setRoadmapForm((previous) => ({
                  ...previous,
                  title: event.target.value,
                }))
              }
            />
          </label>

          <label className="adminaiknowledge-field">
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Skill name
              {skillsError && (
                <button 
                  type="button" 
                  onClick={loadSkills}
                  style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Thử lại
                </button>
              )}
            </span>
            <LocalSearchSelect
              options={skillOptions}
              value={roadmapForm.skillName}
              placeholder={skillsLoading ? "Đang tải kỹ năng..." : skillsError ? "Lỗi tải kỹ năng" : "Chọn kỹ năng..."}
              onChange={(val) =>
                setRoadmapForm((previous) => ({
                  ...previous,
                  skillName: val as string,
                }))
              }
              disabled={skillsLoading || !!skillsError}
            />
          </label>



          <label className="adminaiknowledge-field">
            <span>Level</span>
            <select
              value={roadmapForm.level}
              onChange={(event) =>
                setRoadmapForm((previous) => ({
                  ...previous,
                  level: event.target.value,
                }))
              }
            >
              {AI_KNOWLEDGE_LEVEL_OPTIONS.map((option) => (
                <option key={option.value || 'general'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="adminaiknowledge-field adminaiknowledge-field--full">
            <span>Mô tả</span>
            <textarea
              rows={4}
              value={roadmapForm.description}
              onChange={(event) =>
                setRoadmapForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </label>

          <div className="adminaiknowledge-form-actions">
            <button
              type="submit"
              className="adminaiknowledge-primary-btn"
              disabled={
                uploadingKind === 'roadmap' || 
                skillsLoading || 
                !!skillsError || 
                !roadmapForm.skillName || 
                !roadmapForm.file || 
                !roadmapForm.title.trim()
              }
            >
              <FileUp size={16} />
              {uploadingKind === 'roadmap' ? 'Đang tải lên...' : 'Tải tài liệu roadmap'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default AdminAiKnowledgeUploadPanel;
