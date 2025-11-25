import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronDown } from 'lucide-react';
import careerChatService from '../services/careerChatService';
import { ExpertFieldResponse, RoleInfo } from '../types/CareerChat';
import '../styles/ExpertModeSelectorTech.css';

interface ExpertModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (domain: string, industry: string, jobRole: string, mediaUrl?: string) => void;
}

const ExpertModeSelector: React.FC<ExpertModeSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [expertFields, setExpertFields] = useState<ExpertFieldResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<RoleInfo | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadExpertFields();
    }
  }, [isOpen]);

  const loadExpertFields = async () => {
    try {
      setLoading(true);
      const fields = await careerChatService.getExpertFields();
      setExpertFields(fields);
    } catch (error) {
      console.error('Failed to load expert fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainClick = (domain: string) => {
    if (expandedDomain === domain) {
      setExpandedDomain('');
    } else {
      setExpandedDomain(domain);
      setSelectedDomain(domain);
      setSelectedIndustry('');
      setSelectedRole(null);
    }
  };

  const handleIndustryClick = (industry: string) => {
    setSelectedIndustry(industry);
    setSelectedRole(null);
  };

  const handleRoleClick = (role: RoleInfo) => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    if (selectedDomain && selectedIndustry && selectedRole) {
      onSelect(selectedDomain, selectedIndustry, selectedRole.jobRole, selectedRole.mediaUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="expert-selector-overlay" onClick={onClose}>
      <div className="expert-selector-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="expert-selector-header">
          <div className="expert-selector-title">
            <Sparkles size={24} />
            <span>Chọn Chuyên Gia</span>
          </div>
          <button className="expert-selector-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="expert-selector-content">
          {loading ? (
            <div className="expert-selector-loading">
              <div className="spinner"></div>
              <p>Đang tải danh sách chuyên gia...</p>
            </div>
          ) : (
            <div className="expert-selector-grid">
              {/* Left: Domains & Industries */}
              <div className="expert-selector-domains">
                <h3>Lĩnh vực & Ngành nghề</h3>
                {expertFields.map((field) => (
                  <div key={field.domain} className="expert-domain">
                    <button
                      className={`expert-domain-header ${expandedDomain === field.domain ? 'expanded' : ''}`}
                      onClick={() => handleDomainClick(field.domain)}
                    >
                      <span className="expert-domain-name">{field.domain}</span>
                      <ChevronDown
                        size={18}
                        className={`expert-domain-icon ${expandedDomain === field.domain ? 'expanded' : ''}`}
                      />
                    </button>

                    {expandedDomain === field.domain && (
                      <div className="expert-industries">
                        {field.industries.map((industry) => (
                          <button
                            key={industry.industry}
                            className={`expert-industry ${selectedIndustry === industry.industry ? 'selected' : ''}`}
                            onClick={() => handleIndustryClick(industry.industry)}
                          >
                            <div className="expert-industry-name">{industry.industry}</div>
                            <span className="expert-industry-count" style={{ fontSize: '12px', color: 'rgba(103, 232, 249, 0.5)' }}>
                              {industry.roles.length} vai trò
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right: Roles */}
              <div className="expert-selector-roles">
                <h3>Vai trò chuyên môn</h3>
                {selectedIndustry ? (
                  <div className="expert-roles">
                    {expertFields
                      .find((f) => f.domain === selectedDomain)
                      ?.industries.find((i) => i.industry === selectedIndustry)
                      ?.roles.map((role) => (
                        <button
                          key={role.jobRole}
                          className={`expert-role-card ${selectedRole?.jobRole === role.jobRole ? 'selected' : ''}`}
                          onClick={() => handleRoleClick(role)}
                        >
                          {role.mediaUrl && (
                            <div className="expert-role-icon">
                              <img src={role.mediaUrl} alt={role.jobRole} />
                            </div>
                          )}
                          <div className="expert-role-name">{role.jobRole}</div>
                          {role.keywords && (
                            <div className="expert-role-keywords">{role.keywords}</div>
                          )}
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="expert-selector-empty">
                    <p>Vui lòng chọn ngành nghề để xem các vai trò</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="expert-selector-footer">
          <button className="expert-selector-btn cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className="expert-selector-btn confirm"
            onClick={handleConfirm}
            disabled={!selectedRole}
          >
            <Sparkles size={18} />
            Bắt đầu với {selectedRole?.jobRole || 'Chuyên gia'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpertModeSelector;
