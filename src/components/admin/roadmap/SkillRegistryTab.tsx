import React, { useEffect, useState } from 'react';
import { confirmAction } from '../../../context/ConfirmDialogContext';
import { showAppError, showAppSuccess } from '../../../context/ToastContext';
import Pagination from '../../shared/Pagination';
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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const extractSkillErrorMessage = (error: any, fallback: string) => {
    const payload = error?.response?.data;
    const code = String(payload?.code || '');
    const rawMessage = String(payload?.message || error?.message || '').trim();
    const detailText = payload?.details
      ? Object.entries(payload.details as Record<string, unknown>)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join('; ')
      : '';
    const combined = [code, rawMessage, detailText].filter(Boolean).join(' ');

    if (combined.includes('SKILL_ALREADY_EXISTS')) {
      return 'Không thể tạo kỹ năng: kỹ năng này đã tồn tại trong hệ thống hoặc trùng khóa chuẩn.';
    }
    if (combined.includes('SKILL_NAME_REQUIRED')) {
      return 'Tên kỹ năng là bắt buộc.';
    }
    if (combined.includes('CANNOT_UPDATE_NON_ACTIVE_SKILL')) {
      return 'Chỉ có thể sửa kỹ năng đang hoạt động.';
    }
    if (combined.includes('SKILL_HAS_CHILDREN')) {
      return 'Không thể thao tác vì kỹ năng này đang có kỹ năng con.';
    }
    if (combined.includes('SKILL_IS_MAPPED_TO_TRACK')) {
      return 'Không thể thao tác vì kỹ năng đang được gán vào track nghề nghiệp.';
    }
    if (combined.includes('DUPLICATE')) {
      return 'Không thể lưu vì dữ liệu bị trùng.';
    }

    return rawMessage ? `${fallback}: ${rawMessage}` : fallback;
  };

  const getCanonicalKey = (skill: Skill) =>
    skill.canonicalKey ||
    skill.name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .toUpperCase();

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminSkillRegistryService.getSkills({
        page,
        size: pageSize,
        q: searchQuery.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sort: `${sortKey},asc`,
      });
      setSkills(data.items);
      setTotal(data.total);
    } catch (e: any) {
      const message = extractSkillErrorMessage(e, 'Không tải được danh sách kỹ năng.');
      setError(message);
      showAppError('Tải dữ liệu thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSkills(); }, [page, pageSize, searchQuery, statusFilter, sortKey]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, sortKey, pageSize]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminSkillRegistryService.createSkill({ name: formName.trim(), description: formDesc.trim() || undefined });
      setFormName(''); setFormDesc(''); setShowForm(false);
      setPage(0);
      await fetchSkills();
      showAppSuccess('Đã tạo kỹ năng', 'Kỹ năng mới đã được thêm vào kho chuẩn.');
    } catch (e: any) {
      const message = extractSkillErrorMessage(e, 'Tạo kỹ năng thất bại');
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
      const message = extractSkillErrorMessage(e, 'Cập nhật kỹ năng thất bại');
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
      const message = extractSkillErrorMessage(e, `Ngừng kích hoạt "${name}" thất bại`);
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
      const message = extractSkillErrorMessage(e, 'Kích hoạt lại thất bại');
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
      const message = extractSkillErrorMessage(e, `Xóa "${name}" thất bại`);
      setError(message);
      showAppError('Xóa thất bại', message);
    }
  };

  const startItem = total === 0 ? 0 : page * pageSize + 1;
  const endItem = Math.min(total, (page + 1) * pageSize);

  return (
    <div className="admin-tab-content skill-registry-tab">
      <div className="admin-tab-header skill-registry-tab__header">
        <div>
          <h2 className="skill-registry-tab__title">Kho kỹ năng</h2>
          <p>Quản lý danh sách kỹ năng chuẩn của hệ thống</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="skill-registry-tab__btn skill-registry-tab__btn--primary"
        >
          + Tạo kỹ năng
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
        <select className="skill-registry-tab__input admin-roadmap-catalog__toolbar-select" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={10}>10 dòng / trang</option>
          <option value={20}>20 dòng / trang</option>
          <option value={50}>50 dòng / trang</option>
        </select>
      </div>

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
              {skills.map(skill => (
                editingSkillId === skill.id ? (
                  <tr key={skill.id}>
                    <td>{skill.id}</td>
                    <td><input value={editFormName} onChange={e => setEditFormName(e.target.value)} className="skill-registry-tab__input admin-roadmap-catalog__inline-input admin-roadmap-catalog__inline-input--name" autoFocus /></td>
                    <td><code className="skill-registry-tab__table-cell-code">{getCanonicalKey(skill)}</code></td>
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
                    <td><code className="skill-registry-tab__table-cell-code">{getCanonicalKey(skill)}</code></td>
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
              {skills.length === 0 && <tr><td colSpan={6} className="skill-registry-tab__empty-state">Không có kỹ năng phù hợp.</td></tr>}
            </tbody>
          </table>
        )}
        {!loading && (
          <div className="skill-registry-tab__pagination">
            <span>
              Hiển thị {startItem}-{endItem} / {total} kỹ năng
            </span>
            <Pagination
              totalItems={total}
              itemsPerPage={pageSize}
              currentPage={page + 1}
              onPageChange={(nextPage) => setPage(Math.max(0, nextPage - 1))}
            />
          </div>
        )}
      </div>

      {showForm && (
        <div className="admin-roadmap-catalog__modal-overlay" role="dialog" aria-modal="true" aria-labelledby="skill-create-title" onMouseDown={() => setShowForm(false)}>
          <div className="admin-roadmap-catalog__modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="admin-roadmap-catalog__modal-header">
              <div>
                <h3 id="skill-create-title">Tạo kỹ năng mới</h3>
                <p>Thêm kỹ năng chuẩn vào kho dùng chung cho roadmap và khóa học.</p>
              </div>
              <button type="button" className="admin-roadmap-catalog__modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="admin-roadmap-catalog__modal-body admin-roadmap-catalog__modal-body--single">
              <label className="admin-roadmap-catalog__modal-field" htmlFor="skill-create-name">
                <span>Tên kỹ năng *</span>
                <input id="skill-create-name" placeholder="VD: Java Spring Boot" value={formName} onChange={e => setFormName(e.target.value)} className="skill-registry-tab__input" autoFocus />
              </label>
              <label className="admin-roadmap-catalog__modal-field" htmlFor="skill-create-description">
                <span>Mô tả</span>
                <input id="skill-create-description" placeholder="Mô tả ngắn về kỹ năng" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="skill-registry-tab__input" />
              </label>
            </div>
            <div className="admin-roadmap-catalog__modal-actions">
              <button type="button" onClick={() => setShowForm(false)} className="skill-registry-tab__btn admin-roadmap-catalog__btn--neutral">Hủy</button>
              <button onClick={handleCreate} disabled={submitting || !formName.trim()} className="skill-registry-tab__btn skill-registry-tab__btn--success">
                {submitting ? 'Đang tạo...' : 'Tạo kỹ năng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillRegistryTab;
