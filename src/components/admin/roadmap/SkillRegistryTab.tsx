import React, { useEffect, useMemo, useState } from 'react';
import { confirmAction } from '../../../context/ConfirmDialogContext';
import { showAppError, showAppSuccess } from '../../../context/ToastContext';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { Skill } from '../../../types/skillRegistry';
import './SkillRegistryTab.css';

type SkillSortKey = 'id' | 'name' | 'canonicalKey' | 'status';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Skill['status']>('ALL');
  const [sortKey, setSortKey] = useState<SkillSortKey>('id');

  const fetchSkills = async () => {
    try {
      setError(null);
      const data = await adminSkillRegistryService.getActiveSkills();
      setSkills(data);
    } catch {
      const message = 'Không tải được danh sách kỹ năng.';
      setError(message);
      showAppError('Tải dữ liệu thất bại', message);
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
      showAppSuccess('Đã tạo kỹ năng', 'Kỹ năng mới đã được thêm vào kho chuẩn.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('SKILL_ALREADY_EXISTS') || msg.includes('DUPLICATE') ? `Kỹ năng này đã tồn tại hoặc trùng khóa chuẩn.` : 'Tạo kỹ năng thất bại: ' + msg;
      setError(message);
      showAppError('Tạo kỹ năng thất bại', message);
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
      showAppSuccess('Đã cập nhật kỹ năng', 'Thông tin kỹ năng đã được lưu.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('SKILL_ALREADY_EXISTS') || msg.includes('DUPLICATE') ? `Kỹ năng này đã tồn tại hoặc trùng khóa chuẩn.` : 'Cập nhật kỹ năng thất bại: ' + msg;
      setError(message);
      showAppError('Cập nhật thất bại', message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!(await confirmAction({
      title: 'Ngừng kích hoạt kỹ năng',
      message: `Ngừng kích hoạt kỹ năng "${name}"?`,
      confirmLabel: 'Ngừng kích hoạt',
      variant: 'danger',
    }))) return;
    setError(null);
    try {
      await adminSkillRegistryService.deactivateSkill(id);
      await fetchSkills();
      showAppSuccess('Đã ngừng kích hoạt', `"${name}" đã được cập nhật.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('SKILL_IS_MAPPED_TO_TRACK') ? `Không thể ngừng kích hoạt "${name}": kỹ năng đang được gán vào track.` : 'Ngừng kích hoạt thất bại: ' + msg;
      setError(message);
      showAppError('Thao tác thất bại', message);
    }
  };

  const handleReactivate = async (id: number, name: string) => {
    if (!(await confirmAction({
      title: 'Kích hoạt lại kỹ năng',
      message: `Kích hoạt lại kỹ năng "${name}"?`,
      confirmLabel: 'Kích hoạt lại',
      variant: 'primary',
    }))) return;
    setError(null);
    try {
      await adminSkillRegistryService.reactivateSkill(id);
      await fetchSkills();
      showAppSuccess('Đã kích hoạt lại', `"${name}" đã hoạt động trở lại.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = 'Kích hoạt lại thất bại: ' + msg;
      setError(message);
      showAppError('Thao tác thất bại', message);
    }
  };

  const handleHardDelete = async (id: number, name: string) => {
    if (!(await confirmAction({
      title: 'Xóa vĩnh viễn kỹ năng',
      message: `Xóa vĩnh viễn kỹ năng "${name}"? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa vĩnh viễn',
      variant: 'danger',
    }))) return;
    setError(null);
    try {
      await adminSkillRegistryService.hardDeleteSkill(id);
      await fetchSkills();
      showAppSuccess('Đã xóa kỹ năng', `"${name}" đã được xóa vĩnh viễn.`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('SKILL_IS_MAPPED_TO_TRACK') ? `Không thể xóa vĩnh viễn "${name}": kỹ năng đang được gán vào track.` : 'Xóa thất bại: ' + msg;
      setError(message);
      showAppError('Xóa thất bại', message);
    }
  };

  const filteredSkills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return skills
      .filter((skill) => {
        const matchesQuery =
          !query ||
          skill.name.toLowerCase().includes(query) ||
          skill.canonicalKey.toLowerCase().includes(query) ||
          (skill.description || '').toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'ALL' || skill.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortKey === 'id') return a.id - b.id;
        return String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''), 'vi');
      });
  }, [skills, searchQuery, statusFilter, sortKey]);

  return (
    <div className="admin-tab-content skill-registry-tab">
      <div className="admin-tab-header skill-registry-tab__header">
        <div>
          <h2 className="skill-registry-tab__title">Kho kỹ năng</h2>
          <p>Quản lý danh sách kỹ năng chuẩn của hệ thống</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="skill-registry-tab__btn skill-registry-tab__btn--primary"
        >
          {showForm ? '✕ Hủy' : '+ Tạo kỹ năng'}
        </button>
      </div>

      {error && <div className="skill-registry-tab__error">{error}</div>}

      <div className="admin-roadmap-catalog__toolbar">
        <input
          className="skill-registry-tab__input admin-roadmap-catalog__toolbar-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm tên, khóa chuẩn hoặc mô tả..."
        />
        <select className="skill-registry-tab__input admin-roadmap-catalog__toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | Skill['status'])}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Ngừng kích hoạt</option>
        </select>
        <select className="skill-registry-tab__input admin-roadmap-catalog__toolbar-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SkillSortKey)}>
          <option value="id">Sắp xếp theo ID</option>
          <option value="name">Sắp xếp theo tên</option>
          <option value="canonicalKey">Sắp xếp theo khóa chuẩn</option>
          <option value="status">Sắp xếp theo trạng thái</option>
        </select>
      </div>

      {showForm && (
        <div className="skill-registry-tab__card skill-registry-tab__form-container">
          <h3 className="skill-registry-tab__form-title">Tạo kỹ năng mới</h3>
          <div className="skill-registry-tab__form">
            <input placeholder="Tên kỹ năng *" value={formName} onChange={e => setFormName(e.target.value)} className="skill-registry-tab__input" />
            <input placeholder="Mô tả (tuỳ chọn)" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="skill-registry-tab__input" />
            <button onClick={handleCreate} disabled={submitting || !formName.trim()} className="skill-registry-tab__btn skill-registry-tab__btn--success">
              {submitting ? 'Đang tạo...' : 'Tạo'}
            </button>
          </div>
        </div>
      )}

      <div className="skill-registry-tab__card">
        {loading ? <p>Đang tải...</p> : (
          <table className="skill-registry-tab__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Khóa chuẩn</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSkills.map(skill => (
                editingSkillId === skill.id ? (
                  <tr key={skill.id}>
                    <td>{skill.id}</td>
                    <td><input value={editFormName} onChange={e => setEditFormName(e.target.value)} className="skill-registry-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--name" autoFocus /></td>
                    <td><code className="skill-registry-tab__table-cell-code">{skill.canonicalKey}</code></td>
                    <td><input value={editFormDesc} onChange={e => setEditFormDesc(e.target.value)} className="skill-registry-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--description" /></td>
                    <td><span className={`status-badge ${skill.status.toLowerCase()}`}>{skill.status}</span></td>
                    <td>
                      <div className="admin-roadmap-catalog__actions">
                        <button onClick={() => handleEdit(skill.id)} disabled={editSubmitting || !editFormName.trim()} className="skill-registry-tab__btn skill-registry-tab__btn--success">Lưu</button>
                        <button onClick={cancelEdit} className="skill-registry-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
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
                      <div className="admin-roadmap-catalog__actions">
                        {skill.status === 'ACTIVE' && <button onClick={() => startEdit(skill)} className="skill-registry-tab__btn skill-registry-tab__btn--primary">Sửa</button>}
                        {skill.status === 'ACTIVE' && <button onClick={() => handleDeactivate(skill.id, skill.name)} className="skill-registry-tab__btn skill-registry-tab__btn--danger">
                          Ngừng kích hoạt
                        </button>}
                        {skill.status === 'INACTIVE' && <button onClick={() => handleReactivate(skill.id, skill.name)} className="skill-registry-tab__btn skill-registry-tab__btn--success">
                          Kích hoạt lại
                        </button>}
                        {skill.status === 'INACTIVE' && <button onClick={() => handleHardDelete(skill.id, skill.name)} className="skill-registry-tab__btn admin-roadmap-catalog__btn--delete">
                          Xóa vĩnh viễn
                        </button>}
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {filteredSkills.length === 0 && <tr><td colSpan={6} className="skill-registry-tab__empty-state">Không có kỹ năng phù hợp.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SkillRegistryTab;
