import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Brain, Search, Plus, Edit3, Trash2, Eye, RefreshCw,
  Layers, Briefcase, Code, Users, Sparkles, ChevronDown, ChevronRight,
  Globe, Building2, UserCog, FileText, Image, Zap, Upload, X
} from 'lucide-react';
import {
  getAllExpertPrompts,
  createExpertPrompt,
  updateExpertPrompt,
  deleteExpertPrompt,
  uploadExpertMedia,
  ExpertPromptConfig,
  ExpertPromptRequest
} from '../../services/expertPromptService';
import { useToast } from '../../hooks/useToast';
import './AIExpertManagementTab.css';

// ==================== HELPER ====================
const checkIsActive = (config: ExpertPromptConfig): boolean => {
  return config.isActive === true || config.active === true;
};

// ==================== COMPONENT ====================
const AIExpertManagementTab: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();

  // Data
  const [configs, setConfigs] = useState<ExpertPromptConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Expand state
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set());

  // Modal states
  type ModalType = 'domain' | 'industry' | 'jobRole' | 'edit' | 'view' | 'delete' | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedConfig, setSelectedConfig] = useState<ExpertPromptConfig | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Domain configs (domain -> domainRules)
  const [domainRulesMap, setDomainRulesMap] = useState<Map<string, string>>(new Map());
  
  // Form states
  const [domainForm, setDomainForm] = useState({ name: '', rules: '' });
  const [industryForm, setIndustryForm] = useState({ domain: '', name: '' });
  const [jobRoleForm, setJobRoleForm] = useState({
    domain: '', industry: '', jobRole: '', keywords: '',
    rolePrompt: '', systemPrompt: '', mediaUrl: '', isActive: true
  });
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== LOAD DATA ====================
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllExpertPrompts();
      setConfigs(data || []);
      
      // Extract domain rules from configs
      const rulesMap = new Map<string, string>();
      (data || []).forEach((c: ExpertPromptConfig) => {
        if (c.domain && c.domainRules && !rulesMap.has(c.domain)) {
          rulesMap.set(c.domain, c.domainRules);
        }
      });
      setDomainRulesMap(rulesMap);
      
      // Auto expand domains
      if (data && data.length > 0) {
        const domains = new Set(data.map((c: ExpertPromptConfig) => c.domain).filter(Boolean));
        setExpandedDomains(domains as Set<string>);
      }
    } catch (error) {
      showError('Lỗi', 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  // ==================== COMPUTED ====================
  const filteredConfigs = useMemo(() => {
    return configs.filter(config => {
      const matchSearch = !searchTerm || 
        config.jobRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.industry?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && checkIsActive(config)) ||
        (statusFilter === 'inactive' && !checkIsActive(config));
      return matchSearch && matchStatus;
    });
  }, [configs, searchTerm, statusFilter]);

  // Group by Domain -> Industry
  const groupedData = useMemo(() => {
    const result: Record<string, Record<string, ExpertPromptConfig[]>> = {};
    filteredConfigs.forEach(config => {
      const domain = config.domain || 'Uncategorized';
      const industry = config.industry || 'General';
      if (!result[domain]) result[domain] = {};
      if (!result[domain][industry]) result[domain][industry] = [];
      result[domain][industry].push(config);
    });
    return result;
  }, [filteredConfigs]);

  const sortedDomains = useMemo(() => Object.keys(groupedData).sort(), [groupedData]);
  
  const uniqueDomains = useMemo(() => 
    [...new Set(configs.map(c => c.domain))].filter(Boolean).sort() as string[]
  , [configs]);
  
  const getIndustriesForDomain = useCallback((domain: string) => {
    return [...new Set(configs.filter(c => c.domain === domain).map(c => c.industry))].filter(Boolean).sort() as string[];
  }, [configs]);

  const stats = useMemo(() => ({
    total: configs.length,
    active: configs.filter(c => checkIsActive(c)).length,
    domains: uniqueDomains.length,
    industries: [...new Set(configs.map(c => c.industry))].filter(Boolean).length
  }), [configs, uniqueDomains]);

  // ==================== HANDLERS ====================
  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      next.has(domain) ? next.delete(domain) : next.add(domain);
      return next;
    });
  };

  const toggleIndustry = (key: string) => {
    setExpandedIndustries(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedConfig(null);
    setDomainForm({ name: '', rules: '' });
    setIndustryForm({ domain: '', name: '' });
    setJobRoleForm({
      domain: '', industry: '', jobRole: '', keywords: '',
      rolePrompt: '', systemPrompt: '', mediaUrl: '', isActive: true
    });
  };

  // Create Domain (saves as a config with placeholder jobRole)
  const handleCreateDomain = async () => {
    if (!domainForm.name) {
      showWarning('Cảnh báo', 'Vui lòng nhập tên Domain');
      return;
    }
    // Store domain rules in local map
    setDomainRulesMap(prev => new Map(prev).set(domainForm.name, domainForm.rules));
    showSuccess('Thành công', `Domain "${domainForm.name}" đã được tạo`);
    closeModal();
  };

  // Create Industry (just saves to UI, real save happens with JobRole)
  const handleCreateIndustry = async () => {
    if (!industryForm.domain || !industryForm.name) {
      showWarning('Cảnh báo', 'Vui lòng chọn Domain và nhập tên Industry');
      return;
    }
    showSuccess('Thành công', `Industry "${industryForm.name}" đã được thêm vào ${industryForm.domain}`);
    closeModal();
  };

  // Create Job Role (real save to backend)
  const handleCreateJobRole = async () => {
    if (!jobRoleForm.domain || !jobRoleForm.industry || !jobRoleForm.jobRole) {
      showWarning('Cảnh báo', 'Vui lòng điền Domain, Industry và Job Role');
      return;
    }
    if (!jobRoleForm.rolePrompt && !jobRoleForm.systemPrompt) {
      showWarning('Cảnh báo', 'Vui lòng nhập Role Prompt hoặc System Prompt');
      return;
    }

    try {
      setFormLoading(true);
      const domainRules = domainRulesMap.get(jobRoleForm.domain) || '';
      
      const request: ExpertPromptRequest = {
        domain: jobRoleForm.domain,
        industry: jobRoleForm.industry,
        jobRole: jobRoleForm.jobRole,
        keywords: jobRoleForm.keywords || undefined,
        domainRules: domainRules || undefined,
        rolePrompt: jobRoleForm.rolePrompt || undefined,
        systemPrompt: jobRoleForm.systemPrompt || undefined,
        mediaUrl: jobRoleForm.mediaUrl || undefined,
        isActive: jobRoleForm.isActive
      };
      await createExpertPrompt(request);
      showSuccess('Thành công', 'Đã tạo Expert Config');
      closeModal();
      loadConfigs();
    } catch (error: any) {
      showError('Lỗi', error.response?.data?.message || 'Không thể tạo');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit existing config
  const handleUpdate = async () => {
    if (!selectedConfig) return;
    
    try {
      setFormLoading(true);
      const request: ExpertPromptRequest = {
        domain: jobRoleForm.domain,
        industry: jobRoleForm.industry,
        jobRole: jobRoleForm.jobRole,
        keywords: jobRoleForm.keywords || undefined,
        domainRules: domainRulesMap.get(jobRoleForm.domain) || undefined,
        rolePrompt: jobRoleForm.rolePrompt || undefined,
        systemPrompt: jobRoleForm.systemPrompt || undefined,
        mediaUrl: jobRoleForm.mediaUrl || undefined,
        isActive: jobRoleForm.isActive
      };
      await updateExpertPrompt(selectedConfig.id, request);
      showSuccess('Thành công', 'Đã cập nhật');
      closeModal();
      loadConfigs();
    } catch (error: any) {
      showError('Lỗi', error.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedConfig) return;
    try {
      setFormLoading(true);
      await deleteExpertPrompt(selectedConfig.id);
      showSuccess('Thành công', 'Đã xóa');
      closeModal();
      loadConfigs();
    } catch (error: any) {
      showError('Lỗi', 'Không thể xóa');
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedConfig) return;
    try {
      setFormLoading(true);
      const result = await uploadExpertMedia(selectedConfig.id, file);
      setJobRoleForm(p => ({ ...p, mediaUrl: result.mediaUrl }));
      showSuccess('Thành công', 'Đã upload hình');
      loadConfigs();
    } catch (error: any) {
      showError('Lỗi', 'Không thể upload');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (config: ExpertPromptConfig) => {
    setSelectedConfig(config);
    setJobRoleForm({
      domain: config.domain || '',
      industry: config.industry || '',
      jobRole: config.jobRole || '',
      keywords: config.keywords || '',
      rolePrompt: config.rolePrompt || '',
      systemPrompt: config.systemPrompt || '',
      mediaUrl: config.mediaUrl || '',
      isActive: checkIsActive(config)
    });
    setActiveModal('edit');
  };

  const getDomainIcon = (domain: string) => {
    const d = (domain || '').toLowerCase();
    if (d.includes('it') || d.includes('technology')) return <Code size={18} />;
    if (d.includes('business') || d.includes('marketing')) return <Briefcase size={18} />;
    if (d.includes('design')) return <Sparkles size={18} />;
    if (d.includes('healthcare')) return <Users size={18} />;
    return <Globe size={18} />;
  };

  // ==================== RENDER ====================
  return (
    <div className="expert-config-page">
      {/* Header */}
      <div className="expert-config-header">
        <h2><Brain size={28} /> AI Expert Configuration</h2>
        <div className="expert-config-actions">
          <button className="expert-btn secondary" onClick={loadConfigs}>
            <RefreshCw size={18} />
          </button>
          <button className="expert-btn primary" onClick={() => setActiveModal('domain')}>
            <Plus size={18} /> Domain
          </button>
          <button className="expert-btn primary" onClick={() => setActiveModal('industry')}>
            <Plus size={18} /> Industry
          </button>
          <button className="expert-btn success" onClick={() => setActiveModal('jobRole')}>
            <Plus size={18} /> Job Role
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="expert-config-stats">
        <div className="expert-stat-card">
          <div className="expert-stat-icon"><Brain size={22} /></div>
          <div><div className="expert-stat-value">{stats.total}</div><div className="expert-stat-label">Experts</div></div>
        </div>
        <div className="expert-stat-card">
          <div className="expert-stat-icon"><Zap size={22} /></div>
          <div><div className="expert-stat-value">{stats.active}</div><div className="expert-stat-label">Active</div></div>
        </div>
        <div className="expert-stat-card">
          <div className="expert-stat-icon"><Layers size={22} /></div>
          <div><div className="expert-stat-value">{stats.domains}</div><div className="expert-stat-label">Domains</div></div>
        </div>
        <div className="expert-stat-card">
          <div className="expert-stat-icon"><Building2 size={22} /></div>
          <div><div className="expert-stat-value">{stats.industries}</div><div className="expert-stat-label">Industries</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="expert-config-filters">
        <div className="expert-search-box">
          <Search size={20} />
          <input placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="expert-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="all">Tất cả</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="expert-loading-state"><div className="expert-loading-spinner" /><p>Đang tải...</p></div>
      ) : sortedDomains.length === 0 ? (
        <div className="expert-empty-state">
          <Brain size={64} />
          <h3>Chưa có Expert Config</h3>
          <p>Tạo Domain → Industry → Job Role để bắt đầu</p>
        </div>
      ) : (
        <div className="expert-grouped-list">
          {sortedDomains.map(domain => {
            const isDomainExpanded = expandedDomains.has(domain);
            const industries = Object.keys(groupedData[domain]).sort();
            const totalInDomain = industries.reduce((sum, ind) => sum + groupedData[domain][ind].length, 0);

            return (
              <div key={domain} className="expert-domain-group">
                <div className="expert-domain-header" onClick={() => toggleDomain(domain)}>
                  <div className="expert-domain-title">
                    {isDomainExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    {getDomainIcon(domain)}
                    <span>{domain}</span>
                    <span className="expert-count-badge">{totalInDomain}</span>
                  </div>
                </div>

                {isDomainExpanded && (
                  <div className="expert-industries-container">
                    {industries.map(industry => {
                      const key = `${domain}-${industry}`;
                      const isExpanded = expandedIndustries.has(key);
                      const experts = groupedData[domain][industry];

                      return (
                        <div key={key} className="expert-industry-group">
                          <div className="expert-industry-header" onClick={() => toggleIndustry(key)}>
                            <div className="expert-industry-title">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <Building2 size={16} />
                              <span>{industry}</span>
                              <span className="expert-count-badge small">{experts.length}</span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="expert-roles-list">
                              {experts.map(config => (
                                <div key={config.id} className={`expert-role-item ${!checkIsActive(config) ? 'inactive' : ''}`}>
                                  <div className="expert-role-avatar">
                                    {config.mediaUrl ? <img src={config.mediaUrl} alt="" /> : <UserCog size={18} />}
                                  </div>
                                  <div className="expert-role-info">
                                    <div className="expert-role-name">{config.jobRole}</div>
                                    {config.keywords && (
                                      <div className="expert-role-keywords">
                                        {config.keywords.split(',').slice(0, 3).map((kw, i) => (
                                          <span key={i} className="expert-keyword-tag">{kw.trim()}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <span className={`expert-status-badge ${checkIsActive(config) ? 'active' : 'inactive'}`}>
                                    {checkIsActive(config) ? 'ON' : 'OFF'}
                                  </span>
                                  <div className="expert-role-actions">
                                    <button onClick={e => { e.stopPropagation(); setSelectedConfig(config); setActiveModal('view'); }}><Eye size={14} /></button>
                                    <button onClick={e => { e.stopPropagation(); openEditModal(config); }}><Edit3 size={14} /></button>
                                    <button onClick={e => { e.stopPropagation(); setSelectedConfig(config); setActiveModal('delete'); }}><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DOMAIN MODAL */}
      {activeModal === 'domain' && (
        <div className="expert-modal-overlay" onClick={closeModal}>
          <div className="expert-modal" onClick={e => e.stopPropagation()}>
            <div className="expert-modal-header">
              <h2><Globe size={22} /> Tạo Domain Mới</h2>
              <button className="expert-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="expert-modal-body">
              <div className="expert-form-group">
                <label><Globe size={16} /> Tên Domain <span className="required">*</span></label>
                <input className="expert-input" placeholder="VD: Information Technology, Healthcare, Finance..." 
                  value={domainForm.name} onChange={e => setDomainForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="expert-form-group">
                <label><FileText size={16} /> Domain Rules (Prompt chung cho domain)</label>
                <textarea className="expert-textarea" 
                  placeholder="Quy tắc và hướng dẫn chung cho tất cả experts trong domain này...&#10;&#10;VD: Trong lĩnh vực IT, luôn cập nhật công nghệ mới nhất, đề xuất các certifications phù hợp..."
                  value={domainForm.rules} onChange={e => setDomainForm(p => ({ ...p, rules: e.target.value }))} />
              </div>
            </div>
            <div className="expert-modal-footer">
              <button className="expert-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="expert-btn success" onClick={handleCreateDomain}>Tạo Domain</button>
            </div>
          </div>
        </div>
      )}

      {/* INDUSTRY MODAL */}
      {activeModal === 'industry' && (
        <div className="expert-modal-overlay" onClick={closeModal}>
          <div className="expert-modal" onClick={e => e.stopPropagation()}>
            <div className="expert-modal-header">
              <h2><Building2 size={22} /> Tạo Industry Mới</h2>
              <button className="expert-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="expert-modal-body">
              <div className="expert-form-group">
                <label><Globe size={16} /> Chọn Domain <span className="required">*</span></label>
                <select className="expert-select" value={industryForm.domain} 
                  onChange={e => setIndustryForm(p => ({ ...p, domain: e.target.value }))}>
                  <option value="">-- Chọn Domain --</option>
                  {uniqueDomains.map(d => <option key={d} value={d}>{d}</option>)}
                  {domainForm.name && !uniqueDomains.includes(domainForm.name) && 
                    <option value={domainForm.name}>{domainForm.name} (mới)</option>}
                </select>
                <input className="expert-input" style={{ marginTop: '0.5rem' }} 
                  placeholder="Hoặc nhập Domain mới..."
                  onChange={e => setIndustryForm(p => ({ ...p, domain: e.target.value }))} />
              </div>
              <div className="expert-form-group">
                <label><Building2 size={16} /> Tên Industry <span className="required">*</span></label>
                <input className="expert-input" placeholder="VD: Software Development, Marketing, Nursing..."
                  value={industryForm.name} onChange={e => setIndustryForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="expert-modal-footer">
              <button className="expert-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="expert-btn success" onClick={handleCreateIndustry}>Tạo Industry</button>
            </div>
          </div>
        </div>
      )}

      {/* JOB ROLE MODAL */}
      {activeModal === 'jobRole' && (
        <div className="expert-modal-overlay" onClick={closeModal}>
          <div className="expert-modal large" onClick={e => e.stopPropagation()}>
            <div className="expert-modal-header">
              <h2><UserCog size={22} /> Tạo Job Role Expert</h2>
              <button className="expert-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="expert-modal-body">
              <div className="expert-form-grid">
                <div className="expert-form-group">
                  <label><Globe size={16} /> Domain <span className="required">*</span></label>
                  <select className="expert-select" value={jobRoleForm.domain}
                    onChange={e => setJobRoleForm(p => ({ ...p, domain: e.target.value, industry: '' }))}>
                    <option value="">-- Chọn Domain --</option>
                    {uniqueDomains.map(d => <option key={d} value={d}>{d}</option>)}
                    {[...domainRulesMap.keys()].filter(d => !uniqueDomains.includes(d)).map(d => 
                      <option key={d} value={d}>{d} (mới)</option>)}
                  </select>
                </div>
                <div className="expert-form-group">
                  <label><Building2 size={16} /> Industry <span className="required">*</span></label>
                  <select className="expert-select" value={jobRoleForm.industry}
                    onChange={e => setJobRoleForm(p => ({ ...p, industry: e.target.value }))}>
                    <option value="">-- Chọn Industry --</option>
                    {jobRoleForm.domain && getIndustriesForDomain(jobRoleForm.domain).map(i => 
                      <option key={i} value={i}>{i}</option>)}
                  </select>
                  <input className="expert-input" style={{ marginTop: '0.5rem' }} placeholder="Hoặc nhập Industry mới..."
                    onChange={e => setJobRoleForm(p => ({ ...p, industry: e.target.value }))} />
                </div>
                <div className="expert-form-group">
                  <label><UserCog size={16} /> Job Role <span className="required">*</span></label>
                  <input className="expert-input" placeholder="VD: Backend Developer, Product Manager..."
                    value={jobRoleForm.jobRole} onChange={e => setJobRoleForm(p => ({ ...p, jobRole: e.target.value }))} />
                </div>
                <div className="expert-form-group">
                  <label><Image size={16} /> Media URL</label>
                  <input className="expert-input" placeholder="URL hình ảnh"
                    value={jobRoleForm.mediaUrl} onChange={e => setJobRoleForm(p => ({ ...p, mediaUrl: e.target.value }))} />
                </div>
                <div className="expert-form-group full-width">
                  <label><FileText size={16} /> Keywords</label>
                  <input className="expert-input" placeholder="backend, java, spring boot, api..."
                    value={jobRoleForm.keywords} onChange={e => setJobRoleForm(p => ({ ...p, keywords: e.target.value }))} />
                </div>
                <div className="expert-form-group full-width">
                  <label><Brain size={16} /> Role Prompt (Prompt riêng cho vai trò này)</label>
                  <textarea className="expert-textarea" 
                    placeholder="Hướng dẫn chi tiết cho expert này...&#10;&#10;VD: Backend Developer cần tư vấn về API design, database optimization, microservices..."
                    value={jobRoleForm.rolePrompt} onChange={e => setJobRoleForm(p => ({ ...p, rolePrompt: e.target.value }))} />
                </div>
                <div className="expert-form-group full-width">
                  <label><Brain size={16} /> System Prompt (Hoặc nhập đầy đủ)</label>
                  <textarea className="expert-textarea prompt" placeholder="System prompt đầy đủ (nếu không dùng Domain Rules + Role Prompt)"
                    value={jobRoleForm.systemPrompt} onChange={e => setJobRoleForm(p => ({ ...p, systemPrompt: e.target.value }))} />
                </div>
                <div className="expert-form-group">
                  <label>Trạng thái</label>
                  <div className="expert-toggle-wrapper">
                    <div className={`expert-toggle ${jobRoleForm.isActive ? 'active' : ''}`}
                      onClick={() => setJobRoleForm(p => ({ ...p, isActive: !p.isActive }))} />
                    <span className="expert-toggle-label">{jobRoleForm.isActive ? 'Hoạt động' : 'Tắt'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="expert-modal-footer">
              <button className="expert-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="expert-btn success" onClick={handleCreateJobRole} disabled={formLoading}>
                {formLoading ? 'Đang tạo...' : 'Tạo Expert'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {activeModal === 'edit' && selectedConfig && (
        <div className="expert-modal-overlay" onClick={closeModal}>
          <div className="expert-modal large" onClick={e => e.stopPropagation()}>
            <div className="expert-modal-header">
              <h2><Edit3 size={22} /> Chỉnh sửa Expert</h2>
              <button className="expert-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="expert-modal-body">
              <div className="expert-form-grid">
                <div className="expert-form-group">
                  <label><Globe size={16} /> Domain</label>
                  <input className="expert-input" value={jobRoleForm.domain}
                    onChange={e => setJobRoleForm(p => ({ ...p, domain: e.target.value }))} />
                </div>
                <div className="expert-form-group">
                  <label><Building2 size={16} /> Industry</label>
                  <input className="expert-input" value={jobRoleForm.industry}
                    onChange={e => setJobRoleForm(p => ({ ...p, industry: e.target.value }))} />
                </div>
                <div className="expert-form-group">
                  <label><UserCog size={16} /> Job Role</label>
                  <input className="expert-input" value={jobRoleForm.jobRole}
                    onChange={e => setJobRoleForm(p => ({ ...p, jobRole: e.target.value }))} />
                </div>
                <div className="expert-form-group">
                  <label><Image size={16} /> Media</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="expert-input" style={{ flex: 1 }} value={jobRoleForm.mediaUrl}
                      onChange={e => setJobRoleForm(p => ({ ...p, mediaUrl: e.target.value }))} />
                    <input type="file" ref={fileInputRef} hidden accept="image/*"
                      onChange={e => { const f = e.target.files?.[0]; if(f) handleImageUpload(f); }} />
                    <button className="expert-btn secondary" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={16} />
                    </button>
                  </div>
                </div>
                <div className="expert-form-group full-width">
                  <label><FileText size={16} /> Keywords</label>
                  <input className="expert-input" value={jobRoleForm.keywords}
                    onChange={e => setJobRoleForm(p => ({ ...p, keywords: e.target.value }))} />
                </div>
                <div className="expert-form-group full-width">
                  <label><Brain size={16} /> Role Prompt</label>
                  <textarea className="expert-textarea" value={jobRoleForm.rolePrompt}
                    onChange={e => setJobRoleForm(p => ({ ...p, rolePrompt: e.target.value }))} />
                </div>
                <div className="expert-form-group full-width">
                  <label><Brain size={16} /> System Prompt</label>
                  <textarea className="expert-textarea prompt" value={jobRoleForm.systemPrompt}
                    onChange={e => setJobRoleForm(p => ({ ...p, systemPrompt: e.target.value }))} />
                </div>
                <div className="expert-form-group">
                  <label>Trạng thái</label>
                  <div className="expert-toggle-wrapper">
                    <div className={`expert-toggle ${jobRoleForm.isActive ? 'active' : ''}`}
                      onClick={() => setJobRoleForm(p => ({ ...p, isActive: !p.isActive }))} />
                    <span className="expert-toggle-label">{jobRoleForm.isActive ? 'Hoạt động' : 'Tắt'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="expert-modal-footer">
              <button className="expert-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="expert-btn success" onClick={handleUpdate} disabled={formLoading}>
                {formLoading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {activeModal === 'view' && selectedConfig && (
        <div className="expert-modal-overlay" onClick={closeModal}>
          <div className="expert-modal large" onClick={e => e.stopPropagation()}>
            <div className="expert-modal-header">
              <h2><Eye size={22} /> Chi tiết Expert</h2>
              <button className="expert-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="expert-modal-body">
              <div className="expert-view-header">
                <div className="expert-view-avatar">
                  {selectedConfig.mediaUrl ? <img src={selectedConfig.mediaUrl} alt="" /> : <UserCog size={32} />}
                </div>
                <div className="expert-view-info">
                  <h3>{selectedConfig.jobRole}</h3>
                  <p>{selectedConfig.domain} → {selectedConfig.industry}</p>
                  <span className={`expert-status-badge ${checkIsActive(selectedConfig) ? 'active' : 'inactive'}`}>
                    {checkIsActive(selectedConfig) ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {selectedConfig.keywords && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#67e8f9', fontSize: '0.85rem' }}>Keywords</h4>
                  <div className="expert-keywords">
                    {selectedConfig.keywords.split(',').map((kw, i) => <span key={i} className="expert-keyword-tag">{kw.trim()}</span>)}
                  </div>
                </div>
              )}
              
              {selectedConfig.domainRules && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#67e8f9', fontSize: '0.85rem' }}>Domain Rules</h4>
                  <div className="expert-prompt-full"><pre>{selectedConfig.domainRules}</pre></div>
                </div>
              )}
              
              {selectedConfig.rolePrompt && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', color: '#67e8f9', fontSize: '0.85rem' }}>Role Prompt</h4>
                  <div className="expert-prompt-full"><pre>{selectedConfig.rolePrompt}</pre></div>
                </div>
              )}
              
              <div>
                <h4 style={{ margin: '0 0 0.75rem', color: '#67e8f9', fontSize: '0.85rem' }}>System Prompt</h4>
                <div className="expert-prompt-full"><pre>{selectedConfig.systemPrompt}</pre></div>
              </div>
            </div>
            <div className="expert-modal-footer">
              <button className="expert-btn secondary" onClick={closeModal}>Đóng</button>
              <button className="expert-btn primary" onClick={() => openEditModal(selectedConfig)}>
                <Edit3 size={16} /> Sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {activeModal === 'delete' && selectedConfig && (
        <div className="expert-modal-overlay" onClick={closeModal}>
          <div className="expert-modal" onClick={e => e.stopPropagation()}>
            <div className="expert-modal-header">
              <h2><Trash2 size={22} /> Xác nhận xóa</h2>
              <button className="expert-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="expert-modal-body">
              <p style={{ color: '#e5e7eb', marginBottom: '1rem' }}>Bạn có chắc muốn xóa Expert này?</p>
              <div className="expert-delete-warning">
                <strong>{selectedConfig.jobRole}</strong>
                <p>{selectedConfig.domain} → {selectedConfig.industry}</p>
              </div>
              <p style={{ color: '#f87171', fontSize: '0.9rem' }}>⚠️ Không thể hoàn tác!</p>
            </div>
            <div className="expert-modal-footer">
              <button className="expert-btn secondary" onClick={closeModal}>Hủy</button>
              <button className="expert-btn danger" onClick={handleDelete} disabled={formLoading}>
                {formLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIExpertManagementTab;
