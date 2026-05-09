import React, { useEffect, useState, useMemo } from 'react';
import { careerTaxonomyService } from '../../../services/careerTaxonomyService';
import { Domain, JobPosition, JobPositionTrack, JobPositionTrackSkill } from '../../../types/careerTaxonomy';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { Skill } from '../../../types/skillRegistry';
import { normalizeTaxonomyCode } from '../../../utils/taxonomyNormalize';
import { showAppError, showAppInfo, showAppSuccess } from '../../../context/ToastContext';
import './JobPositionTrackSkillTab.css';

function LocalSearchSelect({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled 
}: { 
  options: { id: number | string, label: string }[], 
  value: number | string, 
  onChange: (val: number | string) => void, 
  placeholder: string, 
  disabled?: boolean 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const selectedOption = options.find(o => o.id === value);

  return (
    <div ref={wrapperRef} className="lss__wrapper">
      <div
        className={`lss__trigger job-track-skill-tab__select ${disabled ? 'lss__trigger--disabled' : ''}`}
        onClick={() => { if (!disabled) { setIsOpen(!isOpen); setQuery(''); } }}
        role="combobox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? '' : 'lss__placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="lss__controls">
          {selectedOption && (
            <span
              className="lss__clear"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              title="Xóa lựa chọn"
            >
              ✕
            </span>
          )}
          <span className="lss__arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div className="lss__dropdown">
          <div className="lss__search-wrapper">
            <input
              autoFocus
              type="text"
              placeholder="Tìm kiếm..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="job-track-skill-tab__input lss__search-input"
            />
          </div>
          <div className="lss__list">
            {filtered.length === 0 ? (
              <div className="lss__empty">Không tìm thấy kết quả</div>
            ) : (
              filtered.map(o => (
                <div
                  key={o.id}
                  className={`lss__option ${o.id === value ? 'lss__option--selected' : ''}`}
                  onClick={() => { onChange(o.id); setIsOpen(false); }}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const JobPositionTrackSkillTab: React.FC = () => {
  // Global Data
  const [domains, setDomains] = useState<Domain[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [tracks, setTracks] = useState<JobPositionTrack[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  
  // Detail Data
  const [trackSkills, setTrackSkills] = useState<JobPositionTrackSkill[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  // Filters
  const [filterDomainId, setFilterDomainId] = useState<number | ''>('');
  const [filterJpId, setFilterJpId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create track form
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [trackForm, setTrackForm] = useState({ 
    domainId: '' as number | '',
    jobPositionId: '' as number | '',
    code: '', 
    name: '', 
    description: '', 
    targetLevel: 'FRESHER' 
  });
  const [trackSubmitting, setTrackSubmitting] = useState(false);

  // Edit track state
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [editTrackForm, setEditTrackForm] = useState({ code: '', name: '', description: '', targetLevel: 'FRESHER', jobPositionId: '' as number | '' });
  const [editTrackSubmitting, setEditTrackSubmitting] = useState(false);

  // Add skill to track
  const [addSkillId, setAddSkillId] = useState('');
  const [addRequirementType, setAddRequirementType] = useState<JobPositionTrackSkill['requirementType']>('REQUIRED');
  const [addImportanceLevel, setAddImportanceLevel] = useState<JobPositionTrackSkill['importanceLevel']>('MEDIUM');
  const [addSkillSubmitting, setAddSkillSubmitting] = useState(false);

  // Edit mapped skill state
  const [editingSkillMappingId, setEditingSkillMappingId] = useState<number | null>(null);
  const [editMappingForm, setEditMappingForm] = useState({ requirementType: 'REQUIRED', importanceLevel: 'MEDIUM' });
  const [trackSkillsSaveState, setTrackSkillsSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveStateTimerRef = React.useRef<number | null>(null);

  const clearTrackSkillsSaveStateTimer = () => {
    if (saveStateTimerRef.current) {
      window.clearTimeout(saveStateTimerRef.current);
      saveStateTimerRef.current = null;
    }
  };

  const setTrackSkillsSaved = (message: string) => {
    clearTrackSkillsSaveStateTimer();
    setTrackSkillsSaveState('saved');
    showAppSuccess('Đã lưu mapping', message);
    saveStateTimerRef.current = window.setTimeout(() => {
      setTrackSkillsSaveState('idle');
      saveStateTimerRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => clearTrackSkillsSaveStateTimer();
  }, []);

  const fetchGlobalData = async () => {
    try {
      const [domainsData, jpData, tracksData, skillsData] = await Promise.all([
        careerTaxonomyService.getDomains(),
        careerTaxonomyService.getJobPositions(),
        careerTaxonomyService.getTracks(),
        adminSkillRegistryService.getActiveSkills(),
      ]);
      setDomains(domainsData);
      setJobPositions(jpData);
      setTracks(tracksData);
      setAllSkills(skillsData);
    } catch {
      setError('Không tải được dữ liệu ban đầu.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchGlobalData();
      setLoading(false);
    };
    init();
  }, []);

  const refreshTrackSkills = async (trackId: number) => {
    try {
      const data = await careerTaxonomyService.getTrackSkills(trackId);
      // Sort skills
      data.sort((a, b) => a.sortOrder - b.sortOrder);
      setTrackSkills(data);
    } catch {
      setError('Lỗi khi tải danh sách skills của track.');
    }
  };

  useEffect(() => {
    if (selectedTrackId) {
      refreshTrackSkills(selectedTrackId);
    } else {
      setTrackSkills([]);
    }
  }, [selectedTrackId]);

  // Derived filtered options
  const filteredJobPositions = useMemo(() => {
    if (!filterDomainId) return jobPositions;
    return jobPositions.filter(jp => jp.domainId === Number(filterDomainId));
  }, [jobPositions, filterDomainId]);

  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      if (filterJpId && t.jobPositionId !== Number(filterJpId)) return false;
      if (filterDomainId) {
        const jp = jobPositions.find(j => j.id === t.jobPositionId);
        if (!jp || jp.domainId !== Number(filterDomainId)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tracks, filterDomainId, filterJpId, searchQuery, jobPositions]);

  // Actions: Track
  const handleCreateTrack = async () => {
    if (!trackForm.code || !trackForm.name || !trackForm.jobPositionId) return;
    setTrackSubmitting(true); setError(null);
    try {
      await careerTaxonomyService.createTrack({ 
        code: trackForm.code.trim(), 
        name: trackForm.name.trim(), 
        description: trackForm.description.trim() || undefined, 
        jobPositionId: Number(trackForm.jobPositionId), 
        targetLevel: trackForm.targetLevel as JobPositionTrack['targetLevel'] 
      });
      setTrackForm({ domainId: '', jobPositionId: '', code: '', name: '', description: '', targetLevel: 'FRESHER' });
      setShowTrackForm(false);
      await fetchGlobalData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '';
      setError(msg.includes('TRACK_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Code "${trackForm.code}" đã tồn tại.` : 'Tạo track thất bại: ' + msg);
    } finally { setTrackSubmitting(false); }
  };

  const startEditTrack = (t: JobPositionTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrackId(t.id);
    setEditTrackForm({ code: t.code, name: t.name, description: t.description || '', targetLevel: t.targetLevel, jobPositionId: t.jobPositionId });
  };
  
  const cancelEditTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrackId(null);
  };

  const handleEditTrack = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTrackForm.code || !editTrackForm.name || !editTrackForm.jobPositionId) return;
    setEditTrackSubmitting(true); setError(null);
    try {
      await careerTaxonomyService.updateTrack(id, { 
        code: editTrackForm.code.trim(), 
        name: editTrackForm.name.trim(), 
        description: editTrackForm.description.trim() || undefined, 
        jobPositionId: Number(editTrackForm.jobPositionId), 
        targetLevel: editTrackForm.targetLevel as JobPositionTrack['targetLevel'] 
      });
      setEditingTrackId(null);
      await fetchGlobalData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '';
      setError(msg.includes('TRACK_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Code "${editTrackForm.code}" đã tồn tại.` : 'Update track thất bại: ' + msg);
    } finally { setEditTrackSubmitting(false); }
  };

  const handleDeactivateTrack = async (id: number, name: string) => {
    if (!window.confirm(`Deactivate track "${name}"?`)) return;
    setError(null);
    try {
      await careerTaxonomyService.deactivateTrack(id);
      await fetchGlobalData();
      if (selectedTrackId === id) setSelectedTrackId(null);
    } catch (e: any) { setError('Deactivate thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  const handleReactivateTrack = async (id: number, name: string) => {
    if (!window.confirm(`Reactivate track "${name}"?`)) return;
    setError(null);
    try {
      await careerTaxonomyService.reactivateTrack(id);
      await fetchGlobalData();
    } catch (e: any) { setError('Reactivate thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  const handleHardDeleteTrack = async (id: number, name: string) => {
    if (!window.confirm(`Xóa vĩnh viễn track "${name}"? Hành động này sẽ xóa cả skill map và không thể hoàn tác.`)) return;
    setError(null);
    try {
      await careerTaxonomyService.hardDeleteTrack(id);
      await fetchGlobalData();
      if (selectedTrackId === id) setSelectedTrackId(null);
    } catch (e: any) { setError('Delete thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  // Actions: Skills in Track
  const handleAddSkillToTrack = async () => {
    const skillId = parseInt(addSkillId, 10);
    if (!selectedTrackId || isNaN(skillId)) { setError('Chọn track và nhập Skill ID hợp lệ.'); return; }
    setAddSkillSubmitting(true);
    setTrackSkillsSaveState('saving');
    setError(null);
    try {
      const existing: Partial<JobPositionTrackSkill>[] = trackSkills.map(ts => ({ skillId: ts.skillId, requirementType: ts.requirementType, importanceLevel: ts.importanceLevel, sortOrder: ts.sortOrder }));
      const next: Partial<JobPositionTrackSkill>[] = [...existing, { skillId, requirementType: addRequirementType, importanceLevel: addImportanceLevel, sortOrder: existing.length + 1 }];
      await careerTaxonomyService.updateTrackSkills(selectedTrackId, next);
      setAddSkillId('');
      setAddRequirementType('REQUIRED');
      setAddImportanceLevel('MEDIUM');
      await refreshTrackSkills(selectedTrackId);
      setTrackSkillsSaved(`Đã thêm skill mới vào track và lưu đầy đủ ${next.length} mapping.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setTrackSkillsSaveState('idle');
      const friendlyMessage = msg.includes('SKILL_NOT_ACTIVE')
        ? `Skill ID ${skillId} không ACTIVE.`
        : msg.includes('DUPLICATE')
          ? 'Skill đã có trong track.'
          : 'Thêm skill thất bại: ' + msg;
      setError(friendlyMessage);
      showAppError('Thêm skill thất bại', friendlyMessage);
    } finally { setAddSkillSubmitting(false); }
  };

  const startEditMapping = (ts: JobPositionTrackSkill) => {
    setEditingSkillMappingId(ts.skillId);
    setEditMappingForm({ requirementType: ts.requirementType, importanceLevel: ts.importanceLevel });
  };
  const cancelEditMapping = () => setEditingSkillMappingId(null);

  const saveEditMapping = async (skillId: number) => {
    if (!selectedTrackId) return;
    setTrackSkillsSaveState('saving');
    setError(null);
    try {
      const next: Partial<JobPositionTrackSkill>[] = trackSkills.map(ts => {
        if (ts.skillId === skillId) {
          return { skillId: ts.skillId, requirementType: editMappingForm.requirementType as any, importanceLevel: editMappingForm.importanceLevel as any, sortOrder: ts.sortOrder };
        }
        return { skillId: ts.skillId, requirementType: ts.requirementType, importanceLevel: ts.importanceLevel, sortOrder: ts.sortOrder };
      });
      await careerTaxonomyService.updateTrackSkills(selectedTrackId, next);
      setEditingSkillMappingId(null);
      await refreshTrackSkills(selectedTrackId);
      setTrackSkillsSaved('Đã cập nhật requirement / importance và lưu lại toàn bộ mapping của track.');
    } catch (e: any) {
      const message = 'Lưu thất bại: ' + (e?.response?.data?.message || e?.message);
      setTrackSkillsSaveState('idle');
      setError(message);
      showAppError('Lưu mapping thất bại', message);
    }
  };

  const removeSkillFromTrack = async (skillId: number) => {
    if (!selectedTrackId || !window.confirm('Gỡ skill này khỏi track?')) return;
    setTrackSkillsSaveState('saving');
    setError(null);
    try {
      const next: Partial<JobPositionTrackSkill>[] = trackSkills
        .filter(ts => ts.skillId !== skillId)
        .map(ts => ({ skillId: ts.skillId, requirementType: ts.requirementType, importanceLevel: ts.importanceLevel, sortOrder: ts.sortOrder }));
      await careerTaxonomyService.updateTrackSkills(selectedTrackId, next);
      await refreshTrackSkills(selectedTrackId);
      setTrackSkillsSaved('Đã gỡ skill khỏi track và lưu lại thứ tự mới.');
    } catch (e: any) {
      const message = 'Gỡ skill thất bại: ' + (e?.response?.data?.message || e?.message);
      setTrackSkillsSaveState('idle');
      setError(message);
      showAppError('Gỡ skill thất bại', message);
    }
  };

  const moveSkill = async (skillId: number, direction: 'up' | 'down') => {
    if (!selectedTrackId) return;
    if (trackSkillsSaveState === 'saving') return;
    const idx = trackSkills.findIndex(ts => ts.skillId === skillId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === trackSkills.length - 1) return;

    const newSkills = [...trackSkills];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSkills[idx], newSkills[swapIdx]] = [newSkills[swapIdx], newSkills[idx]];

    const payload: Partial<JobPositionTrackSkill>[] = newSkills.map((ts, i) => ({
      skillId: ts.skillId,
      requirementType: ts.requirementType,
      importanceLevel: ts.importanceLevel,
      sortOrder: i + 1
    }));

    try {
      setTrackSkillsSaveState('saving');
      await careerTaxonomyService.updateTrackSkills(selectedTrackId, payload);
      await refreshTrackSkills(selectedTrackId);
      setTrackSkillsSaved(`Đã đổi thứ tự skill sang vị trí ${swapIdx + 1}.`);
    } catch (e: any) {
      const message = 'Đổi vị trí thất bại: ' + (e?.response?.data?.message || e?.message);
      setTrackSkillsSaveState('idle');
      setError(message);
      showAppError('Đổi thứ tự thất bại', message);
    }
  };

  const getJpName = (jpId: number) => jobPositions.find(jp => jp.id === jpId)?.name || 'Unknown';
  const getDomainName = (domainId: number) => domains.find(d => d.id === domainId)?.name || 'Unknown';

  if (loading) return <div className="admin-tab-content"><p>Loading...</p></div>;

  return (
    <div className="admin-tab-content job-track-skill-tab">
      <div className="job-track-skill-tab__header">
        <div>
          <h2 className="job-track-skill-tab__title">Track Skill Mapping</h2>
          <p>Quản lý danh sách Track và gán Kỹ năng (Skill) cho từng Track</p>
        </div>
        <button 
          onClick={() => setShowTrackForm(!showTrackForm)} 
          className="job-track-skill-tab__btn job-track-skill-tab__btn--primary"
        >
          {showTrackForm ? '✕ Hủy' : '+ Thêm Track'}
        </button>
      </div>

      {error && <div className="job-track-skill-tab__error">{error}</div>}

      {/* Filter Bar */}
      <div className="job-track-skill-tab__card" style={{ marginBottom: 20, display: 'flex', gap: '1rem', alignItems: 'center', background: '#1e293b' }}>
        <input 
          placeholder="Tìm Track Code hoặc Tên..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          className="job-track-skill-tab__input" 
          style={{ margin: 0, flex: 1 }} 
        />
        <select value={filterDomainId} onChange={e => { setFilterDomainId(e.target.value ? Number(e.target.value) : ''); setFilterJpId(''); }} className="job-track-skill-tab__select" style={{ margin: 0, width: '250px' }}>
          <option value="">Tất cả Domain</option>
          {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filterJpId} onChange={e => setFilterJpId(e.target.value ? Number(e.target.value) : '')} className="job-track-skill-tab__select" style={{ margin: 0, width: '250px' }}>
          <option value="">Tất cả Job Position</option>
          {filteredJobPositions.map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
        </select>
      </div>

      {/* Create Form */}
      {showTrackForm && (
        <div className="job-track-skill-tab__card" style={{ marginBottom: 20, border: '1px solid var(--admin-primary-glow)' }}>
          <h3 className="job-track-skill-tab__section-title">Tạo Track Mới</h3>
          <div className="job-track-skill-tab__form-grid job-track-skill-tab__form-grid--job">
            <select value={trackForm.domainId} onChange={e => setTrackForm(p => ({ ...p, domainId: e.target.value, jobPositionId: '' }))} className="job-track-skill-tab__select">
              <option value="">-- Lọc theo Domain --</option>
              {domains.filter(d => d.status === 'ACTIVE').map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
            <select value={trackForm.jobPositionId} onChange={e => setTrackForm(p => ({ ...p, jobPositionId: e.target.value }))} className="job-track-skill-tab__select">
              <option value="">-- Chọn Job Position * --</option>
              {jobPositions.filter(jp => jp.status === 'ACTIVE' && (!trackForm.domainId || jp.domainId === Number(trackForm.domainId))).map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
            </select>
            <input placeholder="Code * (vd: BACKEND_JAVA_SPRING)" value={trackForm.code} onChange={e => setTrackForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="job-track-skill-tab__input" />
            <input placeholder="Name * (vd: Backend Java Spring Boot)" value={trackForm.name} onChange={e => setTrackForm(p => ({ ...p, name: e.target.value }))} className="job-track-skill-tab__input" />
            <input placeholder="Description" value={trackForm.description} onChange={e => setTrackForm(p => ({ ...p, description: e.target.value }))} className="job-track-skill-tab__input" />
            <select value={trackForm.targetLevel} onChange={e => setTrackForm(p => ({ ...p, targetLevel: e.target.value }))} className="job-track-skill-tab__select">
              {['INTERNSHIP', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={handleCreateTrack} disabled={trackSubmitting || !trackForm.code || !trackForm.name || !trackForm.jobPositionId} className="job-track-skill-tab__btn job-track-skill-tab__btn--success" style={{ gridColumn: '1 / -1' }}>
              {trackSubmitting ? '...' : 'Tạo Track'}
            </button>
          </div>
        </div>
      )}

      {/* Flat Table */}
      <div className="job-track-skill-tab__card" style={{ marginBottom: 20 }}>
        <div className="job-track-skill-tab__table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="job-track-skill-tab__table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Job Position</th>
                <th>Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map(t => (
                editingTrackId === t.id ? (
                  <tr key={t.id} style={{ cursor: 'default' }}>
                    <td><input value={editTrackForm.code} onChange={e => setEditTrackForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="job-track-skill-tab__input" style={{ margin: 0, minWidth: '100px' }} autoFocus /></td>
                    <td><input value={editTrackForm.name} onChange={e => setEditTrackForm(p => ({ ...p, name: e.target.value }))} className="job-track-skill-tab__input" style={{ margin: 0, minWidth: '150px' }} /></td>
                    <td>
                      <select value={editTrackForm.jobPositionId} onChange={e => setEditTrackForm(p => ({ ...p, jobPositionId: e.target.value }))} className="job-track-skill-tab__select" style={{ margin: 0 }}>
                        {jobPositions.filter(jp => jp.status === 'ACTIVE' || jp.id === t.jobPositionId).map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={editTrackForm.targetLevel} onChange={e => setEditTrackForm(p => ({ ...p, targetLevel: e.target.value }))} className="job-track-skill-tab__select" style={{ margin: 0 }}>
                        {['INTERNSHIP', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td><span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={(e) => handleEditTrack(t.id, e)} disabled={editTrackSubmitting || !editTrackForm.code || !editTrackForm.name || !editTrackForm.jobPositionId} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">Lưu</button>
                        <button onClick={cancelEditTrack} className="job-track-skill-tab__btn" style={{ backgroundColor: '#6b7280', color: 'white', border: 'none' }}>Hủy</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr 
                    key={t.id} 
                    className={selectedTrackId === t.id ? 'job-track-skill-tab__table-row--selected' : ''} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setSelectedTrackId(t.id)}
                  >
                    <td>{t.code}</td>
                    <td>{t.name}</td>
                    <td>
                      <div style={{ fontSize: '0.85em', color: '#94a3b8' }}>{getDomainName(jobPositions.find(j => j.id === t.jobPositionId)?.domainId || 0)}</div>
                      <div>{getJpName(t.jobPositionId)}</div>
                    </td>
                    <td>{t.targetLevel}</td>
                    <td><span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {t.status === 'ACTIVE' && <button onClick={(e) => startEditTrack(t, e)} className="job-track-skill-tab__btn job-track-skill-tab__btn--primary">Edit</button>}
                        {t.status === 'ACTIVE' && <button onClick={(e) => { e.stopPropagation(); handleDeactivateTrack(t.id, t.name); }} className="job-track-skill-tab__btn job-track-skill-tab__btn--danger">Deactivate</button>}
                        {t.status === 'INACTIVE' && <button onClick={(e) => { e.stopPropagation(); handleReactivateTrack(t.id, t.name); }} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">Reactivate</button>}
                        {t.status === 'INACTIVE' && <button onClick={(e) => { e.stopPropagation(); handleHardDeleteTrack(t.id, t.name); }} className="job-track-skill-tab__btn" style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}>Hard Delete</button>}
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {filteredTracks.length === 0 && <tr><td colSpan={6} className="job-track-skill-tab__empty-state">Không có Track nào phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
        {!selectedTrackId && tracks.length > 0 && (
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Click vào một Track trong bảng để quản lý Kỹ năng (Skill).
          </p>
        )}
      </div>

      {/* Track skills Detail Section */}
      {selectedTrackId && (
        <div className="job-track-skill-tab__card" style={{ border: '1px solid var(--admin-primary-glow)' }}>
          <h3 className="job-track-skill-tab__section-title" style={{ marginBottom: '0.875rem' }}>
            Skills trong Track: <span style={{ color: 'var(--admin-primary)' }}>{tracks.find(t => t.id === selectedTrackId)?.name}</span>
          </h3>
          <div className={`job-track-skill-tab__save-state job-track-skill-tab__save-state--${trackSkillsSaveState}`}>
            {trackSkillsSaveState === 'saving' && 'Đang lưu thay đổi...'}
            {trackSkillsSaveState === 'saved' && 'Đã lưu xong, có thể rời màn hình an toàn.'}
          </div>

          {/* Add skill row */}
          <div className="job-track-skill-tab__add-skill-bar">
            <div className="job-track-skill-tab__add-skill-select">
              <LocalSearchSelect
                options={allSkills.filter(sk => !trackSkills.some(ts => ts.skillId === sk.id)).map(sk => ({ id: sk.id, label: `${sk.name} (${sk.canonicalKey})` }))}
                value={addSkillId ? parseInt(addSkillId, 10) : ''}
                onChange={val => setAddSkillId(val.toString())}
                placeholder="-- Chọn Skill để thêm --"
                disabled={addSkillSubmitting || trackSkillsSaveState === 'saving'}
              />
            </div>
            <div>
              <label className="job-track-skill-tab__label">Yêu cầu</label>
              <select
                value={addRequirementType}
                onChange={e => setAddRequirementType(e.target.value as JobPositionTrackSkill['requirementType'])}
                className="job-track-skill-tab__select"
              >
                <option value="REQUIRED">Bắt buộc (REQUIRED)</option>
                <option value="OPTIONAL">Không bắt buộc (OPTIONAL)</option>
                <option value="RECOMMENDED">Nên có (RECOMMENDED)</option>
              </select>
            </div>
            <div>
              <label className="job-track-skill-tab__label">Mức độ</label>
              <select
                value={addImportanceLevel}
                onChange={e => setAddImportanceLevel(e.target.value as JobPositionTrackSkill['importanceLevel'])}
                className="job-track-skill-tab__select"
              >
                <option value="LOW">Thấp (LOW)</option>
                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                <option value="HIGH">Cao (HIGH)</option>
                <option value="CRITICAL">Cực kỳ quan trọng (CRITICAL)</option>
              </select>
            </div>
            <button
              onClick={handleAddSkillToTrack}
                disabled={!addSkillId || addSkillSubmitting || trackSkillsSaveState === 'saving'}
              className="job-track-skill-tab__btn job-track-skill-tab__btn--success"
              style={{ alignSelf: 'flex-end', minWidth: '80px' }}
            >
              {addSkillSubmitting ? '...' : '+ Thêm'}
            </button>
          </div>

          {/* Track skills table */}
          <table className="job-track-skill-tab__table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Canonical Key</th>
                <th>Requirement</th>
                <th>Importance</th>
                <th>Suggested Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trackSkills.map((ts, idx) => {
                const skill = allSkills.find(s => s.id === ts.skillId);
                const isEditing = editingSkillMappingId === ts.skillId;
                return (
                  <tr key={ts.skillId}>
                    <td>{skill?.name || `Skill ID: ${ts.skillId}`}</td>
                    <td><code className="job-track-skill-tab__table-cell-code">{skill?.canonicalKey || 'N/A'}</code></td>
                    <td>
                      {isEditing ? (
                        <select value={editMappingForm.requirementType} onChange={e => setEditMappingForm(p => ({ ...p, requirementType: e.target.value }))} className="job-track-skill-tab__select" style={{ margin: 0 }}>
                          <option value="REQUIRED">REQUIRED</option><option value="OPTIONAL">OPTIONAL</option><option value="RECOMMENDED">RECOMMENDED</option>
                        </select>
                      ) : ts.requirementType}
                    </td>
                    <td>
                      {isEditing ? (
                        <select value={editMappingForm.importanceLevel} onChange={e => setEditMappingForm(p => ({ ...p, importanceLevel: e.target.value }))} className="job-track-skill-tab__select" style={{ margin: 0 }}>
                          <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option>
                        </select>
                      ) : ts.importanceLevel}
                    </td>
                    <td>
                      <div className="job-track-skill-tab__order-controls">
                        <button onClick={() => moveSkill(ts.skillId, 'up')} disabled={idx === 0 || trackSkillsSaveState === 'saving'} title="Move Up">▲</button>
                        <span>{ts.sortOrder}</span>
                        <button onClick={() => moveSkill(ts.skillId, 'down')} disabled={idx === trackSkills.length - 1 || trackSkillsSaveState === 'saving'} title="Move Down">▼</button>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button onClick={() => saveEditMapping(ts.skillId)} disabled={trackSkillsSaveState === 'saving'} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">Lưu</button>
                          <button onClick={cancelEditMapping} className="job-track-skill-tab__btn" style={{ backgroundColor: '#6b7280', color: 'white', border: 'none' }}>Hủy</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button onClick={() => startEditMapping(ts)} className="job-track-skill-tab__btn job-track-skill-tab__btn--primary">Edit</button>
                          <button onClick={() => removeSkillFromTrack(ts.skillId)} className="job-track-skill-tab__btn job-track-skill-tab__btn--danger">Xóa</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {trackSkills.length === 0 && <tr><td colSpan={6} className="job-track-skill-tab__empty-state">Chưa có skill nào được map.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JobPositionTrackSkillTab;
