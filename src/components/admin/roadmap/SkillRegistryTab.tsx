import React, { useEffect, useState } from 'react';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { Skill } from '../../../types/skillRegistry';
import './SkillRegistryTab.css';

const SkillRegistryTab: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [editFormName, setEditFormName] = useState('');
  const [editFormDesc, setEditFormDesc] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchSkills = async () => {
    try {
      setError(null);
      const data = await adminSkillRegistryService.getActiveSkills();
      setSkills(data);
    } catch {
      setError('Không tải được danh sách skill.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSkills(); }, []);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminSkillRegistryService.createSkill({ name: formName.trim(), description: formDesc.trim() || undefined });
      setFormName(''); setFormDesc(''); setShowForm(false);
      await fetchSkills();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('SKILL_ALREADY_EXISTS') || msg.includes('DUPLICATE') ? `Skill này đã tồn tại hoặc trùng canonical key.` : 'Tạo skill thất bại: ' + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setEditFormName(skill.name);
    setEditFormDesc(skill.description || '');
  };

  const cancelEdit = () => {
    setEditingSkillId(null);
  };

  const handleEdit = async (id: number) => {
    if (!editFormName.trim()) return;
    setEditSubmitting(true);
    setError(null);
    try {
      await adminSkillRegistryService.updateSkill(id, { name: editFormName.trim(), description: editFormDesc.trim() || undefined });
      setEditingSkillId(null);
      await fetchSkills();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('SKILL_ALREADY_EXISTS') || msg.includes('DUPLICATE') ? `Skill này đã tồn tại hoặc trùng canonical key.` : 'Update skill thất bại: ' + msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!window.confirm(`Deactivate skill "${name}"?`)) return;
    setError(null);
    try {
      await adminSkillRegistryService.deactivateSkill(id);
      await fetchSkills();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('SKILL_IS_MAPPED_TO_TRACK') ? `Không thể deactivate "${name}": đang được map vào track.` : 'Deactivate thất bại: ' + msg);
    }
  };

  const handleReactivate = async (id: number, name: string) => {
    if (!window.confirm(`Reactivate skill "${name}"?`)) return;
    setError(null);
    try {
      await adminSkillRegistryService.reactivateSkill(id);
      await fetchSkills();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError('Reactivate thất bại: ' + msg);
    }
  };

  const handleHardDelete = async (id: number, name: string) => {
    if (!window.confirm(`Xóa vĩnh viễn skill "${name}"? Hành động này không thể hoàn tác.`)) return;
    setError(null);
    try {
      await adminSkillRegistryService.hardDeleteSkill(id);
      await fetchSkills();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('SKILL_IS_MAPPED_TO_TRACK') ? `Không thể xóa vĩnh viễn "${name}": đang được map vào track.` : 'Delete thất bại: ' + msg);
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-tab-header skill-registry-tab__header">
        <div>
          <h2 className="skill-registry-tab__title">Skill Registry</h2>
          <p>Quản lý danh sách kỹ năng chuẩn của hệ thống</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="skill-registry-tab__btn skill-registry-tab__btn--primary"
        >
          {showForm ? '✕ Hủy' : '+ Tạo Skill'}
        </button>
      </div>

      {error && <div className="skill-registry-tab__error">{error}</div>}

      {showForm && (
        <div className="skill-registry-tab__card skill-registry-tab__form-container">
          <h3 className="skill-registry-tab__form-title">Tạo Skill mới</h3>
          <div className="skill-registry-tab__form">
            <input placeholder="Tên skill *" value={formName} onChange={e => setFormName(e.target.value)} className="skill-registry-tab__input" />
            <input placeholder="Mô tả (tuỳ chọn)" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="skill-registry-tab__input" />
            <button onClick={handleCreate} disabled={submitting || !formName.trim()} className="skill-registry-tab__btn skill-registry-tab__btn--success">
              {submitting ? 'Đang tạo...' : 'Tạo'}
            </button>
          </div>
        </div>
      )}

      <div className="skill-registry-tab__card">
        {loading ? <p>Loading...</p> : (
          <table className="skill-registry-tab__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Canonical Key</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(skill => (
                editingSkillId === skill.id ? (
                  <tr key={skill.id}>
                    <td>{skill.id}</td>
                    <td><input value={editFormName} onChange={e => setEditFormName(e.target.value)} className="skill-registry-tab__input" style={{ margin: 0, minWidth: '150px' }} autoFocus /></td>
                    <td><code className="skill-registry-tab__table-cell-code">{skill.canonicalKey}</code></td>
                    <td><input value={editFormDesc} onChange={e => setEditFormDesc(e.target.value)} className="skill-registry-tab__input" style={{ margin: 0, minWidth: '200px' }} /></td>
                    <td><span className={`status-badge ${skill.status.toLowerCase()}`}>{skill.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(skill.id)} disabled={editSubmitting || !editFormName.trim()} className="skill-registry-tab__btn skill-registry-tab__btn--success">Lưu</button>
                        <button onClick={cancelEdit} className="skill-registry-tab__btn" style={{ backgroundColor: '#6b7280', color: 'white', border: 'none' }}>Hủy</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={skill.id}>
                    <td>{skill.id}</td>
                    <td>{skill.name}</td>
                    <td><code className="skill-registry-tab__table-cell-code">{skill.canonicalKey}</code></td>
                    <td className="skill-registry-tab__table-cell-desc" title={skill.description}>{skill.description || '—'}</td>
                    <td><span className={`status-badge ${skill.status.toLowerCase()}`}>{skill.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {skill.status === 'ACTIVE' && <button onClick={() => startEdit(skill)} className="skill-registry-tab__btn skill-registry-tab__btn--primary">Edit</button>}
                        {skill.status === 'ACTIVE' && <button onClick={() => handleDeactivate(skill.id, skill.name)} className="skill-registry-tab__btn skill-registry-tab__btn--danger">
                          Deactivate
                        </button>}
                        {skill.status === 'INACTIVE' && <button onClick={() => handleReactivate(skill.id, skill.name)} className="skill-registry-tab__btn skill-registry-tab__btn--success">
                          Reactivate
                        </button>}
                        {skill.status === 'INACTIVE' && <button onClick={() => handleHardDelete(skill.id, skill.name)} className="skill-registry-tab__btn" style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}>
                          Hard Delete
                        </button>}
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {skills.length === 0 && <tr><td colSpan={6} className="skill-registry-tab__empty-state">No active skills found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SkillRegistryTab;
