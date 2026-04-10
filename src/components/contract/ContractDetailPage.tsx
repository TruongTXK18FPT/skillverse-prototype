import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Send,
  XCircle,
} from 'lucide-react';
import {
  CONTRACT_STATUS_DISPLAY,
  CONTRACT_TYPE_DISPLAY,
  ContractResponse,
  ContractStatus,
} from '../../types/contract';
import contractService from '../../services/contractService';
import { useToast } from '../../hooks/useToast';
import ContractClauses from './ContractClauses';
import ContractMarkdownSections from './ContractMarkdownSections';
import ContractPDFViewer from './ContractPDFViewer';
import { downloadContractPDF } from './ContractHTMLGenerator';
import './ContractDetailPage.css';

type ViewMode = 'detail' | 'markdown' | 'pdf';
type ContractPartyRole = 'EMPLOYER' | 'CANDIDATE';

const WORKFLOW_STEPS = [
  { status: ContractStatus.DRAFT, label: 'Soạn thảo' },
  { status: ContractStatus.PENDING_SIGNER, label: 'Chờ ứng viên ký' },
  { status: ContractStatus.PENDING_EMPLOYER, label: 'Chờ nhà tuyển dụng ký' },
  { status: ContractStatus.SIGNED, label: 'Đã ký' },
];

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToast();

  const [contract, setContract] = useState<ContractResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  const currentUserRole: ContractPartyRole = location.pathname.startsWith('/business')
    ? 'EMPLOYER'
    : 'CANDIDATE';

  useEffect(() => {
    if (!id) return;
    void loadContract(Number(id));
  }, [id]);

  const loadContract = async (contractId: number) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await contractService.getContractById(contractId);
      setContract(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể tải thông tin hợp đồng.';
      setLoadError(msg);
      showError('Lỗi tải dữ liệu', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendForSignature = async () => {
    if (!contract) return;
    setIsSending(true);
    try {
      const updated = await contractService.sendForSignature(contract.id);
      setContract(updated);
      showSuccess('Đã gửi hợp đồng', 'Hợp đồng đã được gửi sang bước ký xác nhận.');
    } catch (error) {
      showError('Lỗi', error instanceof Error ? error.message : 'Không thể gửi hợp đồng.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!contract) return;
    try {
      await downloadContractPDF(contract);
      showSuccess('Tải PDF', 'Đã tạo và tải file PDF hợp đồng.');
    } catch (error) {
      showError('Lỗi PDF', error instanceof Error ? error.message : 'Không thể tạo PDF hợp đồng.');
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount?: number | null) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount ?? 0);

  if (isLoading) {
    return (
      <div className="cdp-loading">
        <Loader2 size={32} className="cdp-spin" />
        <p>Đang tải thông tin hợp đồng...</p>
      </div>
    );
  }

  if (loadError || !contract) {
    return (
      <div className="cdp-wrapper">
        <div className="cdp-header">
          <button type="button" className="cdp-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
        <div className="cdp-error">
          <AlertCircle size={40} className="cdp-error__icon" />
          <h3>Không thể tải hợp đồng</h3>
          <p>{loadError || 'Hợp đồng không tồn tại hoặc bạn không có quyền xem.'}</p>
          <button
            type="button"
            className="cdp-error__btn"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = CONTRACT_STATUS_DISPLAY[contract.status];
  const typeInfo = CONTRACT_TYPE_DISPLAY[contract.contractType];

  const canSendForSignature =
    currentUserRole === 'EMPLOYER' && contract.status === ContractStatus.DRAFT;
  const canEdit = currentUserRole === 'EMPLOYER' && contract.status === ContractStatus.DRAFT;
  const canSign =
    (currentUserRole === 'CANDIDATE' &&
      contract.status === ContractStatus.PENDING_SIGNER) ||
    (currentUserRole === 'EMPLOYER' &&
      contract.status === ContractStatus.PENDING_EMPLOYER);
  const signReturnPath =
    currentUserRole === 'EMPLOYER'
      ? `/business/contracts/${contract.id}`
      : `/contracts/${contract.id}`;

  const getStepState = (stepStatus: ContractStatus) => {
    if (contract.status === ContractStatus.REJECTED || contract.status === ContractStatus.CANCELLED) {
      return 'pending';
    }

    const currentIndex = WORKFLOW_STEPS.findIndex((step) => step.status === contract.status);
    const stepIndex = WORKFLOW_STEPS.findIndex((step) => step.status === stepStatus);

    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const rejectedLabel =
    contract.status === ContractStatus.REJECTED ? 'Bị từ chối' : 'Đã hủy';

  const signatureCards = [
    {
      key: 'employer',
      title: 'Nhà tuyển dụng (Bên A)',
      partyName: contract.employerName,
      signatureUrl: contract.employerSignatureUrl,
      signedAt: contract.employerSignedAt,
    },
    {
      key: 'candidate',
      title: 'Ứng viên (Bên B)',
      partyName: contract.candidateName,
      signatureUrl: contract.candidateSignatureUrl,
      signedAt: contract.candidateSignedAt,
    },
  ];

  return (
    <div className="cdp-wrapper">
      <div className="cdp-header">
        <button type="button" className="cdp-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <div className="cdp-header-info">
          <div className="cdp-header-title-row">
            <h2 className="cdp-title">{contract.contractNumber}</h2>
            <span
              className={`cdp-status-badge cdp-status-badge--${statusInfo.color.replace(
                'text-',
                '',
              )}`}
            >
              {statusInfo.text}
            </span>
          </div>
          <p className="cdp-header-meta">
            Tạo ngày {formatDate(contract.createdAt)}
            {contract.signedAt ? ` · Hoàn tất ngày ${formatDate(contract.signedAt)}` : ''}
          </p>
        </div>
      </div>

      <div className="cdp-workflow">
        {WORKFLOW_STEPS.map((step, index) => {
          const state = getStepState(step.status);
          return (
            <React.Fragment key={step.status}>
              <div className={`cdp-workflow-step cdp-workflow-step--${state}`}>
                <div className="cdp-workflow-circle">
                  {state === 'done' ? <CheckCircle2 size={16} /> : index + 1}
                </div>
                <span className="cdp-workflow-label">{step.label}</span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`cdp-workflow-connector cdp-workflow-connector--${state}`} />
              )}
            </React.Fragment>
          );
        })}
        {(contract.status === ContractStatus.REJECTED ||
          contract.status === ContractStatus.CANCELLED) && (
          <>
            <div className="cdp-workflow-connector cdp-workflow-connector--pending" />
            <div className="cdp-workflow-step cdp-workflow-step--rejected">
              <div className="cdp-workflow-circle">
                <XCircle size={16} />
              </div>
              <span className="cdp-workflow-label">{rejectedLabel}</span>
            </div>
          </>
        )}
      </div>

      <div className="cdp-overview-grid">
        <div className="cdp-main">
          <div className="cdp-info-card">
            <div className="cdp-info-card-header">
              <FileText size={16} />
              <h3>Thông tin hợp đồng</h3>
            </div>
            <div className="cdp-info-grid">
              <div className="cdp-info-item">
                <span className="cdp-info-label">Loại hợp đồng</span>
                <span className="cdp-info-value">{typeInfo.text}</span>
                <span className="cdp-info-sub">{typeInfo.description}</span>
              </div>
              <div className="cdp-info-item">
                <span className="cdp-info-label">Lương/tháng</span>
                <span className="cdp-info-value cdp-info-value--salary">
                  {formatCurrency(contract.salary)}
                </span>
                <span className="cdp-info-sub">{contract.salaryText}</span>
              </div>
              <div className="cdp-info-item">
                <span className="cdp-info-label">Ngày bắt đầu</span>
                <span className="cdp-info-value">{formatDate(contract.startDate)}</span>
              </div>
              <div className="cdp-info-item">
                <span className="cdp-info-label">Ngày kết thúc</span>
                <span className="cdp-info-value">{formatDate(contract.endDate)}</span>
              </div>
              <div className="cdp-info-item">
                <span className="cdp-info-label">Vị trí / chức danh</span>
                <span className="cdp-info-value">{contract.candidatePosition || '-'}</span>
              </div>
              <div className="cdp-info-item">
                <span className="cdp-info-label">Địa điểm làm việc</span>
                <span className="cdp-info-value">{contract.workingLocation || '-'}</span>
              </div>
              <div className="cdp-info-item">
                <span className="cdp-info-label">Trạng thái ký</span>
                <span className="cdp-info-value">{statusInfo.text}</span>
                <span className="cdp-info-sub">{statusInfo.description}</span>
              </div>
              <div className="cdp-info-item">
                <span className="cdp-info-label">Người lao động</span>
                <span className="cdp-info-value">{contract.candidateName}</span>
                <span className="cdp-info-sub">{contract.candidateEmail}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cdp-sidebar">
          <div className="cdp-party-card">
            <div className="cdp-party-section">
              <h4>Nhà tuyển dụng</h4>
              <p className="cdp-party-name">{contract.employerName}</p>
              <p className="cdp-party-company">{contract.employerCompanyName || '-'}</p>
              <p className="cdp-party-company">{contract.employerCompanyAddress || '-'}</p>
              <p className="cdp-party-email">{contract.employerEmail}</p>
            </div>
            <div className="cdp-party-divider" />
            <div className="cdp-party-section">
              <h4>Ứng viên</h4>
              <p className="cdp-party-name">{contract.candidateName}</p>
              <p className="cdp-party-company">{contract.candidatePosition || '-'}</p>
              <p className="cdp-party-email">{contract.candidateEmail}</p>
            </div>
          </div>

          <div className="cdp-actions">
            {canSendForSignature && (
              <button
                type="button"
                className="cdp-action-btn cdp-action-btn--primary"
                onClick={handleSendForSignature}
                disabled={isSending}
              >
                {isSending ? <Loader2 size={16} className="cdp-spin" /> : <Send size={16} />}
                Gửi ký hợp đồng
              </button>
            )}

            {canSign && (
              <button
                type="button"
                className="cdp-action-btn cdp-action-btn--primary"
                onClick={() =>
                  navigate(`/contracts/${contract.id}/sign`, {
                    state: { returnTo: signReturnPath },
                  })
                }
              >
                <FileText size={16} />
                Xem và ký hợp đồng
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                className="cdp-action-btn"
                onClick={() => navigate(`/business/contracts/${contract.id}/edit`)}
              >
                <Edit3 size={16} />
                Chỉnh sửa bản nháp
              </button>
            )}

            <button
              type="button"
              className="cdp-action-btn"
              onClick={() => setViewMode('pdf')}
            >
              <Eye size={16} />
              Mở bản PDF
            </button>

            <button
              type="button"
              className="cdp-action-btn"
              onClick={handleDownloadPdf}
            >
              <Download size={16} />
              Tải PDF
            </button>
          </div>
        </div>
      </div>

      <section className={`cdp-viewer-shell cdp-viewer-shell--${viewMode}`}>
        <div className="cdp-view-tabs">
          <button
            type="button"
            className={`cdp-view-tab ${viewMode === 'detail' ? 'cdp-view-tab--active' : ''}`}
            onClick={() => setViewMode('detail')}
          >
            <FileText size={13} />
            Chi tiết
          </button>
          <button
            type="button"
            className={`cdp-view-tab ${viewMode === 'markdown' ? 'cdp-view-tab--active' : ''}`}
            onClick={() => setViewMode('markdown')}
          >
            <Eye size={13} />
            Markdown
          </button>
          <button
            type="button"
            className={`cdp-view-tab ${viewMode === 'pdf' ? 'cdp-view-tab--active' : ''}`}
            onClick={() => setViewMode('pdf')}
          >
            <FileText size={13} />
            PDF
          </button>
        </div>

        {viewMode === 'detail' && (
          <>
            <div className="cdp-clauses-section">
              <h3 className="cdp-section-title">
                <FileText size={16} />
                Điều khoản pháp lý
              </h3>
              <ContractClauses
                contractType={contract.contractType}
                contract={contract}
                compact
              />
            </div>

            <div className="cdp-signature-section">
              <h3 className="cdp-section-title">
                <CheckCircle2 size={16} />
                Tình trạng chữ ký
              </h3>
              <div className="cdp-signature-grid">
                {signatureCards.map((item) => (
                  <div key={item.key} className="cdp-signature-party">
                    <h4>{item.title}</h4>
                    {item.signatureUrl ? (
                      <div className="cdp-signed">
                        <CheckCircle2 size={16} className="cdp-signed-icon" />
                        <div>
                          <p className="cdp-signed-name">{item.partyName}</p>
                          <p className="cdp-signed-date">
                            Đã ký ngày {formatDate(item.signedAt)}
                          </p>
                          <img
                            src={item.signatureUrl}
                            alt={`Chữ ký ${item.partyName}`}
                            className="cdp-signature-img"
                            crossOrigin="anonymous"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="cdp-not-signed">
                        <Clock size={16} />
                        <p>Chưa ký</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {viewMode === 'markdown' && (
          <div className="cdp-clauses-section">
            <h3 className="cdp-section-title">
              <Eye size={16} />
              Nội dung markdown
            </h3>
            <ContractMarkdownSections contract={contract} />
          </div>
        )}

        {viewMode === 'pdf' && (
          <div className="cdp-pdf-section">
            <ContractPDFViewer contract={contract} />
          </div>
        )}
      </section>
    </div>
  );
};

export default ContractDetailPage;
