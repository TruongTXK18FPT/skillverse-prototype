import { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle, FileText, X } from "lucide-react";
import axiosInstance from "../../../services/axiosInstance";
import "./PinnedDocSelectModal.css";

interface PinnedDocSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: {
    skillId: number;
    skillNameSnapshot: string;
    skillCanonicalKeySnapshot: string;
  }[];
  selectedDocIds: number[];
  onApply: (docIds: number[], docMap?: Record<number, string>) => void;
}

interface AiKnowledgeDocumentItem {
  id: number;
  title: string;
  skillName: string;
  skillSlug: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  createdAt: string;
}

const toRoadmapSkillSlug = (name: string): string => {
  if (!name) return "";
  let normalized = name.trim().toLowerCase();
  
  // Special character mappings
  const specialCharMap: Record<string, string> = {
    "c#": "csharp",
    "c++": "cpp",
    "c/": "c",
    ".net": "dotnet",
    "node.js": "nodejs",
    "nodejs": "nodejs",
    "f#": "fsharp",
    "r#": "rsharp",
  };
  
  for (const [key, value] of Object.entries(specialCharMap)) {
    normalized = normalized.split(key).join(value);
  }
  
  // Remove Vietnamese diacritics
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Replace remaining non-alphanumeric sequences with hyphens
  normalized = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
    
  return normalized;
};

export const PinnedDocSelectModal = ({
  isOpen,
  onClose,
  skills,
  selectedDocIds,
  onApply,
}: PinnedDocSelectModalProps) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<AiKnowledgeDocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);

  // Reset checked IDs when selectedDocIds changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCheckedIds([...selectedDocIds]);
      setError(null);
    }
  }, [isOpen, selectedDocIds]);

  // Fetch documents for the selected skills
  useEffect(() => {
    if (!isOpen) return;

    if (!skills || skills.length === 0) {
      setDocuments([]);
      return;
    }

    const fetchAllDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch documents for each skill concurrently
        const promises = skills.map((skill) => {
          const slug = skill.skillCanonicalKeySnapshot
            ? toRoadmapSkillSlug(skill.skillCanonicalKeySnapshot)
            : skill.skillNameSnapshot
            ? toRoadmapSkillSlug(skill.skillNameSnapshot)
            : `roadmap_skill_${skill.skillId}`;
          return axiosInstance.get<{ content: AiKnowledgeDocumentItem[] }>(
            "/admin/ai-knowledge/documents",
            {
              params: {
                useCase: "ROADMAP_SKILL",
                ingestionStatus: "INDEXED",
                skillSlug: slug,
                size: 50,
              },
            }
          );
        });

        const responses = await Promise.all(promises);
        
        // Flatten and distinct documents by ID
        const allDocs: AiKnowledgeDocumentItem[] = [];
        const seenIds = new Set<number>();

        responses.forEach((res) => {
          if (res.data && Array.isArray(res.data.content)) {
            res.data.content.forEach((doc) => {
              if (!seenIds.has(doc.id)) {
                seenIds.add(doc.id);
                allDocs.push(doc);
              }
            });
          }
        });

        setDocuments(allDocs);
      } catch (err) {
        console.error("Failed to load documents for skills", err);
        setError("Không thể tải danh sách tài liệu. Vui lòng kiểm tra kết nối mạng và thử lại.");
      } finally {
        setLoading(false);
      }
    };

    void fetchAllDocs();
  }, [isOpen, skills]);

  if (!isOpen) return null;

  const handleToggle = (id: number) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    const docMap: Record<number, string> = {};
    documents.forEach((doc) => {
      if (checkedIds.includes(doc.id)) {
        docMap[doc.id] = doc.title;
      }
    });
    onApply(checkedIds, docMap);
    onClose();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="pdsm-overlay">
      <div className="pdsm-modal">
        <header className="pdsm-header">
          <div>
            <h2>📌 Ràng buộc tài liệu chuyên môn</h2>
            <p>Chọn tài liệu AI Knowledge đã được ingest thành công để khóa cứng ngữ cảnh tham khảo khi AI sinh bài học.</p>
          </div>
          <button type="button" className="pdsm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <main className="pdsm-body">
          {skills.length === 0 ? (
            <div className="pdsm-alert pdsm-alert--empty">
              <AlertCircle size={32} />
              <div>
                <h4>Vui lòng chọn kỹ năng trước</h4>
                <p>Node học này chưa được tích chọn bất kỳ kỹ năng liên quan nào. Vui lòng đóng hộp thoại này, tích chọn ít nhất một kỹ năng ở giao diện bên dưới, sau đó quay lại ghim tài liệu.</p>
              </div>
            </div>
          ) : loading ? (
            <div className="pdsm-loading">
              <Loader2 className="pdsm-spin" size={32} />
              <p>Đang quét thư viện tài liệu đã ingest cho các kỹ năng: {skills.map(s => s.skillNameSnapshot).join(", ")}...</p>
            </div>
          ) : error ? (
            <div className="pdsm-alert pdsm-alert--error">
              <AlertCircle size={24} />
              <div>
                <h4>Lỗi hệ thống</h4>
                <p>{error}</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="pdsm-alert pdsm-alert--info">
              <FileText size={32} />
              <div>
                <h4>Không tìm thấy tài liệu phù hợp</h4>
                <p>Hiện chưa có tài liệu AI Knowledge (Use Case: Roadmap) nào được ingest hoàn thành cho các kỹ năng đã chọn: {skills.map(s => s.skillNameSnapshot).join(", ")}.</p>
                <p>Bạn có thể vào tab <strong>Tài Liệu AI</strong> ở thanh menu trái để upload tài liệu mới cho kỹ năng tương ứng trước.</p>
              </div>
            </div>
          ) : (
            <div className="pdsm-table-container">
              <table className="pdsm-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>Chọn</th>
                    <th>Tên tài liệu</th>
                    <th>Kỹ năng</th>
                    <th>Mime Type</th>
                    <th>Dung lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const checked = checkedIds.includes(doc.id);
                    return (
                      <tr
                        key={doc.id}
                        className={checked ? "pdsm-row--selected" : ""}
                        onClick={() => handleToggle(doc.id)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggle(doc.id)}
                          />
                        </td>
                        <td>
                          <div className="pdsm-doc-title">
                            <strong>{doc.title}</strong>
                            <small>{doc.originalFileName}</small>
                          </div>
                        </td>
                        <td>
                          <span className="pdsm-skill-tag">{doc.skillName}</span>
                        </td>
                        <td><code>{doc.mimeType.split("/")[1] || doc.mimeType}</code></td>
                        <td>{formatSize(doc.fileSizeBytes)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>

        <footer className="pdsm-footer">
          <span className="pdsm-selected-count">
            {checkedIds.length > 0 ? (
              <><CheckCircle size={16} /> Đã chọn {checkedIds.length} tài liệu</>
            ) : (
              "Chưa ràng buộc tài liệu nào"
            )}
          </span>
          <div className="pdsm-actions">
            <button type="button" className="pdsm-btn" onClick={onClose}>
              Hủy
            </button>
            <button
              type="button"
              className="pdsm-btn pdsm-btn--primary"
              onClick={handleApply}
              disabled={skills.length === 0}
            >
              Áp dụng
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
