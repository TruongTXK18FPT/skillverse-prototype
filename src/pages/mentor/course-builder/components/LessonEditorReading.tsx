import React from "react";
import { FiLink, FiImage, FiFileText, FiX } from "react-icons/fi";
import { LessonDraft, LessonAttachmentDraft } from "../courseBuilderTypes";
import RichTextEditor from "../../../../components/shared/RichTextEditor";

interface LessonEditorReadingProps {
  lesson: LessonDraft;
  moduleId: string;
  isEditable: boolean;
  onUpdateLessonField: (moduleId: string, lessonId: string, update: Partial<LessonDraft>) => void;
  onOpenReadingLinkDialog: (moduleId: string, lessonId: string, value: string) => void;
  onFileUpload: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const LessonEditorReading: React.FC<LessonEditorReadingProps> = ({
  lesson,
  moduleId,
  isEditable,
  onUpdateLessonField,
  onOpenReadingLinkDialog,
  onFileUpload,
  fileInputRef,
}) => {
  const handleAttachmentRemove = (idx: number) => {
    const newAtts = lesson.attachments?.filter((_, i) => i !== idx);
    onUpdateLessonField(moduleId, lesson.id, { attachments: newAtts });
  };

  return (
    <>
      <div className="cb-form-group">
        <label className="cb-label">Nội dung</label>
        <RichTextEditor
          key={lesson.id}
          initialContent={lesson.contentText || ""}
          onChange={(val) =>
            onUpdateLessonField(moduleId, lesson.id, {
              contentText: val,
            })
          }
          placeholder="Nhập nội dung bài học..."
        />
      </div>
      <div className="cb-form-group">
        <label className="cb-label">
          Tài liệu tham khảo (Link/File URL)
        </label>
        <div className="cb-reading-link-actions">
          <button
            className="cb-button cb-button--secondary cb-reading-link-actions__button"
            onClick={() =>
              onOpenReadingLinkDialog(
                moduleId,
                lesson.id,
                lesson.resourceUrl,
              )
            }
          >
            <FiLink />{" "}
            {lesson.resourceUrl ? "Sửa Link" : "Nhập Link"}
          </button>
          <button
            className="cb-button cb-button--secondary cb-reading-link-actions__button"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiImage /> Upload File
          </button>
        </div>

        {lesson.resourceUrl && (
          <a
            className="cb-reading-link-current"
            href={lesson.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiLink />
            <span>{lesson.resourceUrl}</span>
          </a>
        )}

        {/* Attachments List */}
        {lesson.attachments && lesson.attachments.length > 0 && (
          <div
            className="cb-attachments-list"
            style={{ marginTop: 12 }}
          >
            {lesson.attachments.map(
              (att: LessonAttachmentDraft, idx: number) => (
                <div
                  key={idx}
                  className="cb-attachment-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px",
                    border: "1px solid var(--cb-border-color)",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                >
                  <FiFileText />
                  <a
                    href={att.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      color: "var(--cb-accent-cyan)",
                    }}
                  >
                    {att.name || "Attachment"}
                  </a>
                  <button
                    className="cb-icon-button"
                    onClick={() => handleAttachmentRemove(idx)}
                  >
                    <FiX />
                  </button>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default LessonEditorReading;
