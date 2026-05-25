import React, { useEffect, useState, useMemo } from 'react';
import { careerTaxonomyService } from '../../../services/careerTaxonomyService';
import { roadmapTemplateService } from '../../../services/roadmapTemplateService';
import { Domain, JobPosition, JobPositionTrack, JobPositionTrackSkill, RequirementType } from '../../../types/careerTaxonomy';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { Skill } from '../../../types/skillRegistry';
import { normalizeTaxonomyCode } from '../../../utils/taxonomyNormalize';
import { confirmAction } from '../../../context/ConfirmDialogContext';
import { showAppError, showAppSuccess } from '../../../context/ToastContext';
import Pagination from '../../shared/Pagination';
import './JobPositionTrackSkillTab.css';

type TrackSortKey = 'code' | 'name' | 'jobPosition' | 'status';

export function LocalSearchSelect({ 
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
  const [trackPage, setTrackPage] = useState(0);
  const trackPageSize = 8;

  // Skill Filters
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [skillReqTypeFilter, setSkillReqTypeFilter] = useState<'ALL' | RequirementType>('ALL');
  const [skillWeightFilter, setSkillWeightFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [skillSortKey, setSkillSortKey] = useState<'order' | 'name' | 'requirementType' | 'weight'>('order');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create track form
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [trackForm, setTrackForm] = useState({ 
    domainId: '' as number | '',
    jobPositionId: '' as number | '',
    code: '', 
    name: '', 
    description: ''
  });
  const [trackSubmitting, setTrackSubmitting] = useState(false);

  // Edit track state
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null);
  const [editTrackForm, setEditTrackForm] = useState({ code: '', name: '', description: '', jobPositionId: '' as number | '' });
  const [editTrackSubmitting, setEditTrackSubmitting] = useState(false);

  // Add skill to track
  const [addSkillId, setAddSkillId] = useState('');
  const [addRequirementType, setAddRequirementType] = useState<JobPositionTrackSkill['requirementType']>('REQUIRED');
  const [addWeight, setAddWeight] = useState<number>(1);
  const [addSkillSubmitting, setAddSkillSubmitting] = useState(false);

  // Edit mapped skill state
  const [editingSkillMappingId, setEditingSkillMappingId] = useState<number | null>(null);
  const [editMappingForm, setEditMappingForm] = useState<{ requirementType: RequirementType; weight: number }>({ requirementType: 'REQUIRED', weight: 1 });
  const [trackSkillsSaveState, setTrackSkillsSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveStateTimerRef = React.useRef<number | null>(null);

  const requirementSummary = useMemo(() => {
    const initial: Record<RequirementType, number> = {
      REQUIRED: 0,
      IMPORTANT: 0,
      NICE_TO_HAVE: 0,
    };
    return trackSkills.reduce((acc, item) => {
      const type = item.requirementType === 'REQUIRED' || item.requirementType === 'IMPORTANT'
        ? item.requirementType
        : 'NICE_TO_HAVE';
      acc[type] += 1;
      return acc;
    }, initial);
  }, [trackSkills]);

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

  const paginatedTracks = useMemo(() => {
    const start = trackPage * trackPageSize;
    return filteredTracks.slice(start, start + trackPageSize);
  }, [filteredTracks, trackPage]);

  const selectedTrack = useMemo(
    () => tracks.find(t => t.id === selectedTrackId) || null,
    [tracks, selectedTrackId]
  );

  const selectedJobPosition = useMemo(
    () => selectedTrack ? jobPositions.find(jp => jp.id === selectedTrack.jobPositionId) || null : null,
    [jobPositions, selectedTrack]
  );

  const selectedDomain = useMemo(
    () => selectedJobPosition ? domains.find(d => d.id === selectedJobPosition.domainId) || null : null,
    [domains, selectedJobPosition]
  );

  const untrackedJobPositions = useMemo(() => {
    const trackedJobPositionIds = new Set(tracks.map(t => t.jobPositionId));
    return jobPositions
      .filter(jp => jp.status === 'ACTIVE' && !trackedJobPositionIds.has(jp.id))
      .filter(jp => {
        if (filterDomainId && jp.domainId !== Number(filterDomainId)) return false;
        if (filterJpId && jp.id !== Number(filterJpId)) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const domain = domains.find(d => d.id === jp.domainId);
          return [jp.name, jp.code, jp.description, domain?.name].some(value => (value || '').toLowerCase().includes(q));
        }
        return true;
      });
  }, [domains, filterDomainId, filterJpId, jobPositions, searchQuery, tracks]);

  const openCreateTrackForJobPosition = (jobPosition: JobPosition) => {
    const domain = domains.find(d => d.id === jobPosition.domainId);
    setTrackForm({
      domainId: jobPosition.domainId,
      jobPositionId: jobPosition.id,
      code: normalizeTaxonomyCode(`${domain?.code || 'TRACK'}_${jobPosition.code}`),
      name: `${jobPosition.name}`,
      description: jobPosition.description || '',
    });
    setShowTrackForm(true);
  };

  useEffect(() => {
    setTrackPage(0);
  }, [filterDomainId, filterJpId, filterStatus, searchQuery, sortKey]);

  useEffect(() => {
    if (filteredTracks.length === 0) {
      if (selectedTrackId !== null) setSelectedTrackId(null);
      return;
    }

    if (!selectedTrackId || !filteredTracks.some(t => t.id === selectedTrackId)) {
      setSelectedTrackId(filteredTracks[0].id);
    }
  }, [filteredTracks, selectedTrackId]);

  const filteredTrackSkills = useMemo(() => {
    return trackSkills.filter(ts => {
      if (skillReqTypeFilter !== 'ALL' && ts.requirementType !== skillReqTypeFilter) return false;
      
      if (skillWeightFilter !== 'ALL') {
        const w = ts.weight ?? 1;
        if (skillWeightFilter === 'HIGH' && w < 8) return false;
        if (skillWeightFilter === 'MEDIUM' && (w < 4 || w > 7)) return false;
        if (skillWeightFilter === 'LOW' && w > 3) return false;
      }

      if (skillSearchQuery) {
        const q = skillSearchQuery.toLowerCase();
        const skill = allSkills.find(s => s.id === ts.skillId);
        if (!skill) return false;
        return skill.name.toLowerCase().includes(q) || skill.canonicalKey.toLowerCase().includes(q);
      }

      return true;
    }).sort((a, b) => {
      if (skillSortKey === 'order') return a.sortOrder - b.sortOrder;
      if (skillSortKey === 'weight') return (b.weight ?? 1) - (a.weight ?? 1);
      if (skillSortKey === 'requirementType') return a.requirementType.localeCompare(b.requirementType);
      if (skillSortKey === 'name') {
        const nameA = allSkills.find(s => s.id === a.skillId)?.name || '';
        const nameB = allSkills.find(s => s.id === b.skillId)?.name || '';
        return nameA.localeCompare(nameB, 'vi');
      }
      return 0;
    });
  }, [trackSkills, skillReqTypeFilter, skillWeightFilter, skillSearchQuery, skillSortKey, allSkills]);

  const handleCreateTrack = async () => {
    if (!trackForm.name || !trackForm.jobPositionId) return;
    setTrackSubmitting(true); setError(null);
    const code = trackForm.code.trim() || normalizeTaxonomyCode(trackForm.name);
    try {
      await careerTaxonomyService.createTrack({ 
        code, 
        name: trackForm.name.trim(), 
        description: trackForm.description.trim() || undefined, 
        jobPositionId: Number(trackForm.jobPositionId)
      });
      setTrackForm({ domainId: '', jobPositionId: '', code: '', name: '', description: '' });
      setShowTrackForm(false);
      await fetchGlobalData();
      showAppSuccess('Đã tạo nhánh chuyên sâu', `Nhánh chuyên sâu "${trackForm.name.trim()}" đã được tạo.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '';
      const message = msg.includes('TRACK_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Mã "${code}" đã tồn tại.` : 'Tạo nhánh chuyên sâu thất bại: ' + msg;
      setError(message);
      showAppError('Tạo nhánh chuyên sâu thất bại', message);
    } finally { setTrackSubmitting(false); }
  };

  const startEditTrack = (t: JobPositionTrack, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingTrackId(t.id);
    setEditTrackForm({ code: t.code, name: t.name, description: t.description || '', jobPositionId: t.jobPositionId });
  };
  
  const cancelEditTrack = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingTrackId(null);
  };

  const handleEditTrack = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!editTrackForm.code || !editTrackForm.name || !editTrackForm.jobPositionId) return;
    setEditTrackSubmitting(true); setError(null);
    try {
      await careerTaxonomyService.updateTrack(id, { 
        code: editTrackForm.code.trim(), 
        name: editTrackForm.name.trim(), 
        description: editTrackForm.description.trim() || undefined, 
        jobPositionId: Number(editTrackForm.jobPositionId)
      });
      setEditingTrackId(null);
      await fetchGlobalData();
      showAppSuccess('Đã cập nhật nhánh chuyên sâu', `Nhánh chuyên sâu "${editTrackForm.name.trim()}" đã được lưu.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '';
      const message = msg.includes('TRACK_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Mã "${editTrackForm.code}" đã tồn tại.` : 'Cập nhật nhánh chuyên sâu thất bại: ' + msg;
      setError(message);
      showAppError('Cập nhật nhánh chuyên sâu thất bại', message);
    } finally { setEditTrackSubmitting(false); }
  };

  const handleDeactivateTrack = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Ngừng kích hoạt nhánh chuyên sâu', message: `Ngừng kích hoạt nhánh chuyên sâu "${name}"?`, confirmLabel: 'Ngừng kích hoạt', variant: 'danger' }))) return;
    setError(null);
    try {
      await careerTaxonomyService.deactivateTrack(id);
      await fetchGlobalData();
      if (selectedTrackId === id) setSelectedTrackId(null);
      showAppSuccess('Đã ngừng kích hoạt', `Nhánh chuyên sâu "${name}" đã được cập nhật.`);
    } catch (e: any) { const message = 'Ngừng kích hoạt thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Ngừng kích hoạt thất bại', message); }
  };

  const handleReactivateTrack = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Kích hoạt lại nhánh chuyên sâu', message: `Kích hoạt lại nhánh chuyên sâu "${name}"?`, confirmLabel: 'Kích hoạt lại', variant: 'primary' }))) return;
    setError(null);
    try {
      await careerTaxonomyService.reactivateTrack(id);
      await fetchGlobalData();
      showAppSuccess('Đã kích hoạt lại', `Nhánh chuyên sâu "${name}" đã hoạt động lại.`);
    } catch (e: any) { const message = 'Kích hoạt lại thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Kích hoạt lại thất bại', message); }
  };

  const handleHardDeleteTrack = async (id: number, name: string) => {
    setError(null);
    try {
      const dependentTemplates = await roadmapTemplateService.listAdminTemplates({ jobPositionTrackId: id });
      if (dependentTemplates && dependentTemplates.length > 0) {
        const templateNames = dependentTemplates.map(t => `"${t.title}"`).join(', ');
        await confirmAction({
          title: 'Không thể xóa nhánh chuyên sâu',
          message: `Không thể xóa nhánh chuyên sâu "${name}" vì đang có ${dependentTemplates.length} mẫu lộ trình liên kết: [ ${templateNames} ]. Vui lòng gỡ hoặc xóa các mẫu lộ trình này trước.`,
          confirmLabel: 'Đã hiểu',
          variant: 'primary'
        });
        return;
      }

      if (!(await confirmAction({ title: 'Xóa vĩnh viễn nhánh chuyên sâu', message: `Xóa vĩnh viễn nhánh chuyên sâu "${name}"? Hành động này sẽ xóa cả mapping kỹ năng và không thể hoàn tác.`, confirmLabel: 'Xóa vĩnh viễn', variant: 'danger' }))) return;
      await careerTaxonomyService.hardDeleteTrack(id);
      await fetchGlobalData();
      if (selectedTrackId === id) setSelectedTrackId(null);
      showAppSuccess('Đã xóa nhánh chuyên sâu', `Nhánh chuyên sâu "${name}" đã được xóa.`);
    } catch (e: any) {
      const message = 'Xóa thất bại: ' + (e?.response?.data?.message || e?.message);
      setError(message);
      showAppError('Xóa nhánh chuyên sâu thất bại', message);
    }
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
          <h2 className="job-track-skill-tab__title">Nhánh chuyên môn & Kỹ năng yêu cầu</h2>
          <p>Chọn một nhánh chuyên môn để xem chi tiết, sửa thông tin và gắn bộ kỹ năng cần thiết cho vị trí nghề nghiệp.</p>
        </div>
        <button 
          onClick={() => setShowTrackForm(true)} 
          className="job-track-skill-tab__btn job-track-skill-tab__btn--primary"
        >
          + Tạo nhánh chuyên sâu
        </button>
      </div>

      {error && <div className="job-track-skill-tab__error">{error}</div>}

      {/* Filter Bar */}
      <div className="job-track-skill-tab__card job-track-skill-tab__filter-bar">
        <input 
          placeholder="Tìm mã hoặc tên nhánh chuyên sâu..." 
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
          <option value="status">Sắp xếp theo trạng thái</option>
        </select>
      </div>

      <div className="job-track-skill-tab__workspace">
        <section className="job-track-skill-tab__card job-track-skill-tab__list-panel">
          <div className="job-track-skill-tab__panel-heading">
            <div>
              <h3>Danh sách nhánh chuyên sâu</h3>
              <p>{filteredTracks.length} nhánh phù hợp bộ lọc</p>
            </div>
          </div>
          <div className="job-track-skill-tab__track-list">
            {paginatedTracks.map(t => (
              <button
                key={t.id}
                type="button"
                className={`job-track-skill-tab__track-card ${selectedTrackId === t.id ? 'job-track-skill-tab__track-card--selected' : ''}`}
                onClick={() => setSelectedTrackId(t.id)}
              >
                <span className="job-track-skill-tab__track-card-title">{t.name}</span>
                <code className="job-track-skill-tab__table-cell-code">{t.code}</code>
                <span className="job-track-skill-tab__track-card-meta">
                  {getDomainName(jobPositions.find(j => j.id === t.jobPositionId)?.domainId || 0)}
                </span>
                <span className="job-track-skill-tab__track-card-meta">
                  {getJpName(t.jobPositionId)}
                </span>
                <span className="job-track-skill-tab__track-card-footer">
                  <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span>
                </span>
              </button>
            ))}
            {filteredTracks.length === 0 && (
              <div className="job-track-skill-tab__empty-state">Không có nhánh chuyên sâu nào phù hợp.</div>
            )}
          </div>
          {untrackedJobPositions.length > 0 && (
            <div className="job-track-skill-tab__untracked">
              <div className="job-track-skill-tab__untracked-title">Vị trí chưa phân nhánh</div>
              {untrackedJobPositions.slice(0, 8).map(jp => (
                <button
                   key={jp.id}
                  type="button"
                  className="job-track-skill-tab__untracked-card"
                  onClick={() => openCreateTrackForJobPosition(jp)}
                >
                  <span>
                    <strong>{jp.name}</strong>
                    <small>{getDomainName(jp.domainId)} / {jp.code}</small>
                  </span>
                  <em>Phân nhánh</em>
                </button>
              ))}
            </div>
          )}
          {filteredTracks.length > trackPageSize && (
            <div className="job-track-skill-tab__pagination">
              <Pagination
                totalItems={filteredTracks.length}
                itemsPerPage={trackPageSize}
                currentPage={trackPage + 1}
                onPageChange={(nextPage) => setTrackPage(Math.max(0, nextPage - 1))}
              />
            </div>
          )}
        </section>

        <section className="job-track-skill-tab__card job-track-skill-tab__detail-panel">
          {!selectedTrack ? (
            <div className="job-track-skill-tab__empty-detail">
              Chọn một nhánh chuyên môn ở danh sách bên trái để xem chi tiết và quản lý kỹ năng yêu cầu.
            </div>
          ) : (
            <>
              <div className="job-track-skill-tab__detail-header">
                <div>
                  <h3>{selectedTrack.name}</h3>
                  <code className="job-track-skill-tab__table-cell-code">{selectedTrack.code}</code>
                </div>
                <div className="admin-roadmap-catalog__actions">
                  {editingTrackId === selectedTrack.id ? (
                    <>
                      <button onClick={() => handleEditTrack(selectedTrack.id)} disabled={editTrackSubmitting || !editTrackForm.code || !editTrackForm.name || !editTrackForm.jobPositionId} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">Lưu thông tin</button>
                      <button onClick={() => cancelEditTrack()} className="job-track-skill-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditTrack(selectedTrack)} className="job-track-skill-tab__btn job-track-skill-tab__btn--primary">Sửa thông tin nhánh</button>
                      {selectedTrack.status === 'ACTIVE' && <button onClick={() => handleDeactivateTrack(selectedTrack.id, selectedTrack.name)} className="job-track-skill-tab__btn job-track-skill-tab__btn--danger">Ngừng kích hoạt</button>}
                      {selectedTrack.status === 'INACTIVE' && <button onClick={() => handleReactivateTrack(selectedTrack.id, selectedTrack.name)} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">Kích hoạt lại</button>}
                      {selectedTrack.status === 'INACTIVE' && <button onClick={() => handleHardDeleteTrack(selectedTrack.id, selectedTrack.name)} className="job-track-skill-tab__btn admin-roadmap-catalog__btn--delete">Xóa vĩnh viễn</button>}
                    </>
                  )}
                </div>
              </div>

              {editingTrackId === selectedTrack.id ? (
                <div className="job-track-skill-tab__edit-panel">
                  <label className="job-track-skill-tab__field">
                    <span>Mã nhánh chuyên sâu *</span>
                    <input value={editTrackForm.code} onChange={e => setEditTrackForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="job-track-skill-tab__input" autoFocus />
                  </label>
                  <label className="job-track-skill-tab__field">
                    <span>Tên nhánh chuyên sâu *</span>
                    <input value={editTrackForm.name} onChange={e => setEditTrackForm(p => ({ ...p, name: e.target.value }))} className="job-track-skill-tab__input" />
                  </label>
                  <label className="job-track-skill-tab__field">
                    <span>Vị trí công việc *</span>
                    <select value={editTrackForm.jobPositionId} onChange={e => setEditTrackForm(p => ({ ...p, jobPositionId: e.target.value ? Number(e.target.value) : '' }))} className="job-track-skill-tab__select">
                      {jobPositions.filter(jp => jp.status === 'ACTIVE' || jp.id === selectedTrack.jobPositionId).map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
                    </select>
                  </label>
                  <label className="job-track-skill-tab__field job-track-skill-tab__field--full">
                    <span>Mô tả</span>
                    <input value={editTrackForm.description} onChange={e => setEditTrackForm(p => ({ ...p, description: e.target.value }))} className="job-track-skill-tab__input" placeholder="Mô tả ngắn gọn, không bắt buộc" />
                  </label>
                </div>
              ) : (
                <div className="job-track-skill-tab__detail-grid">
                  <div><span>Domain</span><strong>{selectedDomain?.name || 'Không rõ'}</strong></div>
                  <div><span>Vị trí công việc</span><strong>{selectedJobPosition?.name || 'Không rõ'}</strong></div>
                  <div><span>Trạng thái</span><strong>{selectedTrack.status}</strong></div>
                  <div className="job-track-skill-tab__detail-grid-full"><span>Mô tả</span><strong>{selectedTrack.description || 'Chưa có mô tả'}</strong></div>
                </div>
              )}

              <div className="job-track-skill-tab__mapping-header">
                <div>
                  <h3>Kỹ năng yêu cầu cho nhánh chuyên sâu</h3>
                  <p>Thêm, gỡ, chỉnh mức độ yêu cầu và thứ tự gợi ý cho nhánh này.</p>
                </div>
                <div className={`job-track-skill-tab__save-state job-track-skill-tab__save-state--${trackSkillsSaveState}`}>
                  {trackSkillsSaveState === 'saving' && 'Đang lưu thay đổi...'}
                  {trackSkillsSaveState === 'saved' && 'Đã lưu xong.'}
                </div>
              </div>

              <div className="job-track-skill-tab__summary">
                <span className="job-track-skill-tab__summary-chip"><small>Tổng kỹ năng</small><strong>{trackSkills.length}</strong></span>
                <span className="job-track-skill-tab__summary-chip"><small>Bắt buộc</small><strong>{requirementSummary.REQUIRED}</strong></span>
                <span className="job-track-skill-tab__summary-chip"><small>Quan trọng</small><strong>{requirementSummary.IMPORTANT}</strong></span>
                <span className="job-track-skill-tab__summary-chip"><small>Nên có</small><strong>{requirementSummary.NICE_TO_HAVE}</strong></span>
                {trackSkills.length > 0 && requirementSummary.REQUIRED === 0 && (
                  <strong>Nhánh chưa có skill bắt buộc.</strong>
                )}
              </div>

          <div className="job-track-skill-tab__skill-filter-neon">
            <input 
              placeholder="Tìm tên hoặc mã kỹ năng..." 
              value={skillSearchQuery} 
              onChange={e => setSkillSearchQuery(e.target.value)} 
              className="job-track-skill-tab__input job-track-skill-tab__input--neon" 
            />
            <select 
              value={skillReqTypeFilter} 
              onChange={e => setSkillReqTypeFilter(e.target.value as any)} 
              className="job-track-skill-tab__select job-track-skill-tab__select--neon"
            >
              <option value="ALL">Tất cả yêu cầu</option>
              <option value="REQUIRED">Bắt buộc (REQUIRED)</option>
              <option value="IMPORTANT">Quan trọng (IMPORTANT)</option>
              <option value="NICE_TO_HAVE">Nên có (NICE_TO_HAVE)</option>
            </select>
            <select 
              value={skillWeightFilter} 
              onChange={e => setSkillWeightFilter(e.target.value as any)} 
              className="job-track-skill-tab__select job-track-skill-tab__select--neon"
            >
              <option value="ALL">Tất cả trọng số</option>
              <option value="HIGH">Cao (8-10)</option>
              <option value="MEDIUM">Trung bình (4-7)</option>
              <option value="LOW">Thấp (1-3)</option>
            </select>
            <select 
              value={skillSortKey} 
              onChange={e => setSkillSortKey(e.target.value as any)} 
              className="job-track-skill-tab__select job-track-skill-tab__select--neon"
            >
              <option value="order">Sắp xếp theo thứ tự gợi ý</option>
              <option value="name">Sắp xếp theo tên kỹ năng</option>
              <option value="requirementType">Sắp xếp theo yêu cầu</option>
              <option value="weight">Sắp xếp theo trọng số (Giảm dần)</option>
            </select>
          </div>

          {/* Add skill row */}
          <div className="job-track-skill-tab__add-skill-bar">
            <div className="job-track-skill-tab__add-skill-select">
              <label className="job-track-skill-tab__label">Kỹ năng</label>
              <LocalSearchSelect
                options={allSkills.filter(sk => !trackSkills.some(ts => ts.skillId === sk.id)).map(sk => ({ id: sk.id, label: `${sk.name} (${sk.canonicalKey})` }))}
                value={addSkillId ? parseInt(addSkillId, 10) : ''}
                onChange={val => setAddSkillId(val.toString())}
                placeholder="Chọn kỹ năng để thêm"
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
                <option value="IMPORTANT">Quan trọng (IMPORTANT)</option>
                <option value="NICE_TO_HAVE">Nên có (NICE_TO_HAVE)</option>
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
                className="job-track-skill-tab__input job-track-skill-tab__weight-input"
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
          <div className="job-track-skill-tab__table-wrapper job-track-skill-tab__mapping-table-wrapper">
            <table className="job-track-skill-tab__table job-track-skill-tab__mapping-table">
              <thead>
                <tr>
                  <th>Tên kỹ năng</th>
                  <th>Khóa chuẩn</th>
                  <th>Yêu cầu</th>
                  <th>Trọng số</th>
                  <th>Thứ tự</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
              {filteredTrackSkills.map((ts, idx) => {
                const skill = allSkills.find(s => s.id === ts.skillId);
                const isEditing = editingSkillMappingId === ts.skillId;
                const originalIdx = trackSkills.findIndex(o => o.skillId === ts.skillId);
                return (
                  <tr key={ts.skillId} className="job-track-skill-tab__neon-row">
                    <td><span className="job-track-skill-tab__neon-text">{skill?.name || `Kỹ năng ID: ${ts.skillId}`}</span></td>
                    <td><code className="job-track-skill-tab__table-cell-code job-track-skill-tab__table-cell-code--neon">{skill?.canonicalKey || 'N/A'}</code></td>
                    <td>
                      {isEditing ? (
                        <select value={editMappingForm.requirementType} onChange={e => setEditMappingForm(p => ({ ...p, requirementType: e.target.value as RequirementType }))} className="job-track-skill-tab__select admin-roadmap-catalog__inline-input job-track-skill-tab__select--neon">
                          <option value="REQUIRED">Bắt buộc</option><option value="IMPORTANT">Quan trọng</option><option value="NICE_TO_HAVE">Nên có</option>
                        </select>
                      ) : (
                        <span className={`job-track-skill-tab__neon-badge job-track-skill-tab__neon-badge--${ts.requirementType.toLowerCase()}`}>
                          {ts.requirementType}
                        </span>
                      )}
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
                          className="job-track-skill-tab__input admin-roadmap-catalog__inline-input job-track-skill-tab__input--neon job-track-skill-tab__weight-input job-track-skill-tab__weight-input--compact"
                          title="Trọng số (1-10)"
                        />
                      ) : (
                        <span className="job-track-skill-tab__neon-weight">
                          {ts.weight ?? 1}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="job-track-skill-tab__order-controls">
                        <button onClick={() => moveSkill(ts.skillId, 'up')} disabled={originalIdx <= 0 || trackSkillsSaveState === 'saving' || skillSortKey !== 'order'} title={skillSortKey === 'order' ? 'Đưa lên' : 'Vui lòng chọn Sắp xếp theo gợi ý để đổi thứ tự'}>▲</button>
                        <span className="job-track-skill-tab__neon-order">{ts.sortOrder}</span>
                        <button onClick={() => moveSkill(ts.skillId, 'down')} disabled={originalIdx >= trackSkills.length - 1 || trackSkillsSaveState === 'saving' || skillSortKey !== 'order'} title={skillSortKey === 'order' ? 'Đưa xuống' : 'Vui lòng chọn Sắp xếp theo gợi ý để đổi thứ tự'}>▼</button>
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="admin-roadmap-catalog__actions">
                          <button onClick={() => saveEditMapping(ts.skillId)} disabled={trackSkillsSaveState === 'saving'} className="job-track-skill-tab__btn job-track-skill-tab__btn--success job-track-skill-tab__btn--neon">Lưu</button>
                          <button onClick={cancelEditMapping} className="job-track-skill-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
                        </div>
                      ) : (
                        <div className="admin-roadmap-catalog__actions">
                          <button onClick={() => startEditMapping(ts)} className="job-track-skill-tab__btn job-track-skill-tab__btn--primary job-track-skill-tab__btn--neon">Sửa</button>
                          <button onClick={() => removeSkillFromTrack(ts.skillId)} className="job-track-skill-tab__btn job-track-skill-tab__btn--danger job-track-skill-tab__btn--neon-danger">Xóa</button>
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
            </>
          )}
        </section>
      </div>

      {showTrackForm && (
        <div className="admin-roadmap-catalog__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="track-create-title" onMouseDown={() => setShowTrackForm(false)}>
          <div className="admin-roadmap-catalog__modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="admin-roadmap-catalog__modal-header">
              <div>
                <h3 id="track-create-title">Tạo nhánh chuyên sâu mới</h3>
                <p>Nhánh chuyên sâu liên kết vị trí công việc với lộ trình kỹ năng cần học.</p>
              </div>
              <button type="button" className="admin-roadmap-catalog__modal-close" onClick={() => setShowTrackForm(false)}>✕</button>
            </div>
            <div className="admin-roadmap-catalog__modal-body">
              <label className="admin-roadmap-catalog__modal-field" htmlFor="track-create-domain">
                <span>Domain nghề nghiệp</span>
                <select id="track-create-domain" value={trackForm.domainId} onChange={e => setTrackForm(p => ({ ...p, domainId: e.target.value ? Number(e.target.value) : '', jobPositionId: '' as number | '' }))} className="job-track-skill-tab__select" autoFocus>
                  <option value="">Tất cả domain</option>
                  {domains.filter(d => d.status === 'ACTIVE').map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </label>
              <label className="admin-roadmap-catalog__modal-field" htmlFor="track-create-job-position">
                <span>Vị trí công việc *</span>
                <select id="track-create-job-position" value={trackForm.jobPositionId} onChange={e => setTrackForm(p => ({ ...p, jobPositionId: e.target.value ? Number(e.target.value) : '' }))} className="job-track-skill-tab__select">
                  <option value="">Chọn vị trí công việc</option>
                  {jobPositions.filter(jp => jp.status === 'ACTIVE' && (!trackForm.domainId || jp.domainId === Number(trackForm.domainId))).map(jp => <option key={jp.id} value={jp.id}>{jp.name}</option>)}
                </select>
              </label>
              <label className="admin-roadmap-catalog__modal-field admin-roadmap-catalog__modal-field--full" htmlFor="track-create-name">
                <span>Tên nhánh chuyên sâu *</span>
                <input
                  id="track-create-name"
                  placeholder="VD: Backend Java Spring Boot"
                  value={trackForm.name}
                  onChange={e => setTrackForm(p => ({ ...p, name: e.target.value }))}
                  className="job-track-skill-tab__input"
                  maxLength={255}
                />
              </label>

              <label className="admin-roadmap-catalog__modal-field admin-roadmap-catalog__modal-field--full" htmlFor="track-create-description">
                <span>Mô tả</span>
                <input id="track-create-description" placeholder="Mô tả ngắn gọn, không bắt buộc" value={trackForm.description} onChange={e => setTrackForm(p => ({ ...p, description: e.target.value }))} className="job-track-skill-tab__input" />
              </label>
            </div>
            <div className="admin-roadmap-catalog__modal-actions">
              <button type="button" onClick={() => setShowTrackForm(false)} className="job-track-skill-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
              <button onClick={handleCreateTrack} disabled={trackSubmitting || !trackForm.name.trim() || !trackForm.jobPositionId} className="job-track-skill-tab__btn job-track-skill-tab__btn--success">
                {trackSubmitting ? 'Đang tạo...' : 'Tạo nhánh chuyên sâu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPositionTrackSkillTab;
