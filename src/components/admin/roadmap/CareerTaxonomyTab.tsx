import React, { useEffect, useMemo, useState } from 'react';
import { careerTaxonomyService } from '../../../services/careerTaxonomyService';
import { roadmapTemplateService } from '../../../services/roadmapTemplateService';
import { Domain, JobPosition } from '../../../types/careerTaxonomy';
import { confirmAction } from '../../../context/ConfirmDialogContext';
import { showAppError, showAppSuccess } from '../../../context/ToastContext';
import { normalizeTaxonomyCode } from '../../../utils/taxonomyNormalize';
import './CareerTaxonomyTab.css';

type DomainSortKey = 'code' | 'name' | 'status';
type JobPositionSortKey = 'code' | 'name' | 'domain' | 'status';

const CareerTaxonomyTab: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domainSearch, setDomainSearch] = useState('');
  const [domainStatusFilter, setDomainStatusFilter] = useState<'ALL' | Domain['status']>('ALL');
  const [domainSortKey, setDomainSortKey] = useState<DomainSortKey>('code');
  const [jpSearch, setJpSearch] = useState('');
  const [jpStatusFilter, setJpStatusFilter] = useState<'ALL' | JobPosition['status']>('ALL');
  const [jpDomainFilter, setJpDomainFilter] = useState<'ALL' | number>('ALL');
  const [jpSortKey, setJpSortKey] = useState<JobPositionSortKey>('code');

  // Domain form
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [domainForm, setDomainForm] = useState({ code: '', name: '', description: '' });
  const [domainSubmitting, setDomainSubmitting] = useState(false);

  // JobPosition form
  const [showJpForm, setShowJpForm] = useState(false);
  const [jpForm, setJpForm] = useState({ code: '', name: '', description: '', domainId: '' });
  const [jpSubmitting, setJpSubmitting] = useState(false);

  // Edit Domain state
  const [editingDomainId, setEditingDomainId] = useState<number | null>(null);
  const [editDomainForm, setEditDomainForm] = useState({ code: '', name: '', description: '' });
  const [editDomainSubmitting, setEditDomainSubmitting] = useState(false);

  // Edit JobPosition state
  const [editingJpId, setEditingJpId] = useState<number | null>(null);
  const [editJpForm, setEditJpForm] = useState({ code: '', name: '', description: '', domainId: '' });
  const [editJpSubmitting, setEditJpSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const [domainsData, jobsData] = await Promise.all([
        careerTaxonomyService.getDomains(),
        careerTaxonomyService.getJobPositions(),
      ]);
      setDomains(domainsData);
      setJobPositions(jobsData);
    } catch {
      const message = 'Không tải được dữ liệu phân loại nghề nghiệp.';
      setError(message);
      showAppError('Tải taxonomy thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDomains = useMemo(() => {
    const q = domainSearch.trim().toLowerCase();
    return domains
      .filter(d => {
        if (domainStatusFilter !== 'ALL' && d.status !== domainStatusFilter) return false;
        if (!q) return true;
        return [d.code, d.name, d.description].some(value => (value || '').toLowerCase().includes(q));
      })
      .sort((a, b) => (a[domainSortKey] || '').localeCompare(b[domainSortKey] || '', 'vi'));
  }, [domains, domainSearch, domainStatusFilter, domainSortKey]);

  const filteredJobPositions = useMemo(() => {
    const q = jpSearch.trim().toLowerCase();
    return jobPositions
      .filter(jp => {
        const domainName = domains.find(d => d.id === jp.domainId)?.name || '';
        if (jpStatusFilter !== 'ALL' && jp.status !== jpStatusFilter) return false;
        if (jpDomainFilter !== 'ALL' && jp.domainId !== jpDomainFilter) return false;
        if (!q) return true;
        return [jp.code, jp.name, jp.description, domainName].some(value => (value || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (jpSortKey === 'domain') {
          const domainA = domains.find(d => d.id === a.domainId)?.name || '';
          const domainB = domains.find(d => d.id === b.domainId)?.name || '';
          return domainA.localeCompare(domainB, 'vi');
        }
        return (a[jpSortKey] || '').localeCompare(b[jpSortKey] || '', 'vi');
      });
  }, [jobPositions, domains, jpSearch, jpStatusFilter, jpDomainFilter, jpSortKey]);

  const handleCreateDomain = async () => {
    if (!domainForm.name.trim()) return;
    setDomainSubmitting(true); setError(null);
    const code = normalizeTaxonomyCode(domainForm.name);
    try {
      await careerTaxonomyService.createDomain({ code, name: domainForm.name.trim(), description: domainForm.description.trim() || undefined });
      setDomainForm({ code: '', name: '', description: '' }); setShowDomainForm(false);
      await fetchData();
      showAppSuccess('Đã tạo domain', `Domain "${domainForm.name.trim()}" đã được tạo.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('DOMAIN_CODE_EXISTS') ? `Mã "${code}" đã tồn tại.` : 'Tạo domain thất bại: ' + msg;
      setError(message);
      showAppError('Tạo domain thất bại', message);
    } finally { setDomainSubmitting(false); }
  };

  const handleCreateJobPosition = async () => {
    if (!jpForm.name.trim() || !jpForm.domainId) return;
    setJpSubmitting(true); setError(null);
    const code = normalizeTaxonomyCode(jpForm.name);
    try {
      await careerTaxonomyService.createJobPosition({ code, name: jpForm.name.trim(), description: jpForm.description.trim() || undefined, domainId: Number(jpForm.domainId) });
      setJpForm({ code: '', name: '', description: '', domainId: '' }); setShowJpForm(false);
      await fetchData();
      showAppSuccess('Đã tạo vị trí', `Vị trí "${jpForm.name.trim()}" đã được tạo.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('JOB_POSITION_CODE_EXISTS') ? `Mã "${code}" đã tồn tại.` : msg.includes('INACTIVE') ? 'Domain đó đang ngừng kích hoạt.' : 'Tạo vị trí công việc thất bại: ' + msg;
      setError(message);
      showAppError('Tạo vị trí thất bại', message);
    } finally { setJpSubmitting(false); }
  };

  const startEditDomain = (d: Domain) => { setEditingDomainId(d.id); setEditDomainForm({ code: d.code, name: d.name, description: d.description || '' }); };
  const cancelEditDomain = () => { setEditingDomainId(null); };
  const handleEditDomain = async (id: number) => {
    if (!editDomainForm.code.trim() || !editDomainForm.name.trim()) return;
    setEditDomainSubmitting(true); setError(null);
    try {
      await careerTaxonomyService.updateDomain(id, { code: editDomainForm.code.trim(), name: editDomainForm.name.trim(), description: editDomainForm.description.trim() || undefined });
      setEditingDomainId(null);
      await fetchData();
      showAppSuccess('Đã cập nhật domain', `Domain "${editDomainForm.name.trim()}" đã được lưu.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('DOMAIN_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Mã "${editDomainForm.code}" đã tồn tại.` : 'Cập nhật domain thất bại: ' + msg;
      setError(message);
      showAppError('Cập nhật domain thất bại', message);
    } finally { setEditDomainSubmitting(false); }
  };

  const startEditJp = (jp: JobPosition) => { setEditingJpId(jp.id); setEditJpForm({ code: jp.code, name: jp.name, description: jp.description || '', domainId: jp.domainId.toString() }); };
  const cancelEditJp = () => { setEditingJpId(null); };
  const handleEditJp = async (id: number) => {
    if (!editJpForm.code.trim() || !editJpForm.name.trim() || !editJpForm.domainId) return;
    setEditJpSubmitting(true); setError(null);
    try {
      await careerTaxonomyService.updateJobPosition(id, { code: editJpForm.code.trim(), name: editJpForm.name.trim(), description: editJpForm.description.trim() || undefined, domainId: Number(editJpForm.domainId) });
      setEditingJpId(null);
      await fetchData();
      showAppSuccess('Đã cập nhật vị trí', `Vị trí "${editJpForm.name.trim()}" đã được lưu.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('JOB_POSITION_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Mã "${editJpForm.code}" đã tồn tại.` : msg.includes('INACTIVE') ? 'Domain chuyển sang đang ngừng kích hoạt.' : 'Cập nhật vị trí công việc thất bại: ' + msg;
      setError(message);
      showAppError('Cập nhật vị trí thất bại', message);
    } finally { setEditJpSubmitting(false); }
  };

  const handleDeactivateDomain = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Ngừng kích hoạt domain', message: `Ngừng kích hoạt domain "${name}"?`, confirmLabel: 'Ngừng kích hoạt', variant: 'danger' }))) return;
    setError(null);
    try { await careerTaxonomyService.deactivateDomain(id); await fetchData(); showAppSuccess('Đã ngừng kích hoạt', `Domain "${name}" đã được cập nhật.`); }
    catch (e: any) { const message = 'Ngừng kích hoạt thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Ngừng kích hoạt thất bại', message); }
  };

  const handleDeactivateJp = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Ngừng kích hoạt vị trí', message: `Ngừng kích hoạt vị trí công việc "${name}"?`, confirmLabel: 'Ngừng kích hoạt', variant: 'danger' }))) return;
    setError(null);
    try { await careerTaxonomyService.deactivateJobPosition(id); await fetchData(); showAppSuccess('Đã ngừng kích hoạt', `Vị trí "${name}" đã được cập nhật.`); }
    catch (e: any) { const message = 'Ngừng kích hoạt thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Ngừng kích hoạt thất bại', message); }
  };

  const handleReactivateDomain = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Kích hoạt lại domain', message: `Kích hoạt lại domain "${name}"?`, confirmLabel: 'Kích hoạt lại', variant: 'primary' }))) return;
    setError(null);
    try { await careerTaxonomyService.reactivateDomain(id); await fetchData(); showAppSuccess('Đã kích hoạt lại', `Domain "${name}" đã hoạt động lại.`); }
    catch (e: any) { const message = 'Kích hoạt lại thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Kích hoạt lại thất bại', message); }
  };

  const handleHardDeleteDomain = async (id: number, name: string) => {
    setError(null);
    try {
      const dependentJps = await careerTaxonomyService.getJobPositions(id);
      if (dependentJps && dependentJps.length > 0) {
        const jpsNames = dependentJps.map(jp => `"${jp.name}"`).join(', ');
        await confirmAction({
          title: 'Không thể xóa domain',
          message: `Không thể xóa domain "${name}" vì đang có ${dependentJps.length} vị trí công việc thuộc domain này: [ ${jpsNames} ]. Vui lòng xóa các vị trí công việc này trước.`,
          confirmLabel: 'Đã hiểu',
          variant: 'primary'
        });
        return;
      }

      if (!(await confirmAction({ title: 'Xóa vĩnh viễn domain', message: `Xóa vĩnh viễn domain "${name}"? Hành động này không thể hoàn tác.`, confirmLabel: 'Xóa vĩnh viễn', variant: 'danger' }))) return;
      await careerTaxonomyService.hardDeleteDomain(id);
      await fetchData();
      showAppSuccess('Đã xóa domain', `Domain "${name}" đã được xóa.`);
    } catch (e: any) {
      const message = 'Xóa thất bại: ' + (e?.response?.data?.message || e?.message);
      setError(message);
      showAppError('Xóa domain thất bại', message);
    }
  };

  const handleReactivateJp = async (id: number, name: string) => {
    if (!(await confirmAction({ title: 'Kích hoạt lại vị trí', message: `Kích hoạt lại vị trí công việc "${name}"?`, confirmLabel: 'Kích hoạt lại', variant: 'primary' }))) return;
    setError(null);
    try { await careerTaxonomyService.reactivateJobPosition(id); await fetchData(); showAppSuccess('Đã kích hoạt lại', `Vị trí "${name}" đã hoạt động lại.`); }
    catch (e: any) { const message = 'Kích hoạt lại thất bại: ' + (e?.response?.data?.message || e?.message); setError(message); showAppError('Kích hoạt lại thất bại', message); }
  };

  const handleHardDeleteJp = async (id: number, name: string) => {
    setError(null);
    try {
      const [dependentTracks, dependentTemplates] = await Promise.all([
        careerTaxonomyService.getTracks(id),
        roadmapTemplateService.listAdminTemplates({ jobPositionId: id })
      ]);

      if ((dependentTracks && dependentTracks.length > 0) || (dependentTemplates && dependentTemplates.length > 0)) {
        let blockMsg = `Không thể xóa vị trí công việc "${name}" do đang có các liên kết hoạt động:\n`;
        if (dependentTracks && dependentTracks.length > 0) {
          const trackNames = dependentTracks.map(t => `"${t.name}"`).join(', ');
          blockMsg += `• ${dependentTracks.length} track nghề nghiệp: [ ${trackNames} ]\n`;
        }
        if (dependentTemplates && dependentTemplates.length > 0) {
          const templateNames = dependentTemplates.map(t => `"${t.title}"`).join(', ');
          blockMsg += `• ${dependentTemplates.length} mẫu lộ trình: [ ${templateNames} ]\n`;
        }
        blockMsg += `Vui lòng gỡ hoặc xóa các liên kết này trước khi xóa vĩnh viễn vị trí này.`;

        await confirmAction({
          title: 'Không thể xóa vị trí công việc',
          message: blockMsg,
          confirmLabel: 'Đã hiểu',
          variant: 'primary'
        });
        return;
      }

      if (!(await confirmAction({ title: 'Xóa vĩnh viễn vị trí', message: `Xóa vĩnh viễn vị trí công việc "${name}"? Hành động này không thể hoàn tác.`, confirmLabel: 'Xóa vĩnh viễn', variant: 'danger' }))) return;
      await careerTaxonomyService.hardDeleteJobPosition(id);
      await fetchData();
      showAppSuccess('Đã xóa vị trí', `Vị trí "${name}" đã được xóa.`);
    } catch (e: any) {
      const message = 'Xóa thất bại: ' + (e?.response?.data?.message || e?.message);
      setError(message);
      showAppError('Xóa vị trí thất bại', message);
    }
  };

  return (
    <div className="admin-tab-content career-taxonomy-tab">
      <div className="career-taxonomy-tab__header">
        <h2 className="career-taxonomy-tab__title">Phân loại nghề nghiệp</h2>
        <p>Quản lý domain và vị trí công việc</p>
      </div>

      {error && <div className="career-taxonomy-tab__error">{error}</div>}

      {/* Domains */}
      <div className="career-taxonomy-tab__card career-taxonomy-tab__card--spaced">
        <div className="career-taxonomy-tab__section-header">
          <h3 className="career-taxonomy-tab__section-title">Domain nghề nghiệp</h3>
          <button onClick={() => setShowDomainForm(true)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--primary">
            + Domain
          </button>
        </div>
        <div className="admin-roadmap-catalog__toolbar">
          <input
            className="career-taxonomy-tab__input admin-roadmap-catalog__toolbar-search"
            value={domainSearch}
            onChange={(e) => setDomainSearch(e.target.value)}
            placeholder="Tìm mã, tên hoặc mô tả domain..."
          />
          <select className="career-taxonomy-tab__select admin-roadmap-catalog__toolbar-select" value={domainStatusFilter} onChange={(e) => setDomainStatusFilter(e.target.value as 'ALL' | Domain['status'])}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng kích hoạt</option>
          </select>
          <select className="career-taxonomy-tab__select admin-roadmap-catalog__toolbar-select" value={domainSortKey} onChange={(e) => setDomainSortKey(e.target.value as DomainSortKey)}>
            <option value="code">Sắp xếp theo mã</option>
            <option value="name">Sắp xếp theo tên</option>
            <option value="status">Sắp xếp theo trạng thái</option>
          </select>
        </div>
        {loading ? <p>Đang tải...</p> : (
          <table className="career-taxonomy-tab__table">
            <thead><tr><th>Mã</th><th>Tên</th><th>Mô tả</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {filteredDomains.map(d => (
                editingDomainId === d.id ? (
                  <tr key={d.id}>
                    <td><input value={editDomainForm.code} onChange={e => setEditDomainForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="career-taxonomy-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--code" autoFocus /></td>
                    <td><input value={editDomainForm.name} onChange={e => setEditDomainForm(p => ({ ...p, name: e.target.value }))} className="career-taxonomy-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--name" /></td>
                    <td><input value={editDomainForm.description} onChange={e => setEditDomainForm(p => ({ ...p, description: e.target.value }))} className="career-taxonomy-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--description" /></td>
                    <td><span className={`status-badge ${d.status.toLowerCase()}`}>{d.status}</span></td>
                    <td>
                      <div className="admin-roadmap-catalog__actions">
                        <button onClick={() => handleEditDomain(d.id)} disabled={editDomainSubmitting || !editDomainForm.code || !editDomainForm.name} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">Lưu</button>
                        <button onClick={cancelEditDomain} className="career-taxonomy-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={d.id}>
                    <td>{d.code}</td><td>{d.name}</td>
                    <td className="career-taxonomy-tab__table-cell-desc" title={d.description}>{d.description || '—'}</td>
                    <td><span className={`status-badge ${d.status.toLowerCase()}`}>{d.status}</span></td>
                    <td>
                      <div className="admin-roadmap-catalog__actions">
                        {d.status === 'ACTIVE' && <button onClick={() => startEditDomain(d)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--primary">Sửa</button>}
                        {d.status === 'ACTIVE' && <button onClick={() => handleDeactivateDomain(d.id, d.name)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--danger">Ngừng kích hoạt</button>}
                        {d.status === 'INACTIVE' && <button onClick={() => handleReactivateDomain(d.id, d.name)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">Kích hoạt lại</button>}
                        {d.status === 'INACTIVE' && <button onClick={() => handleHardDeleteDomain(d.id, d.name)} className="career-taxonomy-tab__btn admin-roadmap-catalog__btn--delete">Xóa vĩnh viễn</button>}
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {filteredDomains.length === 0 && <tr><td colSpan={5} className="career-taxonomy-tab__empty-state">Không có domain nào phù hợp.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Job Positions */}
      <div className="career-taxonomy-tab__card">
        <div className="career-taxonomy-tab__section-header">
          <h3 className="career-taxonomy-tab__section-title">Vị trí công việc</h3>
          <button onClick={() => setShowJpForm(true)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--primary">
            + Vị trí công việc
          </button>
        </div>
        <div className="admin-roadmap-catalog__toolbar">
          <input
            className="career-taxonomy-tab__input admin-roadmap-catalog__toolbar-search"
            value={jpSearch}
            onChange={(e) => setJpSearch(e.target.value)}
            placeholder="Tìm mã, tên, domain hoặc mô tả vị trí..."
          />
          <select className="career-taxonomy-tab__select admin-roadmap-catalog__toolbar-select" value={jpDomainFilter} onChange={(e) => setJpDomainFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}>
            <option value="ALL">Tất cả domain</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="career-taxonomy-tab__select admin-roadmap-catalog__toolbar-select" value={jpStatusFilter} onChange={(e) => setJpStatusFilter(e.target.value as 'ALL' | JobPosition['status'])}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng kích hoạt</option>
          </select>
          <select className="career-taxonomy-tab__select admin-roadmap-catalog__toolbar-select" value={jpSortKey} onChange={(e) => setJpSortKey(e.target.value as JobPositionSortKey)}>
            <option value="code">Sắp xếp theo mã</option>
            <option value="name">Sắp xếp theo tên</option>
            <option value="domain">Sắp xếp theo domain</option>
            <option value="status">Sắp xếp theo trạng thái</option>
          </select>
        </div>
        {loading ? <p>Đang tải...</p> : (
          <table className="career-taxonomy-tab__table">
            <thead><tr><th>Mã</th><th>Tên</th><th>Domain</th><th>Mô tả</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {filteredJobPositions.map(jp => (
                editingJpId === jp.id ? (
                  <tr key={jp.id}>
                    <td><input value={editJpForm.code} onChange={e => setEditJpForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="career-taxonomy-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--code" autoFocus /></td>
                    <td><input value={editJpForm.name} onChange={e => setEditJpForm(p => ({ ...p, name: e.target.value }))} className="career-taxonomy-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--name" /></td>
                    <td>
                      <select value={editJpForm.domainId} onChange={e => setEditJpForm(p => ({ ...p, domainId: e.target.value }))} className="career-taxonomy-tab__select admin-roadmap-catalog__inline-input">
                        {domains.filter(d => d.status === 'ACTIVE' || d.id === jp.domainId).map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                      </select>
                    </td>
                    <td><input value={editJpForm.description} onChange={e => setEditJpForm(p => ({ ...p, description: e.target.value }))} className="career-taxonomy-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--description" /></td>
                    <td><span className={`status-badge ${jp.status.toLowerCase()}`}>{jp.status}</span></td>
                    <td>
                      <div className="admin-roadmap-catalog__actions">
                        <button onClick={() => handleEditJp(jp.id)} disabled={editJpSubmitting || !editJpForm.code || !editJpForm.name || !editJpForm.domainId} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">Lưu</button>
                        <button onClick={cancelEditJp} className="career-taxonomy-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={jp.id}>
                    <td>{jp.code}</td><td>{jp.name}</td>
                    <td>{domains.find(d => d.id === jp.domainId)?.name ?? jp.domainId}</td>
                    <td className="career-taxonomy-tab__table-cell-desc" title={jp.description}>{jp.description || '—'}</td>
                    <td><span className={`status-badge ${jp.status.toLowerCase()}`}>{jp.status}</span></td>
                    <td>
                      <div className="admin-roadmap-catalog__actions">
                        {jp.status === 'ACTIVE' && <button onClick={() => startEditJp(jp)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--primary">Sửa</button>}
                        {jp.status === 'ACTIVE' && <button onClick={() => handleDeactivateJp(jp.id, jp.name)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--danger">Ngừng kích hoạt</button>}
                        {jp.status === 'INACTIVE' && <button onClick={() => handleReactivateJp(jp.id, jp.name)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">Kích hoạt lại</button>}
                        {jp.status === 'INACTIVE' && <button onClick={() => handleHardDeleteJp(jp.id, jp.name)} className="career-taxonomy-tab__btn admin-roadmap-catalog__btn--delete">Xóa vĩnh viễn</button>}
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {filteredJobPositions.length === 0 && <tr><td colSpan={6} className="career-taxonomy-tab__empty-state">Không có vị trí công việc nào phù hợp.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showDomainForm && (
        <div className="admin-roadmap-catalog__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="domain-create-title" onMouseDown={() => setShowDomainForm(false)}>
          <div className="admin-roadmap-catalog__modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="admin-roadmap-catalog__modal-header">
              <div>
                <h3 id="domain-create-title">Tạo domain nghề nghiệp</h3>
                <p>Domain dùng để nhóm các vị trí công việc và track roadmap.</p>
              </div>
              <button type="button" className="admin-roadmap-catalog__modal-close" onClick={() => setShowDomainForm(false)}>✕</button>
            </div>
            <div className="admin-roadmap-catalog__modal-body">
              <label className="admin-roadmap-catalog__modal-field admin-roadmap-catalog__modal-field--full" htmlFor="domain-create-name">
                <span>Tên hiển thị *</span>
                <input
                  id="domain-create-name"
                  placeholder="VD: Software Engineering"
                  value={domainForm.name}
                  onChange={e => setDomainForm(p => ({ ...p, name: e.target.value }))}
                  className="career-taxonomy-tab__input"
                  maxLength={255}
                  autoFocus
                />
              </label>
              <label className="admin-roadmap-catalog__modal-field admin-roadmap-catalog__modal-field--full" htmlFor="domain-create-description">
                <span>Mô tả</span>
                <input id="domain-create-description" placeholder="Mô tả ngắn gọn, không bắt buộc" value={domainForm.description} onChange={e => setDomainForm(p => ({ ...p, description: e.target.value }))} className="career-taxonomy-tab__input" />
              </label>
            </div>
            <div className="admin-roadmap-catalog__modal-actions">
              <button type="button" onClick={() => setShowDomainForm(false)} className="career-taxonomy-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
              <button onClick={handleCreateDomain} disabled={domainSubmitting || !domainForm.name.trim()} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">
                {domainSubmitting ? 'Đang tạo...' : 'Tạo domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJpForm && (
        <div className="admin-roadmap-catalog__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="job-position-create-title" onMouseDown={() => setShowJpForm(false)}>
          <div className="admin-roadmap-catalog__modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="admin-roadmap-catalog__modal-header">
              <div>
                <h3 id="job-position-create-title">Tạo vị trí công việc</h3>
                <p>Vị trí công việc sẽ được dùng để xây track và mapping kỹ năng.</p>
              </div>
              <button type="button" className="admin-roadmap-catalog__modal-close" onClick={() => setShowJpForm(false)}>✕</button>
            </div>
            <div className="admin-roadmap-catalog__modal-body">
              <label className="admin-roadmap-catalog__modal-field admin-roadmap-catalog__modal-field--full" htmlFor="job-position-create-name">
                <span>Tên hiển thị *</span>
                <input
                  id="job-position-create-name"
                  placeholder="VD: Backend Developer"
                  value={jpForm.name}
                  onChange={e => setJpForm(p => ({ ...p, name: e.target.value }))}
                  className="career-taxonomy-tab__input"
                  maxLength={255}
                  autoFocus
                />
              </label>
              <label className="admin-roadmap-catalog__modal-field admin-roadmap-catalog__modal-field--full" htmlFor="job-position-create-domain">
                <span>Domain nghề nghiệp *</span>
                <select id="job-position-create-domain" value={jpForm.domainId} onChange={e => setJpForm(p => ({ ...p, domainId: e.target.value }))} className="career-taxonomy-tab__select">
                  <option value="">Chọn domain</option>
                  {domains.filter(d => d.status === 'ACTIVE').map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </label>
              <label className="admin-roadmap-catalog__modal-field admin-roadmap-catalog__modal-field--full" htmlFor="job-position-create-description">
                <span>Mô tả</span>
                <input id="job-position-create-description" placeholder="Mô tả ngắn gọn, không bắt buộc" value={jpForm.description} onChange={e => setJpForm(p => ({ ...p, description: e.target.value }))} className="career-taxonomy-tab__input" />
              </label>
            </div>
            <div className="admin-roadmap-catalog__modal-actions">
              <button type="button" onClick={() => setShowJpForm(false)} className="career-taxonomy-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
              <button onClick={handleCreateJobPosition} disabled={jpSubmitting || !jpForm.name.trim() || !jpForm.domainId} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">
                {jpSubmitting ? 'Đang tạo...' : 'Tạo vị trí'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerTaxonomyTab;
