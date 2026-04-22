import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Clock, FileText, Send, Upload, X, XCircle } from 'lucide-react';
import type { NodeEvidenceRecordResponse, NodeVerificationStatus } from '../../types/NodeMentoring';
import './NodeEvidenceSubmissionModal.css';

const MAX_WORD_COUNT = 500;

const countWords = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) return 'Tệp không được quá 5MB';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Chỉ chấp nhận PDF, DOC, DOCX';
  return null;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StatusBadge: FC<{ status: NodeVerificationStatus }> = ({ status }) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="nesm-badge nesm-badge--verified">
          <CheckCircle size={13} /> Đã xác thực
        </span>
      );
    case 'APPROVED':
      return (
        <span className="nesm-badge nesm-badge--approved">
          <CheckCircle size={13} /> Đã duyệt
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="nesm-badge nesm-badge--pending">
          <Clock size={13} /> Đang review
        </span>
      );
    case 'REJECTED':
      return (
        <span className="nesm-badge nesm-badge--rejected">
          <XCircle size={13} /> Bị từ chối
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="nesm-badge nesm-badge--pending">
          <Clock size={13} /> Chưa xác thực
        </span>
      );
  }
};

export interface NodeEvidenceSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  existingEvidence?: NodeEvidenceRecordResponse | null;
  isLocked: boolean;
  onSubmit: (data: { submissionText: string; attachmentUrl?: string }) => Promise<void>;
  onUploadFile: (file: File) => Promise<string>;
}

const NodeEvidenceSubmissionModal: FC<NodeEvidenceSubmissionModalProps> = ({
  isOpen,
  onClose,
  nodeId,
  existingEvidence,
  isLocked,
  onSubmit,
  onUploadFile,
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSubmissionText(existingEvidence?.submissionText ?? '');
    setUploadedUrl(existingEvidence?.attachmentUrl ?? '');
    setSelectedFile(null);
    setFileError(null);
    setFormError(null);
    setTimeout(() => firstFocusableRef.current?.focus(), 50);
  }, [isOpen, existingEvidence]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }
      setFileError(null);
      setSelectedFile(file);
      setUploading(true);
      try {
        const url = await onUploadFile(file);
        setUploadedUrl(url);
      } catch {
        setFileError('Upload tệp thất bại. Vui lòng thử lại.');
        setSelectedFile(null);
      } finally {
        setUploading(false);
      }
    },
    [onUploadFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedUrl(existingEvidence?.attachmentUrl ?? '');
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFormValid = (): boolean => {
    const hasText = submissionText.trim().length > 0;
    const hasFile = Boolean(uploadedUrl);
    if (!hasText && !hasFile) return false;
    if (countWords(submissionText) > MAX_WORD_COUNT) return false;
    return true;
  };

  const handleSubmit = async () => {
    setFormError(null);
    const hasText = submissionText.trim().length > 0;
    const hasFile = Boolean(uploadedUrl);

    if (!hasText && !hasFile) {
      setFormError('Vui lòng nhập mô tả hoặc chọn tệp');
      return;
    }
    if (countWords(submissionText) > MAX_WORD_COUNT) {
      setFormError(`Mô tả không được quá ${MAX_WORD_COUNT} từ`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        submissionText: submissionText.trim(),
        attachmentUrl: uploadedUrl || undefined,
      });
      onClose();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFormError(axiosErr.response?.data?.message || 'Nộp evidence thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div
      className="nesm-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nộp minh chứng cho node này"
    >
      <div
        className="nesm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="nesm-header">
          <div className="nesm-header__left">
            <h2 className="nesm-title">Nộp minh chứng cho node này</h2>
            {existingEvidence && (
              <StatusBadge status={existingEvidence.verificationStatus} />
            )}
          </div>
          <button
            ref={firstFocusableRef}
            type="button"
            className="nesm-close"
            onClick={onClose}
            aria-label="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="nesm-body">
          {isLocked && (
            <div className="nesm-alert nesm-alert--info">
              <CheckCircle size={15} />
              Node này đã được xác thực. Không thể chỉnh sửa evidence nữa.
            </div>
          )}

          {existingEvidence?.mentorFeedback && (
            <div className="nesm-feedback">
              <AlertCircle size={15} />
              <div>
                <strong>Mentor feedback:</strong>
                <p>{existingEvidence.mentorFeedback}</p>
              </div>
            </div>
          )}

          {formError && (
            <div className="nesm-alert nesm-alert--error">
              <XCircle size={15} /> {formError}
            </div>
          )}

          {/* Text input */}
          <div className="nesm-field">
            <label className="nesm-label" htmlFor={`nesm-text-${nodeId}`}>
              Mô tả bài nộp (tuỳ chọn)
            </label>
            <div className="nesm-textarea-wrapper">
              <textarea
                id={`nesm-text-${nodeId}`}
                className={`nesm-textarea${countWords(submissionText) > MAX_WORD_COUNT ? ' nesm-textarea--error' : ''}`}
                rows={5}
                placeholder="Mô tả ngắn gọn bạn đã làm gì cho node này…"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                disabled={isLocked || submitting}
              />
              <span className={`nesm-char-count${countWords(submissionText) > MAX_WORD_COUNT ? ' nesm-char-count--error' : ''}`}>
                {countWords(submissionText)}/{MAX_WORD_COUNT} từ
              </span>
            </div>
            {countWords(submissionText) > MAX_WORD_COUNT && (
              <span className="nesm-field-error">Mô tả không được quá {MAX_WORD_COUNT} từ</span>
            )}
          </div>

          {/* File upload */}
          <div className="nesm-field">
            <label className="nesm-label">
              Tệp đính kèm (tuỳ chọn)
            </label>

            {!selectedFile && !existingEvidence?.attachmentUrl && (
              <div
                className={`nesm-dropzone${isDragOver ? ' nesm-dropzone--active' : ''}${isLocked || submitting ? ' nesm-dropzone--disabled' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isLocked && !submitting && fileInputRef.current?.click()}
                role="button"
                tabIndex={isLocked || submitting ? -1 : 0}
                aria-label="Kéo thả hoặc chọn tệp"
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <Upload size={28} className="nesm-dropzone__icon" />
                <p className="nesm-dropzone__text">Kéo thả tệp vào đây</p>
                <p className="nesm-dropzone__hint">hoặc nhấn để chọn · PDF, DOC, DOCX · Tối đa 5MB</p>
              </div>
            )}

            {/* Existing attachment (no new file selected) */}
            {!selectedFile && existingEvidence?.attachmentUrl && (
              <div className="nesm-file-preview">
                <FileText size={16} className="nesm-file-preview__icon" />
                <div className="nesm-file-preview__info">
                  <a
                    href={existingEvidence.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nesm-file-preview__name"
                  >
                    Xem tệp đính kèm hiện tại
                  </a>
                </div>
                {!isLocked && (
                  <button
                    type="button"
                    className="nesm-file-preview__change"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || submitting}
                  >
                    Thay tệp
                  </button>
                )}
              </div>
            )}

            {/* New file selected */}
            {selectedFile && (
              <div className="nesm-file-preview">
                <FileText size={16} className="nesm-file-preview__icon" />
                <div className="nesm-file-preview__info">
                  <span className="nesm-file-preview__name">{selectedFile.name}</span>
                  <span className="nesm-file-preview__size">{formatFileSize(selectedFile.size)}</span>
                </div>
                {uploading ? (
                  <span className="nesm-file-preview__uploading">Đang upload…</span>
                ) : (
                  <button
                    type="button"
                    className="nesm-file-preview__remove"
                    onClick={handleRemoveFile}
                    aria-label="Xóa tệp"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {fileError && (
              <span className="nesm-field-error">{fileError}</span>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = '';
              }}
              disabled={isLocked || submitting || uploading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="nesm-footer">
          <button
            type="button"
            className="nesm-btn nesm-btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="nesm-btn nesm-btn--primary"
            onClick={handleSubmit}
            disabled={isLocked || submitting || uploading || !isFormValid()}
          >
            <Send size={14} />
            {submitting
              ? 'Đang nộp…'
              : existingEvidence
                ? 'Cập nhật evidence'
                : 'Nộp evidence'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default NodeEvidenceSubmissionModal;
