import React from 'react';
import { Contract, ContractType } from '../../types/contract';
import ContractMarkdownViewer from './ContractMarkdownViewer';
import './ContractMarkdownSections.css';

interface ContractMarkdownSectionsProps {
  contract: Pick<
    Contract,
    | 'contractType'
    | 'jobDescription'
    | 'probationObjectives'
    | 'probationEvaluationCriteria'
    | 'terminationClause'
    | 'confidentialityClause'
    | 'ipClause'
    | 'legalText'
    | 'insurancePolicy'
    | 'trainingPolicy'
    | 'leavePolicy'
    | 'otherBenefits'
    | 'bonusPolicy'
    | 'remoteWorkPolicy'
  >;
  emptyText?: string;
}

const ContractMarkdownSections: React.FC<ContractMarkdownSectionsProps> = ({
  contract,
  emptyText = 'Chưa có nội dung markdown cho hợp đồng này.',
}) => {
  const supplementaryClauses = [
    { label: 'Bảo mật', content: contract.confidentialityClause },
    { label: 'Sở hữu trí tuệ', content: contract.ipClause },
    { label: 'Chấm dứt hợp đồng', content: contract.terminationClause },
    { label: 'Điều khoản khác', content: contract.legalText },
  ].filter((item) => Boolean(item.content));

  const policySections = [
    { label: 'Bảo hiểm', content: contract.insurancePolicy },
    { label: 'Đào tạo', content: contract.trainingPolicy },
    { label: 'Nghỉ phép', content: contract.leavePolicy },
    { label: 'Phúc lợi khác', content: contract.otherBenefits },
  ].filter((item) => Boolean(item.content));

  const hasContent = Boolean(
    contract.jobDescription ||
      contract.probationObjectives ||
      contract.probationEvaluationCriteria ||
      supplementaryClauses.length ||
      policySections.length ||
      contract.bonusPolicy ||
      contract.remoteWorkPolicy,
  );

  if (!hasContent) {
    return <p className="cms-empty">{emptyText}</p>;
  }

  return (
    <div className="cms-wrapper">
      {contract.jobDescription && (
        <section className="cms-section">
          <h4 className="cms-title">Mô tả công việc</h4>
          <ContractMarkdownViewer content={contract.jobDescription} />
        </section>
      )}

      {contract.contractType === ContractType.PROBATION && contract.probationObjectives && (
        <section className="cms-section">
          <h4 className="cms-title">Mục tiêu thử việc</h4>
          <ContractMarkdownViewer content={contract.probationObjectives} />
        </section>
      )}

      {contract.contractType === ContractType.PROBATION &&
        contract.probationEvaluationCriteria && (
          <section className="cms-section">
            <h4 className="cms-title">Tiêu chí đánh giá thử việc</h4>
            <ContractMarkdownViewer content={contract.probationEvaluationCriteria} />
          </section>
        )}

      {supplementaryClauses.length > 0 && (
        <section className="cms-section">
          <h4 className="cms-title">Điều khoản bổ sung</h4>
          <div className="cms-subsection-list">
            {supplementaryClauses.map((item) => (
              <div key={item.label} className="cms-subsection">
                <span className="cms-subtitle">{item.label}</span>
                <ContractMarkdownViewer content={item.content} />
              </div>
            ))}
          </div>
        </section>
      )}

      {policySections.length > 0 && (
        <section className="cms-section">
          <h4 className="cms-title">Phúc lợi và chính sách</h4>
          <div className="cms-subsection-list">
            {policySections.map((item) => (
              <div key={item.label} className="cms-subsection">
                <span className="cms-subtitle">{item.label}</span>
                <ContractMarkdownViewer content={item.content} />
              </div>
            ))}
          </div>
        </section>
      )}

      {contract.bonusPolicy && (
        <section className="cms-section">
          <h4 className="cms-title">Chính sách thưởng</h4>
          <ContractMarkdownViewer content={contract.bonusPolicy} />
        </section>
      )}

      {contract.remoteWorkPolicy && (
        <section className="cms-section">
          <h4 className="cms-title">Chính sách làm việc từ xa</h4>
          <ContractMarkdownViewer content={contract.remoteWorkPolicy} />
        </section>
      )}
    </div>
  );
};

export default ContractMarkdownSections;
