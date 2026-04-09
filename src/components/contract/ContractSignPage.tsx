import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Eye, FileText, Loader2 } from 'lucide-react';
import { ContractResponse, ContractStatus, SignatureAction } from '../../types/contract';
import contractService from '../../services/contractService';
import { useToast } from '../../hooks/useToast';
import ContractClauses from './ContractClauses';
import ContractMarkdownSections from './ContractMarkdownSections';
import SignatureCanvas from './SignatureCanvas';
import './ContractSignPage.css';

type SignViewMode = 'markdown' | 'preview';
type SignLocationState = {
  returnTo?: string;
};

const ContractSignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [contract, setContract] = useState<ContractResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<SignViewMode>('markdown');
  const returnTo = (location.state as SignLocationState | null)?.returnTo;

  const navigateToDetail = (contractId?: number) => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    if (contractId) {
      navigate(`/contracts/${contractId}`);
      return;
    }
    navigate(-1);
  };

  useEffect(() => {
    if (!id) return;
    void loadContract(Number(id));
  }, [id]);

  const loadContract = async (contractId: number) => {
    setIsLoading(true);
    try {
      const data = await contractService.getContractById(contractId);
      setContract(data);
    } catch (error) {
      showError(
        'Lỗi tải dữ liệu',
        error instanceof Error ? error.message : 'Không thể tải hợp đồng.',
      );
      navigateToDetail(contractId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureConfirm = async (signatureUrl: string) => {
    if (!contract) return;
    setIsSubmitting(true);
    try {
      const updated = await contractService.signContract(contract.id, {
        action: SignatureAction.SIGN,
        signatureImageUrl: signatureUrl,
      });
      setContract(updated);
      showSuccess('Ký hợp đồng thành công', 'Hợp đồng đã được xác nhận chữ ký.');
      navigateToDetail(contract.id);
    } catch (error) {
      showError(
        'Lỗi ký hợp đồng',
        error instanceof Error ? error.message : 'Không thể ký hợp đồng.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  if (isLoading || !contract) {
    return (
      <div className="csp-loading">
        <Loader2 size={32} className="csp-spin" />
        <p>Đang tải hợp đồng...</p>
      </div>
    );
  }

  const isCandidateSigning = contract.status === ContractStatus.PENDING_SIGNER;

  return (
    <div className="csp-wrapper">
      <div className="csp-header">
        <button
          type="button"
          className="csp-back-btn"
          onClick={() => navigateToDetail(contract.id)}
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <div className="csp-header-info">
          <h2 className="csp-title">
            <FileText size={20} />
            Ký hợp đồng {contract.contractNumber}
          </h2>
          <p className="csp-subtitle">
            {isCandidateSigning
              ? 'Bạn đang ở bước ký của ứng viên. Hãy đọc kỹ nội dung trước khi xác nhận.'
              : 'Ứng viên đã ký trước. Đây là bước đối ký để hoàn tất hợp đồng.'}
          </p>
        </div>
      </div>

      <div className="csp-contract-summary">
        <div className="csp-summary-item">
          <span className="csp-summary-label">Loại</span>
          <span className="csp-summary-value">
            {contract.contractType === 'PROBATION'
              ? 'Thử việc'
              : contract.contractType === 'FULL_TIME'
              ? 'Toàn thời gian'
              : 'Thời vụ'}
          </span>
        </div>
        <div className="csp-summary-item">
          <span className="csp-summary-label">Lương</span>
          <span className="csp-summary-value csp-summary-salary">
            {formatCurrency(contract.salary)}
          </span>
        </div>
        <div className="csp-summary-item">
          <span className="csp-summary-label">Bắt đầu</span>
          <span className="csp-summary-value">{formatDate(contract.startDate)}</span>
        </div>
        <div className="csp-summary-item">
          <span className="csp-summary-label">Bên A</span>
          <span className="csp-summary-value">{contract.employerName}</span>
        </div>
        <div className="csp-summary-item">
          <span className="csp-summary-label">Bên B</span>
          <span className="csp-summary-value">{contract.candidateName}</span>
        </div>
      </div>

      <div className="csp-document-card">
        <div className="csp-view-tabs">
          <button
            type="button"
            className={`csp-view-tab ${viewMode === 'markdown' ? 'csp-view-tab--active' : ''}`}
            onClick={() => setViewMode('markdown')}
          >
            <Eye size={13} />
            Markdown
          </button>
          <button
            type="button"
            className={`csp-view-tab ${viewMode === 'preview' ? 'csp-view-tab--active' : ''}`}
            onClick={() => setViewMode('preview')}
          >
            <FileText size={13} />
            Xem trước pháp lý
          </button>
        </div>

        {viewMode === 'markdown' ? (
          <ContractMarkdownSections contract={contract} />
        ) : (
          <ContractClauses contractType={contract.contractType} contract={contract} />
        )}
      </div>

      <div className="csp-signature-section">
        <SignatureCanvas
          onConfirm={handleSignatureConfirm}
          onCancel={() => navigateToDetail(contract.id)}
        />
      </div>

      <div className="csp-disclaimer">
        <AlertTriangle size={14} />
        <p>
          Chữ ký điện tử dùng tại màn hình này được xem là xác nhận ý chí của bên ký đối với toàn
          bộ nội dung hợp đồng. Hãy kiểm tra kỹ phần markdown và phần xem trước pháp lý trước khi
          gửi chữ ký.
        </p>
      </div>
    </div>
  );
};

export default ContractSignPage;
