import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Code2,
  FileText,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  X,
} from "lucide-react";
import { JOB_TEMPLATES, JobTemplate } from "../../data/jobTemplates";
import { axiosInstance } from "../../services/axiosInstance";
import MeowlKuruLoader from "../kuru-loader/MeowlKuruLoader";
import { JobMarkdownSurface } from "../shared/JobMarkdownSurface";
import "./RichMarkdownEditor.css";

interface RichMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  error?: string;
}

type Tab = "write" | "preview";

interface PendingImage {
  url: string;
}

interface ToolbarButton {
  icon: React.ReactNode;
  title: string;
  action: () => void;
  disabled?: boolean;
}

interface ToolbarGroup {
  label: string;
  buttons: ToolbarButton[];
}

const escapeImageAlt = (text: string) =>
  text.trim().replace(/\n+/g, " ").replace(/]/g, "\\]");

export const RichMarkdownEditor: React.FC<RichMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Viết mô tả công việc bằng markdown...",
  minHeight = 280,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("write");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [captionText, setCaptionText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateWrapRef = useRef<HTMLDivElement>(null);

  const categories = ["Tất cả", ...new Set(JOB_TEMPLATES.map((t) => t.category))];
  const filteredTemplates =
    selectedCategory === "Tất cả"
      ? JOB_TEMPLATES
      : JOB_TEMPLATES.filter((t) => t.category === selectedCategory);

  const closeCaptionModal = useCallback(() => {
    setCaptionText("");
    setShowCaptionModal(false);
    setPendingImage(null);
  }, []);

  useEffect(() => {
    if (!showTemplatePicker) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (templateWrapRef.current?.contains(event.target as Node)) {
        return;
      }
      setShowTemplatePicker(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowTemplatePicker(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showTemplatePicker]);

  useEffect(() => {
    if (!showCaptionModal) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCaptionModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeCaptionModal, showCaptionModal]);

  const wrapSelection = useCallback(
    (before: string, after: string = before) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.substring(start, end);
      const nextValue =
        value.substring(0, start) + before + selected + after + value.substring(end);

      onChange(nextValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, end + before.length);
      }, 0);
    },
    [onChange, value],
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const start = textarea.selectionStart;
      const nextValue = value.substring(0, start) + text + value.substring(start);

      onChange(nextValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
      }, 0);
    },
    [onChange, value],
  );

  const insertLinePrefix = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const start = textarea.selectionStart;
      let lineStart = start;
      while (lineStart > 0 && value[lineStart - 1] !== "\n") {
        lineStart--;
      }

      const nextValue =
        value.substring(0, lineStart) + prefix + value.substring(lineStart);

      onChange(nextValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    },
    [onChange, value],
  );

  const insertTemplate = useCallback(
    (template: JobTemplate) => {
      const nextValue = value.trim()
        ? `${value.trim()}\n\n${template.markdown}`
        : template.markdown;

      onChange(nextValue);
      setShowTemplatePicker(false);
      setActiveTab("write");
    },
    [onChange, value],
  );

  const uploadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Hình ảnh không được vượt quá 10MB.");
      return;
    }

    setUploadingCount((count) => count + 1);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post("/short-term-jobs/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      setPendingImage({
        url: response.data.url,
      });
      setCaptionText("");
      setShowCaptionModal(true);
    } catch (err: unknown) {
      console.error("Image upload failed:", err);
      const message =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response
          ?.data?.error ||
        (err as { response?: { data?: { error?: string; message?: string } } })?.response
          ?.data?.message ||
        "Upload ảnh thất bại";
      setUploadError(message);
    } finally {
      setUploadingCount((count) => count - 1);
      setUploadProgress(0);
    }
  }, []);

  const insertImageWithCaption = useCallback(() => {
    if (!pendingImage) {
      return;
    }

    const altText = escapeImageAlt(captionText);
    insertAtCursor(`\n![${altText}](${pendingImage.url})\n`);
    setActiveTab("write");
    closeCaptionModal();
  }, [captionText, closeCaptionModal, insertAtCursor, pendingImage]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(event.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (!imageItem) {
        return;
      }

      event.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        void uploadImage(file);
      }
    },
    [uploadImage],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLTextAreaElement>) => {
      const files = Array.from(event.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (!imageFile) {
        return;
      }

      event.preventDefault();
      void uploadImage(imageFile);
    },
    [uploadImage],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Tab") {
        event.preventDefault();
        insertAtCursor("  ");
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "b":
            event.preventDefault();
            wrapSelection("**");
            break;
          case "i":
            event.preventDefault();
            wrapSelection("*");
            break;
          case "k":
            event.preventDefault();
            wrapSelection("[", "](url)");
            break;
        }
      }
    },
    [insertAtCursor, wrapSelection],
  );

  const toolbarGroups: ToolbarGroup[] = [
    {
      label: "Định dạng",
      buttons: [
        {
          icon: <span className="rte-toolbar__heading">H1</span>,
          title: "Tiêu đề 1",
          action: () => insertLinePrefix("# "),
        },
        {
          icon: <span className="rte-toolbar__heading">H2</span>,
          title: "Tiêu đề 2",
          action: () => insertLinePrefix("## "),
        },
        {
          icon: <span className="rte-toolbar__heading">H3</span>,
          title: "Tiêu đề 3",
          action: () => insertLinePrefix("### "),
        },
      ],
    },
    {
      label: "Văn bản",
      buttons: [
        {
          icon: <Bold size={15} />,
          title: "Bold (Ctrl+B)",
          action: () => wrapSelection("**"),
        },
        {
          icon: <Italic size={15} />,
          title: "Italic (Ctrl+I)",
          action: () => wrapSelection("*"),
        },
        {
          icon: <Strikethrough size={15} />,
          title: "Strikethrough",
          action: () => wrapSelection("~~"),
        },
      ],
    },
    {
      label: "Cấu trúc",
      buttons: [
        {
          icon: <List size={15} />,
          title: "Danh sách",
          action: () => insertLinePrefix("- "),
        },
        {
          icon: <ListOrdered size={15} />,
          title: "Danh sách số",
          action: () => insertLinePrefix("1. "),
        },
        {
          icon: <span className="rte-toolbar__symbol">[]</span>,
          title: "Checklist",
          action: () => insertLinePrefix("- [ ] "),
        },
        {
          icon: <Quote size={15} />,
          title: "Blockquote",
          action: () => insertLinePrefix("> "),
        },
        {
          icon: <Code2 size={15} />,
          title: "Code block",
          action: () => wrapSelection("```\n", "\n```"),
        },
        {
          icon: <span className="rte-toolbar__symbol">|</span>,
          title: "Bảng",
          action: () =>
            insertAtCursor(
              "\n| Header | Header |\n|--------|--------|\n| Cell  | Cell  |\n",
            ),
        },
      ],
    },
    {
      label: "Liên kết và hình",
      buttons: [
        {
          icon: <Link2 size={15} />,
          title: "Liên kết (Ctrl+K)",
          action: () => wrapSelection("[", "](url)"),
        },
        {
          icon: <ImagePlus size={15} />,
          title: "Upload ảnh",
          action: () => fileInputRef.current?.click(),
          disabled: uploadingCount > 0,
        },
      ],
    },
  ];

  return (
    <div className={`rte-container ${error ? "rte-container--error" : ""}`}>
      <div className="rte-tabs">
        <div className="rte-tabs__group">
          <button
            type="button"
            className={`rte-tab ${activeTab === "write" ? "rte-tab--active" : ""}`}
            onClick={() => setActiveTab("write")}
          >
            Viết
          </button>
          <button
            type="button"
            className={`rte-tab ${activeTab === "preview" ? "rte-tab--active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            Xem trước
          </button>
        </div>

        <div className="rte-tabs__spacer" />

        <div ref={templateWrapRef} className="rte-template-wrap">
          <button
            type="button"
            className="rte-template-btn"
            onClick={() => setShowTemplatePicker((open) => !open)}
            title="Chèn mẫu"
          >
            <FileText size={15} />
            <span>Chèn mẫu</span>
          </button>

          {showTemplatePicker && (
            <div className="rte-template-picker" onClick={(event) => event.stopPropagation()}>
              <div className="rte-template-picker__header">
                <span>Chọn mẫu mô tả công việc</span>
                <button
                  type="button"
                  className="rte-template-picker__close"
                  onClick={() => setShowTemplatePicker(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="rte-template-picker__categories">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`rte-template-picker__cat ${
                      selectedCategory === category
                        ? "rte-template-picker__cat--active"
                        : ""
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="rte-template-picker__list">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="rte-template-picker__item"
                    onClick={() => insertTemplate(template)}
                    title={template.description}
                  >
                    <span className="rte-template-picker__item-name">{template.name}</span>
                    <span className="rte-template-picker__item-desc">
                      {template.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadImage(file);
          }
          event.target.value = "";
        }}
      />

      <div className="rte-editor-shell">
        {activeTab === "write" ? (
          <>
            <div className="rte-toolbar">
              {toolbarGroups.map((group, groupIndex) => (
                <React.Fragment key={group.label}>
                  {groupIndex > 0 && <div className="rte-toolbar__sep" />}
                  <div className="rte-toolbar__group">
                    {group.buttons.map((button, buttonIndex) => (
                      <button
                        key={`${group.label}-${buttonIndex}`}
                        type="button"
                        className="rte-toolbar__btn"
                        title={button.title}
                        onClick={button.action}
                        disabled={uploadingCount > 0 || button.disabled}
                      >
                        {button.icon}
                      </button>
                    ))}
                  </div>
                </React.Fragment>
              ))}

              {uploadingCount > 0 ? (
                <div className="rte-toolbar__upload-progress">
                  <span className="rte-toolbar__spinner" />
                  <div className="rte-toolbar__progress-bar">
                    <div
                      className="rte-toolbar__progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="rte-toolbar__progress-pct">{uploadProgress}%</span>
                </div>
              ) : null}
            </div>

            <textarea
              ref={textareaRef}
              className="rte-textarea"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(event) => event.preventDefault()}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{ minHeight }}
              spellCheck
            />
          </>
        ) : (
          <div className="rte-preview" style={{ minHeight }}>
            <JobMarkdownSurface
              content={value}
              density="editor"
              theme="teal"
              placeholder="Không có nội dung để xem trước."
            />
          </div>
        )}
      </div>

      {uploadError && <div className="rte-upload-error">{uploadError}</div>}
      {error && <span className="rte-error">{error}</span>}

      {showCaptionModal && pendingImage && (
        <div className="rte-caption-modal-overlay" onClick={closeCaptionModal}>
          <div className="rte-caption-modal" onClick={(event) => event.stopPropagation()}>
            <div className="rte-caption-modal__header">
              <span className="rte-caption-modal__title">Thêm mô tả cho ảnh</span>
              <button
                type="button"
                className="rte-caption-modal__close"
                onClick={closeCaptionModal}
              >
                <X size={16} />
              </button>
            </div>

            <div className="rte-caption-modal__preview">
              <img src={pendingImage.url} alt="Preview" />
            </div>

            <div className="rte-caption-modal__body">
              <textarea
                className="rte-caption-modal__input"
                placeholder="Nhập mô tả (caption) cho hình ảnh này..."
                value={captionText}
                onChange={(event) => setCaptionText(event.target.value)}
                autoFocus
                rows={2}
              />

              <div className="rte-caption-modal__actions">
                <button
                  type="button"
                  className="rte-caption-modal__btn rte-caption-modal__btn--secondary"
                  onClick={closeCaptionModal}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="rte-caption-modal__btn rte-caption-modal__btn--primary"
                  onClick={insertImageWithCaption}
                  disabled={uploadingCount > 0}
                >
                  {uploadingCount > 0 ? (
                    <>
                      <MeowlKuruLoader size="tiny" text="" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Thêm vào bài viết"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
