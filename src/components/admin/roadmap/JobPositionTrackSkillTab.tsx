import React, { useEffect, useState, useMemo } from 'react';
import { careerTaxonomyService } from '../../../services/careerTaxonomyService';
import { Domain, JobPosition, JobPositionTrack, JobPositionTrackSkill } from '../../../types/careerTaxonomy';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { Skill } from '../../../types/skillRegistry';
import { normalizeTaxonomyCode } from '../../../utils/taxonomyNormalize';
import { confirmAction } from '../../../context/ConfirmDialogContext';
import { showAppError, showAppSuccess } from '../../../context/ToastContext';
import './JobPositionTrackSkillTab.css';

type TrackSortKey = 'code' | 'name' | 'jobPosition' | 'targetLevel' | 'status';

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
  const [filterStatus, setFilterStatus] = useState<'ALL' | JobPositionTrack['status']>('ALL');
  const [sortKey, setSortKey] = useState<TrackSortKey>('code');
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
  const [addWeight, setAddWeight] = useState<number>(1);
  const [addSkillSubmitting, setAddSkillSubmitting] = useState(false);

  // Edit mapped skill state
  const [editingSkillMappingId, setEditingSkillMappingId] = useState<number | null>(null);
  const [editMappingForm, setEditMappingForm] = useState({ requirementType: 'REQUIRED', weight: 1 });
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
      const message = 'Không tải được dữ liệu ban đầu.';
      setError(message);
      showAppError('Tải dữ liệu thất bại', message);
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
      const message = 'Lỗi khi tải danh sách kỹ năng của track.';
      setError(message);
      showAppError('Tải mapping thất bại', message);
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
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      if (filterDomainId) {
        const jp = jobPositions.find(j => j.id === t.jobPositionId);
        if (!jp || jp.domainId !== Number(filterDomainId)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const jp = jobPositions.find(j => j.id === t.jobPositionId);
        const domain = domains.find(d => d.id === jp?.domainId);
        return [t.name, t.code, t.description, jp?.name, domain?.name].some(value => (value || '').toLowerCase().includes(q));
      }
      return true;
    }).sort((a, b) => {
      if (sortKey === 'jobPosition') {
        const nameA = jobPositions.find(jp => jp.id === a.jobPositionId)?.name || '';
        const nameB = jobPositions.find(jp => jp.id === b.jobPositionId)?.name || '';
        return nameA.localeCompare(nameB, 'vi');
      }
      return (a[sortKey] || '').localeCompare(b[sortKey] || '', 'vi');
    });
  }, [tracks, filterDomainId, filterJpId, filterStatus, searchQuery, sortKey, jobPositions, domains]);

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
      showAppSuccess('Đã tạo track', `Track "${trackForm.name.trim()}" đã được tạo.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '';
      const message = msg.includes('TRACK_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Mã "${trackForm.code}" đã tồn tại.` : 'Tạo track thất bại: ' + msg;
      setError(message);
      showAppError('Tạo track thất bại', message);
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
      showAppSuccess('Đã cập nhật track', `Track "${editTrackForm.name.trim()}" đã được lưu.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '';
      const message = msg.includes('TRACK_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Mã "${editTrackForm.code}" đã tồn tại.` : 'Cập nhật track thất bại: ' + msg;
      setError(message);
      showAppError('Cập nhật track thất bại', message);
    } finally { setEditTrackSubmitting(false); }
  };

  const handleDeactivateTrack = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Ngừng kích hoạt track', message: `Ngừng kích hoạt track "${name}"?`, confirmLabel: 'Ngừng kích hoạt', variant: 'danger' }))) return;
    setError(null);
    try {
      await careerTaxonomyService.deactivateTrack(id);
      await fetchGlobalData();
      if (selectedTrackId === id) setSelectedTrackId(null);
      showAppSuccess('Đã ngừng kích hoạt', `Track "${name}" đã được cập nhật.`);
    } catch (e: any) { const message = 'Ngừng kích hoạt thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Ngừng kích hoạt thất bại', message); }
  };

  const handleReactivateTrack = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Kích hoạt lại track', message: `Kích hoạt lại track "${name}"?`, confirmLabel: 'Kích hoạt lại', variant: 'primary' }))) return;
    setError(null);
    try {
      await careerTaxonomyService.reactivateTrack(id);
      await fetchGlobalData();
      showAppSuccess('Đã kích hoạt lại', `Track "${name}" đã hoạt động lại.`);
    } catch (e: any) { const message = 'Kích hoạt lại thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Kích hoạt lại thất bại', message); }
  };

  const handleHardDeleteTrack = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Xóa vĩnh viễn track', message: `Xóa vĩnh viễn track "${name}"? Hành động này sẽ xóa cả mapping kỹ năng và không thể hoàn tác.`, confirmLabel: 'Xóa vĩnh viễn', variant: 'danger' }))) return;
    setError(null);
    try {
      await careerTaxonomyService.hardDeleteTrack(id);
      await fetchGlobalData();
      if (selectedTrackId === id) setSelectedTrackId(null);
      showAppSuccess('Đã xóa track', `Track "${name}" đã được xóa.`);
    } catch (e: any) { const message = 'Xóa thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Xóa track thất bại', message); }
  };

  // Actions: Skills in Track
  const handleAddSkillToTrack = async () => {
    const skillId = parseInt(addSkillId, 10);
    if (!selectedTrackId || isNaN(skillId)) { setError('Chọn track và nhập Skill ID hợp lệ.'); return; }
    setAddSkillSubmitting(true);
    setTrackSkillsSaveState('saving');
    setError(null);
    try {
      const clampedWeight = Math.max(1, Math.min(10, addWeight));
      const existing: Partial<JobPositionTrackSkill>[] = trackSkills.map(ts => ({ skillId: ts.skillId, requirementType: ts.requirementType, weight: ts.weight, sortOrder: ts.sortOrder }));
      const next: Partial<JobPositionTrackSkill>[] = [...existing, { skillId, requirementType: addRequirementType, weight: clampedWeight, sortOrder: existing.length + 1 }];
      await careerTaxonomyService.updateTrackSkills(selectedTrackId, next);
      setAddSkillId('');
      setAddRequirementType('REQUIRED');
      setAddWeight(1);
      await refreshTrackSkills(selectedTrackId);
      setTrackSkillsSaved(`Đã thêm kỹ năng mới vào track và lưu đầy đủ ${next.length} mapping.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setTrackSkillsSaveState('idle');
      const friendlyMessage = msg.includes('SKILL_NOT_ACTIVE')
      ? `Kỹ năng ID ${skillId} không ở trạng thái hoạt động.`
        : msg.includes('DUPLICATE')
          ? 'Skill đã có trong track.'
          : 'Thêm kỹ năng thất bại: ' + msg;
      setError(friendlyMessage);
      showAppError('Thêm skill thất bại', friendlyMessage);
    } finally { setAddSkillSubmitting(false); }
  };

  const startEditMapping = (ts: JobPositionTrackSkill) => {
    setEditingSkillMappingId(ts.skillId);
    setEditMappingForm({ requirementType: ts.requirementType, weight: ts.weight ?? 1 });
  };
  const cancelEditMapping = () => setEditingSkillMappingId(null);

  const saveEditMapping = async (skillId: number) => {
    if (!selectedTrackId) return;
    setTrackSkillsSaveState('saving');
    setError(null);
    try {
      const clampedWeight = Math.max(1, Math.min(10, editMappingForm.weight));
      const next: Partial<JobPositionTrackSkill>[] = trackSkills.map(ts => {
        if (ts.skillId === skillId) {
          return { skillId: ts.skillId, requirementType: editMappingForm.requirementType as any, weight: clampedWeight, sortOrder: ts.sortOrder };
        }
        return { skillId: ts.skillId, requirementType: ts.requirementType, weight: ts.weight, sortOrder: ts.sortOrder };
      });
      await careerTaxonomyService.updateTrackSkills(selectedTrackId, next);
      setEditingSkillMappingId(null);
      await refreshTrackSkills(selectedTrackId);
      setTrackSkillsSaved('Đã cập nhật yêu cầu / trọng số và lưu lại toàn bộ mapping của track.');
    } catch (e: any) {
      const message = 'Lưu thất bại: ' + (e?.response?.data?.message || e?.message);
      setTrackSkillsSaveState('idle');
      setError(message);
      showAppError('Lưu mapping thất bại', message);
    }
  };

  const removeSkillFromTrack = async (skillId: number) => {
    if (!selectedTrackId) return;
    const skillName = allSkills.find(s => s.id === skillId)?.name || `Skill ID ${skillId}`;
    if (!(await confirmAction({ title: 'Gỡ kỹ năng khỏi track', message: `Gỡ "${skillName}" khỏi track này?`, confirmLabel: 'Gỡ kỹ năng', variant: 'danger' }))) return;
    setTrackSkillsSaveState('saving');
    setError(null);
    try {
      const next: Partial<JobPositionTrackSkill>[] = trackSkills
        .filter(ts => ts.skillId !== skillId)
        .map(ts => ({ skillId: ts.skillId, requirementType: ts.requirementType, weight: ts.weight, sortOrder: ts.sortOrder }));
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
      weight: ts.weight,
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

  const getJpName = (jpId: number) => jobPositions.find(jp => jp.id === jpId)?.name || 'Không rõ';
  const getDomainName = (domainId: number) => domains.find(d => d.id === domainId)?.name || 'Không rõ';

  if (loading) return <div className="admin-tab-content"><p>Đang tải...</p></div>;

  return (
    <div className="admin-tab-content job-track-skill-tab">
      <div className="job-track-skill-tab__header">
        <div>
          <h2 className="job-track-skill-tab__title">Mapping kỹ năng theo track</h2>
          <p>Quản lý danh sách track và gán kỹ năng cho từng track</p>
        </div>
        <button 
          onClick={() => setShowTrackForm(!showTrackForm)} 
          className="job-track-skill-tab__btn job-track-skill-tab__btn--primary"
        >
          {showTrackForm ? '✕ Hủy' : '+ Thêm track'}
        </button>
      </div>

      {error && <div className="job-track-skill-tab__error">{error}</div>}

      {/* Filter Bar */}
      <div className="job-track-skill-tab__card job-track-skill-tab__filter-bar">
        <input 
          placeholder="Tìm mã hoặc tên track..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          className="job-track-skill-tab__input job-track-skill-tab__filter-search" 
        />
        <select value={filterDomainId} onChange={e => { setFilterDomainId(e.target.value ? Number(e.target.value) : ''); setFilterJpId(''); }} className="job-track-skill-tab__select job-track-skill-tab__filter-select">
          <option value="">Tất cả domain</option>
          {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filterJpId} onChange={e => setFilterJpId(e.target.value ? Number(e.target.value) : '')} className="job-track-skill-tab__select job-track-skill-tab__filter-select">
          <option value="">Tất cả vị trí công việc</option>
          {filteredJobPositions.map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'ALL' | JobPositionTrack['status'])} className="job-track-skill-tab__select job-track-skill-tab__filter-select">
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng kích hoạt</option>
        </select>
        <select value={sortKey} onChange={e => setSortKey(e.target.value as TrackSortKey)} className="job-track-skill-tab__select job-track-skill-tab__filter-select">
          <option value="code">Sắp xếp theo mã</option>
          <option value="name">Sắp xếp theo tên</option>
          <option value="jobPosition">Sắp xếp theo vị trí</option>
          <option value="targetLevel">Sắp xếp theo level</option>
          <option value="status">Sắp xếp theo trạng thái</option>
        </select>
      </div>

      {/* Create Form */}
      {showTrackForm && (
        <div className="job-track-skill-tab__card job-track-skill-tab__card--highlight">
          <h3 className="job-track-skill-tab__section-title">Tạo track mới</h3>
          <div className="job-track-skill-tab__form-grid job-track-skill-tab__form-grid--job">
            <select value={trackForm.domainId} onChange={e => setTrackForm(p => ({ ...p, domainId: e.target.value ? Number(e.target.value) : '', jobPositionId: '' as number | '' }))} className="job-track-skill-tab__select">
              <option value="">-- Lọc theo domain --</option>
              {domains.filter(d => d.status === 'ACTIVE').map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
            <select value={trackForm.jobPositionId} onChange={e => setTrackForm(p => ({ ...p, jobPositionId: e.target.value ? Number(e.target.value) : '' }))} className="job-track-skill-tab__select">
              <option value="">-- Chọn vị trí công việc * --</option>
              {jobPositions.filter(jp => jp.status === 'ACTIVE' && (!trackForm.domainId || jp.domainId === Number(trackForm.domainId))).map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
            </select>
            <input placeholder="Mã track * (vd: BACKEND_JAVA_SPRING)" value={trackForm.code} onChange={e => setTrackForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="job-track-skill-tab__input" />
            <input placeholder="Tên track * (vd: Backend Java Spring Boot)" value={trackForm.name} onChange={e => setTrackForm(p => ({ ...p, name: e.target.value }))} className="job-track-skill-tab__input" />
            <input placeholder="Mô tả" value={trackForm.description} onChange={e => setTrackForm(p => ({ ...p, description: e.target.value }))} className="job-track-skill-tab__input" />
            <select value={trackForm.targetLevel} onChange={e => setTrackForm(p => ({ ...p, targetLevel: e.target.value }))} className="job-track-skill-tab__select">
              {['INTERNSHIP', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={handleCreateTrack} disabled={trackSubmitting || !trackForm.code || !trackForm.name || !trackForm.jobPositionId} className="job-track-skill-tab__btn job-track-skill-tab__btn--success job-track-skill-tab__btn--wide">
              {trackSubmitting ? '...' : 'Tạo track'}
            </button>
          </div>
        </div>
      )}

      {/* Flat Table */}
      <div className="job-track-skill-tab__card job-track-skill-tab__card--spaced">
        <div className="job-track-skill-tab__table-wrapper job-track-skill-tab__table-wrapper--scroll">
          <table className="job-track-skill-tab__table">
            <thead className="job-track-skill-tab__table-head--sticky">
              <tr>
                <th>Mã</th>
                <th>Tên</th>
                <th>Vị trí công việc</th>
                <th>Level</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map(t => (
                editingTrackId === t.id ? (
                  <tr key={t.id} className="job-track-skill-tab__row--editing">
                    <td><input value={editTrackForm.code} onChange={e => setEditTrackForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="job-track-skill-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--code" autoFocus /></td>
                    <td><input value={editTrackForm.name} onChange={e => setEditTrackForm(p => ({ ...p, name: e.target.value }))} className="job-track-skill-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--name" /></td>
                    <td>
                      <select value={editTrackForm.jobPositionId} onChange={e => setEditTrackForm(p => ({ ...p, jobPositionId: e.target.value ? Number(e.target.value) : '' }))} className="job-track-skill-tab__select admin-roadmap-catalog__inline-input">
                        {jobPositions.filter(jp => jp.status === 'ACTIVE' || jp.id === t.jobPositionId).map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={editTrackForm.targetLevel} onChange={e => setEditTrackForm(p => ({ ...p, targetLevel: e.target.value }))} className="job-track-skill-tab__select admin-roadmap-catalog__inline-input">
                        {['INTERNSHIP', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                    <td><span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                    <td>
                      <div className="admin-roadmap-catalog__actions">
                        <button onClick={(e) => handleEditTrack(t.id, e)} disabled={editTrackSubmitting || !editTrackForm.code || !editTrackForm.name || !editTrackForm.jobPositionId} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">Lưu</button>
                        <button onClick={cancelEditTrack} className="job-track-skill-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr 
                    key={t.id} 
                    className={selectedTrackId === t.id ? 'job-track-skill-tab__table-row--selected' : ''} 
                    onClick={() => setSelectedTrackId(t.id)}
                  >
                    <td>{t.code}</td>
                    <td>{t.name}</td>
                    <td>
                      <div className="job-track-skill-tab__domain-name">{getDomainName(jobPositions.find(j => j.id === t.jobPositionId)?.domainId || 0)}</div>
                      <div>{getJpName(t.jobPositionId)}</div>
                    </td>
                    <td>{t.targetLevel}</td>
                    <td><span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                    <td>
                      <div className="admin-roadmap-catalog__actions">
                        {t.status === 'ACTIVE' && <button onClick={(e) => startEditTrack(t, e)} className="job-track-skill-tab__btn job-track-skill-tab__btn--primary">Sửa</button>}
                        {t.status === 'ACTIVE' && <button onClick={(e) => { e.stopPropagation(); handleDeactivateTrack(t.id, t.name); }} className="job-track-skill-tab__btn job-track-skill-tab__btn--danger">Ngừng kích hoạt</button>}
                        {t.status === 'INACTIVE' && <button onClick={(e) => { e.stopPropagation(); handleReactivateTrack(t.id, t.name); }} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">Kích hoạt lại</button>}
                        {t.status === 'INACTIVE' && <button onClick={(e) => { e.stopPropagation(); handleHardDeleteTrack(t.id, t.name); }} className="job-track-skill-tab__btn admin-roadmap-catalog__btn--delete">Xóa vĩnh viễn</button>}
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {filteredTracks.length === 0 && <tr><td colSpan={6} className="job-track-skill-tab__empty-state">Không có track nào phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
        {!selectedTrackId && tracks.length > 0 && (
          <p className="job-track-skill-tab__selection-hint">
            Chọn một track trong bảng để quản lý kỹ năng.
          </p>
        )}
      </div>

      {/* Track skills Detail Section */}
      {selectedTrackId && (
        <div className="job-track-skill-tab__card job-track-skill-tab__card--highlight">
          <h3 className="job-track-skill-tab__section-title job-track-skill-tab__section-title--spaced">
            Kỹ năng trong track: <span className="job-track-skill-tab__selected-track-name">{tracks.find(t => t.id === selectedTrackId)?.name}</span>
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
                placeholder="-- Chọn kỹ năng để thêm --"
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
              <label className="job-track-skill-tab__label">Trọng số (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={addWeight}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v)) setAddWeight(Math.max(1, Math.min(10, v)));
                }}
                className="job-track-skill-tab__input"
                style={{ width: '80px', padding: '0.5rem' }}
                title="Trọng số (1-10) quyết định tỷ lệ câu hỏi trong bài quiz đánh giá. Giá trị cao = nhiều câu hỏi hơn."
              />
            </div>
            <button
              onClick={handleAddSkillToTrack}
              disabled={!addSkillId || addSkillSubmitting || trackSkillsSaveState === 'saving'}
              className="job-track-skill-tab__btn job-track-skill-tab__btn--success job-track-skill-tab__btn--add"
            >
              {addSkillSubmitting ? '...' : '+ Thêm'}
            </button>
          </div>

          {/* Track skills table */}
          <table className="job-track-skill-tab__table">
            <thead>
              <tr>
                <th>Tên kỹ năng</th>
                <th>Khóa chuẩn</th>
                <th>Yêu cầu</th>
                <th>Trọng số (1-10)</th>
                <th>Thứ tự gợi ý</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {trackSkills.map((ts, idx) => {
                const skill = allSkills.find(s => s.id === ts.skillId);
                const isEditing = editingSkillMappingId === ts.skillId;
                return (
                  <tr key={ts.skillId}>
                    <td>{skill?.name || `Kỹ năng ID: ${ts.skillId}`}</td>
                    <td><code className="job-track-skill-tab__table-cell-code">{skill?.canonicalKey || 'N/A'}</code></td>
                    <td>
                      {isEditing ? (
                        <select value={editMappingForm.requirementType} onChange={e => setEditMappingForm(p => ({ ...p, requirementType: e.target.value }))} className="job-track-skill-tab__select admin-roadmap-catalog__inline-input">
                          <option value="REQUIRED">REQUIRED</option><option value="OPTIONAL">OPTIONAL</option><option value="RECOMMENDED">RECOMMENDED</option>
                        </select>
                      ) : ts.requirementType}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={editMappingForm.weight}
                          onChange={e => {
                            const v = parseInt(e.target.value);
                            if (!isNaN(v)) setEditMappingForm(p => ({ ...p, weight: Math.max(1, Math.min(10, v)) }));
                          }}
                          className="job-track-skill-tab__input admin-roadmap-catalog__inline-input"
                          style={{ width: '70px', padding: '0.25rem' }}
                          title="Trọng số (1-10)"
                        />
                      ) : (ts.weight ?? 1)}
                    </td>
                    <td>
                      <div className="job-track-skill-tab__order-controls">
                        <button onClick={() => moveSkill(ts.skillId, 'up')} disabled={idx === 0 || trackSkillsSaveState === 'saving'} title="Đưa lên">▲</button>
                        <span>{ts.sortOrder}</span>
                        <button onClick={() => moveSkill(ts.skillId, 'down')} disabled={idx === trackSkills.length - 1 || trackSkillsSaveState === 'saving'} title="Đưa xuống">▼</button>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="admin-roadmap-catalog__actions">
                          <button onClick={() => saveEditMapping(ts.skillId)} disabled={trackSkillsSaveState === 'saving'} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">Lưu</button>
                          <button onClick={cancelEditMapping} className="job-track-skill-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
                        </div>
                      ) : (
                        <div className="admin-roadmap-catalog__actions">
                          <button onClick={() => startEditMapping(ts)} className="job-track-skill-tab__btn job-track-skill-tab__btn--primary">Sửa</button>
                          <button onClick={() => removeSkillFromTrack(ts.skillId)} className="job-track-skill-tab__btn job-track-skill-tab__btn--danger">Xóa</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {trackSkills.length === 0 && <tr><td colSpan={6} className="job-track-skill-tab__empty-state">Chưa có kỹ năng nào được gán. Thêm kỹ năng và đặt trọng số (1-10) để phân bổ câu hỏi quiz.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JobPositionTrackSkillTab;
