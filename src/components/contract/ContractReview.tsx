import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, X, Eye, FileText } from 'lucide-react';
import { Contract } from '../../types/contract';
import { useToast } from '../../hooks/useToast';
import ContractClauses from './ContractClauses';
import ContractMarkdownViewer from './ContractMarkdownViewer';
import './ContractReview.css';

interface ContractReviewProps {
  contract: Contract;
  onSigned: () => void;
  onRejected: () => void;
}

type ReviewTab = 'markdown' | 'preview';

const ContractReview: React.FC<ContractReviewProps> = ({ contract, onSigned, onRejected }) => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>('markdown');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

  const handleConfirmSign = () => {
    navigate(`/contracts/${contract.id}/sign`);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showError('Thiếu lý do', 'Vui lòng nhập lý do từ chối ký hợp đồng.');
      return;
    }
    setIsSubmitting(true);
    try {
      onRejected();
    } finally {
      setIsSubmitting(false);
      setShowRejectModal(false);
    }
  };

  return (
    <div className="cr-wrapper">
      <div className="cr-header">
        <h2>Xem xét Hợp đồng Lao động</h2>
        <p className="cr-subtitle">
          Vui lòng đọc kỹ các điều khoản trước khi ký. Hợp đồng số:{' '}
          <strong>{contract.contractNumber}</strong>
        </p>
      </div>

      {/* Contract summary */}
      <div className="cr-summary">
        <div className="cr-summary-row">
          <span className="cr-summary-label">Loại hợp đồng:</span>
          <span className="cr-summary-value">
            {contract.contractType === 'PROBATION' ? 'Hợp đồng thử việc' :
             contract.contractType === 'FULL_TIME' ? 'Hợp đồng lao động' : 'Hợp đồng thời vụ'}
          </span>
        </div>
        <div className="cr-summary-row">
          <span className="cr-summary-label">Mức lương:</span>
          <span className="cr-summary-value cr-salary">
            {formatCurrency(contract.salary)} ({contract.salaryText})
          </span>
        </div>
        <div className="cr-summary-row">
          <span className="cr-summary-label">Ngày bắt đầu:</span>
          <span className="cr-summary-value">{formatDate(contract.startDate)}</span>
        </div>
        {contract.endDate && (
          <div className="cr-summary-row">
            <span className="cr-summary-label">Ngày kết thúc:</span>
            <span className="cr-summary-value">{formatDate(contract.endDate)}</span>
          </div>
        )}
        {contract.probationMonths && (
          <div className="cr-summary-row">
            <span className="cr-summary-label">Thử việc:</span>
            <span className="cr-summary-value">{contract.probationMonths} tháng</span>
          </div>
        )}
        <div className="cr-summary-row">
          <span className="cr-summary-label">Nhà tuyển dụng:</span>
          <span className="cr-summary-value">{contract.employerName}</span>
        </div>
        <div className="cr-summary-row">
          <span className="cr-summary-label">Địa điểm:</span>
          <span className="cr-summary-value">{contract.workingLocation || '-'}</span>
        </div>
      </div>

      {/* Legal clauses */}
      <div className="cr-clauses">
        <h3 className="cr-clauses-title">Điều khoản pháp lý</h3>

        {/* Tab switcher */}
        <div className="cr-tab-switcher">
          <button
            type="button"
            className={`cr-tab-btn ${activeTab === 'markdown' ? 'cr-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('markdown')}
          >
            <Eye size={14} />
            Markdown
          </button>
          <button
            type="button"
            className={`cr-tab-btn ${activeTab === 'preview' ? 'cr-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <FileText size={14} />
            Xem trước
          </button>
        </div>

        {activeTab === 'markdown' ? (
          <div className="cr-markdown-view">
            {/* Job Description */}
            {contract.jobDescription && (
              <div className="cr-field-section">
                <h4 className="cr-field-title">Mô tả công việc</h4>
                <ContractMarkdownViewer content={contract.jobDescription} className="cr-markdown-field" />
              </div>
            )}

            {/* Probation fields */}
            {contract.contractType === 'PROBATION' && (
              <>
                {contract.probationObjectives && (
                  <div className="cr-field-section">
                    <h4 className="cr-field-title">Mục tiêu thử việc</h4>
                    <ContractMarkdownViewer content={contract.probationObjectives} className="cr-markdown-field" />
                  </div>
                )}
                {contract.probationEvaluationCriteria && (
                  <div className="cr-field-section">
                    <h4 className="cr-field-title">Tiêu chí đánh giá thử việc</h4>
                    <ContractMarkdownViewer content={contract.probationEvaluationCriteria} className="cr-markdown-field" />
                  </div>
                )}
              </>
            )}

            {/* Legal clauses */}
            <div className="cr-field-section cr-field-section--legal">
              <h4 className="cr-field-title">Điều khoản pháp lý (BLL 2019)</h4>
              <ContractClauses contractType={contract.contractType} contract={contract} compact />
            </div>

            {/* Other clauses */}
            {(contract.terminationClause || contract.confidentialityClause ||
              contract.ipClause || contract.legalText) && (
              <div className="cr-field-section">
                <h4 className="cr-field-title">Các điều khoản bổ sung</h4>
                {contract.confidentialityClause && (
                  <div className="cr-sub-field">
                    <span className="cr-sub-label">Bảo mật</span>
                    <ContractMarkdownViewer content={contract.confidentialityClause} className="cr-markdown-field" />
                  </div>
                )}
                {contract.ipClause && (
                  <div className="cr-sub-field">
                    <span className="cr-sub-label">Sở hữu trí tuệ</span>
                    <ContractMarkdownViewer content={contract.ipClause} className="cr-markdown-field" />
                  </div>
                )}
                {contract.terminationClause && (
                  <div className="cr-sub-field">
                    <span className="cr-sub-label">Chấm dứt HĐ</span>
                    <ContractMarkdownViewer content={contract.terminationClause} className="cr-markdown-field" />
                  </div>
                )}
                {contract.legalText && (
                  <div className="cr-sub-field">
                    <span className="cr-sub-label">Điều khoản khác</span>
                    <ContractMarkdownViewer content={contract.legalText} className="cr-markdown-field" />
                  </div>
                )}
              </div>
            )}

            {/* Benefits & policies */}
            {(contract.insurancePolicy || contract.trainingPolicy ||
              contract.otherBenefits || contract.leavePolicy) && (
              <div className="cr-field-section">
                <h4 className="cr-field-title">Phúc lợi & Chính sách</h4>
                {contract.insurancePolicy && (
                  <div className="cr-sub-field">
                    <span className="cr-sub-label">Bảo hiểm</span>
                    <ContractMarkdownViewer content={contract.insurancePolicy} className="cr-markdown-field" />
                  </div>
                )}
                {contract.trainingPolicy && (
                  <div className="cr-sub-field">
                    <span className="cr-sub-label">Đào tạo</span>
                    <ContractMarkdownViewer content={contract.trainingPolicy} className="cr-markdown-field" />
                  </div>
                )}
                {contract.leavePolicy && (
                  <div className="cr-sub-field">
                    <span className="cr-sub-label">Nghỉ phép</span>
                    <ContractMarkdownViewer content={contract.leavePolicy} className="cr-markdown-field" />
                  </div>
                )}
                {contract.otherBenefits && (
                  <div className="cr-sub-field">
                    <span className="cr-sub-label">Phúc lợi khác</span>
                    <ContractMarkdownViewer content={contract.otherBenefits} className="cr-markdown-field" />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Preview tab — renders contract field values as legal document */
          <div className="cr-legal-preview">
            <ContractClauses contractType={contract.contractType} contract={contract} />
          </div>
        )}
      </div>

      {/* Agreement checkbox */}
      <div className="cr-agreement">
        <label className="cr-agreement-label">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            Tôi đã đọc kỹ và đồng ý với toàn bộ các điều khoản trong hợp đồng này.
            Tôi hiểu rằng chữ ký điện tử này có giá trị pháp lý tương đương chữ ký tay
            theo quy định pháp luật Việt Nam.
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="cr-actions">
        <button
          type="button"
          className="cr-btn cr-btn--reject"
          onClick={() => setShowRejectModal(true)}
        >
          <X size={16} />
          Từ chối ký
        </button>
        <button
          type="button"
          className="cr-btn cr-btn--sign"
          onClick={handleConfirmSign}
          disabled={!agreed}
        >
          <Check size={16} />
          Ký hợp đồng
        </button>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="cr-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="cr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Từ chối ký hợp đồng</h3>
            <p>Vui lòng nhập lý do từ chối. Nhà tuyển dụng sẽ nhận được thông báo.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Mức lương chưa phù hợp, điều khoản cần điều chỉnh..."
              rows={4}
              className="cr-modal-textarea"
            />
            <div className="cr-modal-actions">
              <button
                type="button"
                className="cr-btn cr-btn--cancel"
                onClick={() => setShowRejectModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="cr-btn cr-btn--confirm-reject"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 size={15} className="cr-spin" /> : null}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractReview;
