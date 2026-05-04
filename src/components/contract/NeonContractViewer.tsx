import React, { useState, useEffect } from 'react';
import contractService from '../../services/contractService';
import { ContractResponse, SignatureAction } from '../../types/contract';
import './NeonContractViewer.css';

// ==================== TYPES ====================

interface NeonContractViewerProps {
  contractId: number;
  currentUserId: number;
  onSigned?: () => void;
  onRejected?: () => void;
}

type ViewerStatus = 'loading' | 'ready' | 'signing' | 'signed' | 'rejected' | 'error';

// ==================== COMPONENT ====================

const NeonContractViewer: React.FC<NeonContractViewerProps> = ({
  contractId,
  currentUserId,
  onSigned,
  onRejected,
}) => {
  const [contract, setContract] = useState<ContractResponse | null>(null);
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  // ==================== LOAD CONTRACT ====================

  useEffect(() => {
    const load = async () => {
      try {
        const data = await contractService.getContractById(contractId);
        setContract(data);

        if (data.status === 'SIGNED') {
          setViewerStatus('signed');
        } else if (data.status === 'REJECTED' || data.status === 'CANCELLED') {
          setViewerStatus('rejected');
        } else {
          setViewerStatus('ready');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi tải hợp đồng';
        setError(msg);
        setViewerStatus('error');
      }
    };
    load();
  }, [contractId]);

  // ==================== HELPERS ====================

  const getPdfUrl = (): string | null => {
    if (!contract) return null;
    return contract.customContractPdfUrl || contract.pdfUrl || contract.signedPdfUrl || null;
  };

  const isCandidate = contract?.candidateId === currentUserId;
  const isEmployer = contract?.employerId === currentUserId;

  const canSign = (): boolean => {
    if (!contract) return false;
    if (contract.status === 'PENDING_SIGNER' && isCandidate) return true;
    if (contract.status === 'PENDING_EMPLOYER' && isEmployer) return true;
    return false;
  };

  const getStatusBadge = () => {
    if (!contract) return null;
    const s = contract.status;
    if (s === 'SIGNED') return <span className="sv-neon-viewer__status-badge sv-neon-viewer__status-badge--signed">✓ Đã ký hoàn tất</span>;
    if (s === 'REJECTED') return <span className="sv-neon-viewer__status-badge sv-neon-viewer__status-badge--rejected">✗ Bị từ chối</span>;
    if (s === 'CANCELLED') return <span className="sv-neon-viewer__status-badge sv-neon-viewer__status-badge--rejected">⊘ Đã hủy</span>;
    if (s === 'PENDING_SIGNER') return <span className="sv-neon-viewer__status-badge sv-neon-viewer__status-badge--pending">⏳ Chờ ứng viên ký</span>;
    if (s === 'PENDING_EMPLOYER') return <span className="sv-neon-viewer__status-badge sv-neon-viewer__status-badge--pending">⏳ Chờ NTD đối ký</span>;
    if (s === 'DRAFT') return <span className="sv-neon-viewer__status-badge sv-neon-viewer__status-badge--pending">📝 Bản nháp</span>;
    return null;
  };

  // ==================== SIGN / REJECT ====================

  const handleSign = async () => {
    if (!contract) return;
    setIsSigning(true);
    setError(null);

    try {
      // For now, use a placeholder signature — integrate SignatureCanvas separately
      const result = await contractService.signContract(contract.id, {
        action: SignatureAction.SIGN,
        signatureImageUrl: '', // TODO: integrate SignatureCanvas here
      });
      setContract(result);
      if (result.status === 'SIGNED') {
        setViewerStatus('signed');
        onSigned?.();
      } else {
        setViewerStatus('ready');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi ký hợp đồng';
      setError(msg);
    } finally {
      setIsSigning(false);
    }
  };

  const handleReject = async () => {
    if (!contract) return;
    if (!window.confirm('Bạn chắc chắn muốn từ chối hợp đồng này?')) return;

    try {
      const result = await contractService.signContract(contract.id, {
        action: SignatureAction.REJECT,
      });
      setContract(result);
      setViewerStatus('rejected');
      onRejected?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi từ chối hợp đồng';
      setError(msg);
    }
  };

  // ==================== RENDER ====================

  if (viewerStatus === 'loading') {
    return (
      <div className="sv-neon-viewer">
        <div className="sv-neon-viewer__pdf-placeholder">
          <div className="sv-neon-viewer__pdf-placeholder-icon">⏳</div>
          <p className="sv-neon-viewer__pdf-placeholder-text">Đang tải hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (viewerStatus === 'error') {
    return (
      <div className="sv-neon-viewer">
        <div className="sv-neon-viewer__pdf-placeholder">
          <div className="sv-neon-viewer__pdf-placeholder-icon">⚠️</div>
          <p className="sv-neon-viewer__pdf-placeholder-text">{error || 'Không thể tải hợp đồng'}</p>
        </div>
      </div>
    );
  }

  const pdfUrl = getPdfUrl();

  return (
    <div className="sv-neon-viewer">
      {/* Header */}
      <div className="sv-neon-viewer__header">
        <div>
          <h2 className="sv-neon-viewer__title">
            📄 {contract?.jobTitle || 'Hợp đồng lao động'}
          </h2>
          {contract?.contractNumber && (
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Số: {contract.contractNumber}</span>
          )}
        </div>
        <div className="sv-neon-viewer__actions-top">
          {getStatusBadge()}
          {pdfUrl && (
            <a
              className="sv-neon-viewer__download-btn"
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇️ Tải PDF
            </a>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#f43f5e',
          fontSize: '0.85rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* PDF Viewer */}
      <div className="sv-neon-viewer__pdf-container">
        {pdfUrl ? (
          <iframe
            className="sv-neon-viewer__pdf-frame"
            src={pdfUrl}
            title="Contract PDF Preview"
          />
        ) : (
          <div className="sv-neon-viewer__pdf-placeholder">
            <div className="sv-neon-viewer__pdf-placeholder-icon">📋</div>
            <p className="sv-neon-viewer__pdf-placeholder-text">
              Chưa có file hợp đồng PDF. Hãy chờ nhà tuyển dụng upload.
            </p>
          </div>
        )}
      </div>

      {/* Signature Section — only show if user can sign */}
      {canSign() && (
        <div className="sv-neon-viewer__sign-section">
          <h3 className="sv-neon-viewer__sign-title">Chữ ký điện tử</h3>

          <div className="sv-neon-viewer__signature-area">
            <span style={{ fontSize: '1.5rem' }}>✍️</span>
            <span>Nhấn vào đây để vẽ chữ ký</span>
            <span style={{ fontSize: '0.75rem', color: '#475569' }}>
              (Tích hợp SignatureCanvas sẵn có trong hệ thống)
            </span>
          </div>

          <div className="sv-neon-viewer__sign-actions">
            <button
              className="sv-neon-viewer__sign-btn sv-neon-viewer__sign-btn--reject"
              onClick={handleReject}
            >
              ✗ Từ chối ký
            </button>
            <button
              className="sv-neon-viewer__sign-btn sv-neon-viewer__sign-btn--confirm"
              onClick={handleSign}
              disabled={isSigning}
            >
              {isSigning ? (
                <>
                  <span className="sv-neon-viewer__sign-btn-spinner" />
                  Đang xử lý...
                </>
              ) : (
                '✓ Xác nhận ký hợp đồng'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Signed state */}
      {viewerStatus === 'signed' && (
        <div style={{
          textAlign: 'center', padding: 20,
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 12, marginTop: 16, color: '#10b981',
        }}>
          🎉 Hợp đồng đã được ký thành công bởi cả hai bên!
        </div>
      )}
    </div>
  );
};

export default NeonContractViewer;
