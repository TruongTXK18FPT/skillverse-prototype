import React, { useState, useRef, useEffect, useCallback } from 'react';
import contractService, { OnboardingInfoResponse } from '../../services/contractService';
import './RecruiterContractUpload.css';

// ==================== TYPES ====================

interface RecruiterContractUploadProps {
  applicationId: number;
  contractId?: number; // If contract already exists
  onUploaded?: (pdfUrl: string) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ==================== COMPONENT ====================

const RecruiterContractUpload: React.FC<RecruiterContractUploadProps> = ({
  applicationId,
  contractId: externalContractId,
  onUploaded,
  onSuccess,
  onCancel,
}) => {
  // Onboarding info
  const [onboardingInfo, setOnboardingInfo] = useState<OnboardingInfoResponse | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolved contract ID — either external or auto-discovered
  const [resolvedContractId, setResolvedContractId] = useState<number | null>(externalContractId ?? null);

  // ==================== LOAD ONBOARDING INFO ====================

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const info = await contractService.getOnboardingInfo(applicationId);
        setOnboardingInfo(info);
      } catch {
        // No info yet — that's OK
      } finally {
        setLoadingInfo(false);
      }
    };
    loadInfo();
  }, [applicationId]);

  // ==================== FILE HANDLERS ====================

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Chỉ chấp nhận file PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File quá lớn (tối đa 10MB)');
      return;
    }
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!endDate) {
      setError('Ngày kết thúc hợp đồng là bắt buộc');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      let targetContractId = resolvedContractId ?? externalContractId;

      // If no contract exists yet, create a minimal one for PDF attachment
      if (!targetContractId) {
        const newContract = await contractService.createContract({
          applicationId,
          contractType: 'FULL_TIME' as any,
          salary: 0,
          salaryText: 'Theo hợp đồng đính kèm',
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate,
        });
        targetContractId = newContract.id;
        setResolvedContractId(newContract.id);
      }

      const result = await contractService.uploadContractPdf(targetContractId, selectedFile, startDate || undefined, endDate);
      const pdfUrl = result.customContractPdfUrl || result.pdfUrl || '';
      setUploadedPdfUrl(pdfUrl);
      onUploaded?.(pdfUrl);
      onSuccess?.();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Upload thất bại';
      setError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ==================== RENDER ====================

  return (
    <div className="sv-contract-upload">
      <div className="sv-contract-upload__header">
        <h2 className="sv-contract-upload__title">📎 Upload Hợp Đồng PDF</h2>
        <p className="sv-contract-upload__subtitle">
          Upload file hợp đồng có sẵn của công ty và gửi trực tiếp cho ứng viên ký
        </p>
      </div>

      {/* Onboarding Info Review */}
      {loadingInfo ? (
        <div className="sv-contract-upload__info-review" style={{ textAlign: 'center', color: '#64748b' }}>
          Đang tải thông tin ứng viên...
        </div>
      ) : onboardingInfo ? (
        <div className="sv-contract-upload__info-review">
          <h3 className="sv-contract-upload__info-review-title">Thông tin ứng viên</h3>
          <div className="sv-contract-upload__info-grid">
            <div className="sv-contract-upload__info-item">
              <span className="sv-contract-upload__info-label">Họ tên</span>
              <span className="sv-contract-upload__info-value">{onboardingInfo.fullName}</span>
            </div>
            <div className="sv-contract-upload__info-item">
              <span className="sv-contract-upload__info-label">Số CCCD</span>
              <span className="sv-contract-upload__info-value">{onboardingInfo.idCardNumber}</span>
            </div>
            <div className="sv-contract-upload__info-item">
              <span className="sv-contract-upload__info-label">Ngày cấp</span>
              <span className="sv-contract-upload__info-value">{onboardingInfo.idCardDate || '—'}</span>
            </div>
            <div className="sv-contract-upload__info-item">
              <span className="sv-contract-upload__info-label">Nơi cấp</span>
              <span className="sv-contract-upload__info-value">{onboardingInfo.idCardPlace}</span>
            </div>
            <div className="sv-contract-upload__info-item">
              <span className="sv-contract-upload__info-label">Ngân hàng</span>
              <span className="sv-contract-upload__info-value">{onboardingInfo.bankName}</span>
            </div>
            <div className="sv-contract-upload__info-item">
              <span className="sv-contract-upload__info-label">Số tài khoản</span>
              <span className="sv-contract-upload__info-value">{onboardingInfo.bankAccountNumber}</span>
            </div>
            <div className="sv-contract-upload__info-item">
              <span className="sv-contract-upload__info-label">Chủ tài khoản</span>
              <span className="sv-contract-upload__info-value">{onboardingInfo.bankAccountHolder}</span>
            </div>
            {onboardingInfo.address && (
              <div className="sv-contract-upload__info-item">
                <span className="sv-contract-upload__info-label">Địa chỉ</span>
                <span className="sv-contract-upload__info-value">{onboardingInfo.address}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="sv-contract-upload__info-review" style={{ textAlign: 'center', color: '#f59e0b' }}>
          ⚠️ Ứng viên chưa cung cấp thông tin onboarding
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#f43f5e',
          fontSize: '0.85rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Already uploaded */}
      {uploadedPdfUrl && (
        <div className="sv-contract-upload__pdf-preview">
          📄{' '}
          <a className="sv-contract-upload__pdf-link" href={uploadedPdfUrl} target="_blank" rel="noopener noreferrer">
            Xem file hợp đồng đã upload
          </a>
        </div>
      )}

      {/* Upload dropzone */}
      <div
        className={`sv-contract-upload__dropzone ${selectedFile ? 'sv-contract-upload__dropzone--active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="sv-contract-upload__dropzone-icon">📋</div>
        <p className="sv-contract-upload__dropzone-text">
          Kéo thả hoặc <span className="sv-contract-upload__dropzone-text--highlight">nhấn để chọn</span> file PDF hợp đồng
        </p>
        <p className="sv-contract-upload__dropzone-hint">Chỉ hỗ trợ PDF — Tối đa 10MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="sv-contract-upload__file-preview">
          <span className="sv-contract-upload__file-icon">📄</span>
          <div className="sv-contract-upload__file-info">
            <div className="sv-contract-upload__file-name">{selectedFile.name}</div>
            <div className="sv-contract-upload__file-size">{formatFileSize(selectedFile.size)}</div>
          </div>
          <button
            className="sv-contract-upload__file-remove"
            onClick={() => setSelectedFile(null)}
            title="Xóa file"
          >
            ✕
          </button>
        </div>
      )}

      {/* Date inputs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', marginTop: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
            Ngày bắt đầu
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
            Ngày kết thúc <span style={{ color: '#f43f5e' }}>*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="sv-contract-upload__actions">
        {onCancel && (
          <button
            className="sv-contract-upload__btn sv-contract-upload__btn--ghost"
            onClick={onCancel}
            type="button"
          >
            ← Quay lại
          </button>
        )}
        <button
          className="sv-contract-upload__btn sv-contract-upload__btn--primary"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <span className="sv-contract-upload__btn-spinner" />
              Đang upload & gửi...
            </>
          ) : (
            '☁️ Upload & Gửi cho ứng viên'
          )}
        </button>
      </div>
    </div>
  );
};

export default RecruiterContractUpload;
