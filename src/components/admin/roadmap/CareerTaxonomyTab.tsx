import React, { useEffect, useState } from 'react';
import { careerTaxonomyService } from '../../../services/careerTaxonomyService';
import { Domain, JobPosition } from '../../../types/careerTaxonomy';
import { normalizeTaxonomyCode } from '../../../utils/taxonomyNormalize';
import './CareerTaxonomyTab.css';

const CareerTaxonomyTab: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError('Không tải được taxonomy data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateDomain = async () => {
    if (!domainForm.code.trim() || !domainForm.name.trim()) return;
    setDomainSubmitting(true); setError(null);
    try {
      await careerTaxonomyService.createDomain({ code: domainForm.code.trim(), name: domainForm.name.trim(), description: domainForm.description.trim() || undefined });
      setDomainForm({ code: '', name: '', description: '' }); setShowDomainForm(false);
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('DOMAIN_CODE_EXISTS') ? `Code "${domainForm.code}" đã tồn tại.` : 'Tạo domain thất bại: ' + msg);
    } finally { setDomainSubmitting(false); }
  };

  const handleCreateJobPosition = async () => {
    if (!jpForm.code.trim() || !jpForm.name.trim() || !jpForm.domainId) return;
    setJpSubmitting(true); setError(null);
    try {
      await careerTaxonomyService.createJobPosition({ code: jpForm.code.trim(), name: jpForm.name.trim(), description: jpForm.description.trim() || undefined, domainId: Number(jpForm.domainId) });
      setJpForm({ code: '', name: '', description: '', domainId: '' }); setShowJpForm(false);
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('JOB_POSITION_CODE_EXISTS') ? `Code "${jpForm.code}" đã tồn tại.` : msg.includes('INACTIVE') ? 'Domain đó đang INACTIVE.' : 'Tạo job position thất bại: ' + msg);
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
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('DOMAIN_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Code "${editDomainForm.code}" đã tồn tại.` : 'Update domain thất bại: ' + msg);
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
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('JOB_POSITION_CODE_EXISTS') || msg.includes('DUPLICATE') ? `Code "${editJpForm.code}" đã tồn tại.` : msg.includes('INACTIVE') ? 'Domain chuyển sang đang INACTIVE.' : 'Update job position thất bại: ' + msg);
    } finally { setEditJpSubmitting(false); }
  };

  const handleDeactivateDomain = async (id: number, name: string) => {
    if (!window.confirm(`Deactivate domain "${name}"?`)) return;
    setError(null);
    try { await careerTaxonomyService.deactivateDomain(id); await fetchData(); }
    catch (e: any) { setError('Deactivate thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  const handleDeactivateJp = async (id: number, name: string) => {
    if (!window.confirm(`Deactivate job position "${name}"?`)) return;
    setError(null);
    try { await careerTaxonomyService.deactivateJobPosition(id); await fetchData(); }
    catch (e: any) { setError('Deactivate thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  const handleReactivateDomain = async (id: number, name: string) => {
    if (!window.confirm(`Reactivate domain "${name}"?`)) return;
    setError(null);
    try { await careerTaxonomyService.reactivateDomain(id); await fetchData(); }
    catch (e: any) { setError('Reactivate thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  const handleHardDeleteDomain = async (id: number, name: string) => {
    if (!window.confirm(`Xóa vĩnh viễn domain "${name}"? Hành động này không thể hoàn tác.`)) return;
    setError(null);
    try { await careerTaxonomyService.hardDeleteDomain(id); await fetchData(); }
    catch (e: any) { setError('Delete thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  const handleReactivateJp = async (id: number, name: string) => {
    if (!window.confirm(`Reactivate job position "${name}"?`)) return;
    setError(null);
    try { await careerTaxonomyService.reactivateJobPosition(id); await fetchData(); }
    catch (e: any) { setError('Reactivate thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  const handleHardDeleteJp = async (id: number, name: string) => {
    if (!window.confirm(`Xóa vĩnh viễn job position "${name}"? Hành động này không thể hoàn tác.`)) return;
    setError(null);
    try { await careerTaxonomyService.hardDeleteJobPosition(id); await fetchData(); }
    catch (e: any) { setError('Delete thất bại: ' + (e?.response?.data?.message || e?.message)); }
  };

  return (
    <div className="admin-tab-content career-taxonomy-tab">
      <div className="career-taxonomy-tab__header">
        <h2 className="career-taxonomy-tab__title">Career Taxonomy</h2>
        <p>Quản lý Domain và Job Position</p>
      </div>

      {error && <div className="career-taxonomy-tab__error">{error}</div>}

      {/* Domains */}
      <div className="career-taxonomy-tab__card" style={{ marginBottom: 20 }}>
        <div className="career-taxonomy-tab__section-header">
          <h3 className="career-taxonomy-tab__section-title">Domains</h3>
          <button onClick={() => setShowDomainForm(f => !f)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--primary">
            {showDomainForm ? '✕ Hủy' : '+ Domain'}
          </button>
        </div>
        {showDomainForm && (
          <div className="career-taxonomy-tab__form-grid career-taxonomy-tab__form-grid--domain">
            <input placeholder="Mã Code * (vd: SE, DATA, QA, BA, DEVOPS)" value={domainForm.code} onChange={e => setDomainForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="career-taxonomy-tab__input" />
            <input placeholder="Tên hiển thị * (vd: Software Engineering, Data, Quality Assurance)" value={domainForm.name} onChange={e => setDomainForm(p => ({ ...p, name: e.target.value }))} className="career-taxonomy-tab__input" />
            <input placeholder="Mô tả ngắn gọn (không bắt buộc)" value={domainForm.description} onChange={e => setDomainForm(p => ({ ...p, description: e.target.value }))} className="career-taxonomy-tab__input" />
            <button onClick={handleCreateDomain} disabled={domainSubmitting || !domainForm.code || !domainForm.name} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">
              {domainSubmitting ? '...' : 'Tạo'}
            </button>
          </div>
        )}
        {loading ? <p>Loading...</p> : (
          <table className="career-taxonomy-tab__table">
            <thead><tr><th>Code</th><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {domains.map(d => (
                editingDomainId === d.id ? (
                  <tr key={d.id}>
                    <td><input value={editDomainForm.code} onChange={e => setEditDomainForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="career-taxonomy-tab__input" style={{ margin: 0, minWidth: '80px' }} autoFocus /></td>
                    <td><input value={editDomainForm.name} onChange={e => setEditDomainForm(p => ({ ...p, name: e.target.value }))} className="career-taxonomy-tab__input" style={{ margin: 0, minWidth: '150px' }} /></td>
                    <td><input value={editDomainForm.description} onChange={e => setEditDomainForm(p => ({ ...p, description: e.target.value }))} className="career-taxonomy-tab__input" style={{ margin: 0, minWidth: '200px' }} /></td>
                    <td><span className={`status-badge ${d.status.toLowerCase()}`}>{d.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEditDomain(d.id)} disabled={editDomainSubmitting || !editDomainForm.code || !editDomainForm.name} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">Lưu</button>
                        <button onClick={cancelEditDomain} className="career-taxonomy-tab__btn" style={{ backgroundColor: '#6b7280', color: 'white', border: 'none' }}>Hủy</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={d.id}>
                    <td>{d.code}</td><td>{d.name}</td>
                    <td className="career-taxonomy-tab__table-cell-desc" title={d.description}>{d.description || '—'}</td>
                    <td><span className={`status-badge ${d.status.toLowerCase()}`}>{d.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {d.status === 'ACTIVE' && <button onClick={() => startEditDomain(d)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--primary">Edit</button>}
                        {d.status === 'ACTIVE' && <button onClick={() => handleDeactivateDomain(d.id, d.name)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--danger">Deactivate</button>}
                        {d.status === 'INACTIVE' && <button onClick={() => handleReactivateDomain(d.id, d.name)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">Reactivate</button>}
                        {d.status === 'INACTIVE' && <button onClick={() => handleHardDeleteDomain(d.id, d.name)} className="career-taxonomy-tab__btn" style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}>Hard Delete</button>}
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {domains.length === 0 && <tr><td colSpan={5} className="career-taxonomy-tab__empty-state">No domains yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Job Positions */}
      <div className="career-taxonomy-tab__card">
        <div className="career-taxonomy-tab__section-header">
          <h3 className="career-taxonomy-tab__section-title">Job Positions</h3>
          <button onClick={() => setShowJpForm(f => !f)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--primary">
            {showJpForm ? '✕ Hủy' : '+ Job Position'}
          </button>
        </div>
        {showJpForm && (
          <div className="career-taxonomy-tab__form-grid career-taxonomy-tab__form-grid--job">
            <input placeholder="Mã Code * (vd: BACKEND_DEV, FRONTEND_DEV, QA_ENGINEER, BUSINESS_ANALYST)" value={jpForm.code} onChange={e => setJpForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="career-taxonomy-tab__input" />
            <input placeholder="Tên hiển thị * (vd: Backend Developer, QA Engineer, Business Analyst)" value={jpForm.name} onChange={e => setJpForm(p => ({ ...p, name: e.target.value }))} className="career-taxonomy-tab__input" />
            <input placeholder="Mô tả ngắn gọn (không bắt buộc)" value={jpForm.description} onChange={e => setJpForm(p => ({ ...p, description: e.target.value }))} className="career-taxonomy-tab__input" />
            <select value={jpForm.domainId} onChange={e => setJpForm(p => ({ ...p, domainId: e.target.value }))} className="career-taxonomy-tab__select">
              <option value="">-- Chọn Domain * --</option>
              {domains.filter(d => d.status === 'ACTIVE').map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
            <button onClick={handleCreateJobPosition} disabled={jpSubmitting || !jpForm.code || !jpForm.name || !jpForm.domainId} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">
              {jpSubmitting ? '...' : 'Tạo'}
            </button>
          </div>
        )}
        {loading ? <p>Loading...</p> : (
          <table className="career-taxonomy-tab__table">
            <thead><tr><th>Code</th><th>Name</th><th>Domain</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {jobPositions.map(jp => (
                editingJpId === jp.id ? (
                  <tr key={jp.id}>
                    <td><input value={editJpForm.code} onChange={e => setEditJpForm(p => ({ ...p, code: normalizeTaxonomyCode(e.target.value) }))} className="career-taxonomy-tab__input" style={{ margin: 0, minWidth: '80px' }} autoFocus /></td>
                    <td><input value={editJpForm.name} onChange={e => setEditJpForm(p => ({ ...p, name: e.target.value }))} className="career-taxonomy-tab__input" style={{ margin: 0, minWidth: '150px' }} /></td>
                    <td>
                      <select value={editJpForm.domainId} onChange={e => setEditJpForm(p => ({ ...p, domainId: e.target.value }))} className="career-taxonomy-tab__select" style={{ margin: 0 }}>
                        {domains.filter(d => d.status === 'ACTIVE' || d.id === jp.domainId).map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                      </select>
                    </td>
                    <td><input value={editJpForm.description} onChange={e => setEditJpForm(p => ({ ...p, description: e.target.value }))} className="career-taxonomy-tab__input" style={{ margin: 0, minWidth: '200px' }} /></td>
                    <td><span className={`status-badge ${jp.status.toLowerCase()}`}>{jp.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEditJp(jp.id)} disabled={editJpSubmitting || !editJpForm.code || !editJpForm.name || !editJpForm.domainId} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">Lưu</button>
                        <button onClick={cancelEditJp} className="career-taxonomy-tab__btn" style={{ backgroundColor: '#6b7280', color: 'white', border: 'none' }}>Hủy</button>
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
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {jp.status === 'ACTIVE' && <button onClick={() => startEditJp(jp)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--primary">Edit</button>}
                        {jp.status === 'ACTIVE' && <button onClick={() => handleDeactivateJp(jp.id, jp.name)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--danger">Deactivate</button>}
                        {jp.status === 'INACTIVE' && <button onClick={() => handleReactivateJp(jp.id, jp.name)} className="career-taxonomy-tab__btn career-taxonomy-tab__btn--success">Reactivate</button>}
                        {jp.status === 'INACTIVE' && <button onClick={() => handleHardDeleteJp(jp.id, jp.name)} className="career-taxonomy-tab__btn" style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}>Hard Delete</button>}
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {jobPositions.length === 0 && <tr><td colSpan={6} className="career-taxonomy-tab__empty-state">No job positions yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CareerTaxonomyTab;
