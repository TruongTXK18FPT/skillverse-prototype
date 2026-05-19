import React, { useEffect, useMemo, useState, useRef } from 'react';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { SkillSuggestion, Skill } from '../../../types/skillRegistry';
import { confirmAction } from '../../../context/ConfirmDialogContext';
import { showAppError, showAppSuccess, showAppWarning } from '../../../context/ToastContext';
import MentorVerificationAdminTab from '../MentorVerificationAdminTab';
import './SkillSuggestionReviewTab.css';

type SuggestionSortKey = 'id' | 'suggestedName' | 'suggestedCanonicalKey' | 'createdAt';
type SkillReviewSubTab = 'mentor-verifications' | 'platform-suggestions';

const SearchSkillInput: React.FC<{ onSelect: (id: number | null) => void }> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Skill[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setLoading(true);
      setSearchError(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        try {
          const res = await adminSkillRegistryService.suggestSkills(query);
          setResults(res.items || []);
          setIsOpen(true);
        } catch (e) {
          console.error(e);
          setSearchError(true);
          setIsOpen(true);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      setSearchError(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const handleSelect = (skill: Skill) => {
    setQuery(`${skill.name} (ID: ${skill.id})`);
    setIsOpen(false);
    onSelect(skill.id);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSelect(null); // Reset selection if typing again
  };

  return (
    <div className="skill-review-tab__search-container">
      <input
        type="text"
        placeholder="Tìm kỹ năng để gộp..."
        value={query}
        onChange={handleChange}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="skill-review-tab__search-input"
      />
      {loading && <div className="skill-review-tab__search-loading">...</div>}
      
      {isOpen && (results.length > 0 || searchError) && (
        <ul className="skill-review-tab__dropdown">
          {results.map(sk => (
            <li
              key={sk.id}
              onClick={() => handleSelect(sk)}
              className="skill-review-tab__dropdown-item"
            >
              <div className="skill-review-tab__item-name">{sk.name}</div>
              <div className="skill-review-tab__item-meta">{sk.canonicalKey} • ID: {sk.id}</div>
            </li>
          ))}
          {searchError && (
            <li className="skill-review-tab__dropdown-item skill-review-tab__dropdown-item--error">
              Không tải được kỹ năng.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

const SkillSuggestionReviewTab: React.FC = () => {
  const [activeReviewSubTab, setActiveReviewSubTab] = useState<SkillReviewSubTab>('mentor-verifications');
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<Record<number, number | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SkillSuggestion['status']>('ALL');
  const [sortKey, setSortKey] = useState<SuggestionSortKey>('createdAt');

  const fetchSuggestions = async () => {
    try {
      setError(null);
      const data = await adminSkillRegistryService.getPendingSuggestions(0, 50);
      setSuggestions(data.items);
    } catch {
      const message = 'Không tải được danh sách đề xuất.';
      setError(message);
      showAppError('Tải đề xuất thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuggestions(); }, []);

  const remove = (id: number) => setSuggestions(prev => prev.filter(s => s.id !== id));

  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return suggestions
      .filter(s => {
        if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
        if (!q) return true;
        return [
          s.id.toString(),
          s.suggestedName,
          s.suggestedCanonicalKey,
          s.description,
          s.sourceUserId.toString(),
        ].some(value => (value || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortKey === 'id') return a.id - b.id;
        if (sortKey === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (a[sortKey] || '').localeCompare(b[sortKey] || '', 'vi');
      });
  }, [suggestions, searchQuery, statusFilter, sortKey]);

  const handleApprove = async (id: number) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (!(await confirmAction({
      title: 'Duyệt đề xuất kỹ năng',
      message: `Tạo kỹ năng mới từ đề xuất "${suggestion?.suggestedName || id}"?`,
      confirmLabel: 'Duyệt',
      variant: 'primary',
    }))) return;
    setError(null);
    try {
      await adminSkillRegistryService.approveSuggestion(id);
      remove(id);
      showAppSuccess('Đã duyệt đề xuất', 'Kỹ năng mới đã được tạo từ đề xuất.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('SKILL_ALREADY_EXISTS') ? 'Kỹ năng đã tồn tại, hãy dùng Gộp thay vì Duyệt.' : 'Duyệt thất bại: ' + msg;
      setError(message);
      showAppError('Duyệt thất bại', message);
    }
  };

  const handleMerge = async (id: number) => {
    const matchedSkillId = mergeTargetId[id];
    if (!matchedSkillId) {
      const message = 'Vui lòng chọn một kỹ năng hợp lệ từ danh sách để gộp.';
      setError(message);
      showAppWarning('Thiếu kỹ năng để gộp', message);
      return;
    }
    const suggestion = suggestions.find(s => s.id === id);
    if (!(await confirmAction({
      title: 'Gộp đề xuất',
      message: `Gộp "${suggestion?.suggestedName || id}" vào kỹ năng ID ${matchedSkillId}?`,
      confirmLabel: 'Gộp',
      variant: 'primary',
    }))) return;
    setError(null);
    try {
      await adminSkillRegistryService.mergeSuggestion(id, matchedSkillId);
      remove(id);
      showAppSuccess('Đã gộp đề xuất', 'Đề xuất đã được gộp vào kỹ năng hiện có.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const message = msg.includes('TARGET_SKILL_NOT_ACTIVE') ? `Kỹ năng ID ${matchedSkillId} không ở trạng thái hoạt động.` : 'Gộp thất bại: ' + msg;
      setError(message);
      showAppError('Gộp thất bại', message);
    }
  };

  const handleReject = async (id: number) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (!(await confirmAction({
      title: 'Từ chối đề xuất',
      message: `Từ chối đề xuất "${suggestion?.suggestedName || id}"?`,
      confirmLabel: 'Từ chối',
      variant: 'danger',
    }))) return;
    setError(null);
    try {
      await adminSkillRegistryService.rejectSuggestion(id, 'Admin từ chối');
      remove(id);
      showAppSuccess('Đã từ chối đề xuất', 'Đề xuất đã được đánh dấu từ chối.');
    } catch (e: any) {
      const message = 'Từ chối thất bại: ' + (e?.response?.data?.message || e?.message);
      setError(message);
      showAppError('Từ chối thất bại', message);
    }
  };

  return (
    <div className="admin-tab-content skill-review-tab">
      <div className="admin-tab-header">
        <h2>Kiểm duyệt kỹ năng</h2>
        <p>Duyệt xác thực kỹ năng của mentor và đề xuất thêm kỹ năng mới cho nền tảng</p>
      </div>

      <div className="skill-review-tab__subtabs" role="tablist" aria-label="Luồng kiểm duyệt kỹ năng">
        <button
          type="button"
          role="tab"
          aria-selected={activeReviewSubTab === 'mentor-verifications'}
          className={`skill-review-tab__subtab ${activeReviewSubTab === 'mentor-verifications' ? 'skill-review-tab__subtab--active' : ''}`}
          onClick={() => setActiveReviewSubTab('mentor-verifications')}
        >
          <strong>Xác thực kỹ năng mentor</strong>
          <span>Duyệt hồ sơ chứng minh năng lực</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeReviewSubTab === 'platform-suggestions'}
          className={`skill-review-tab__subtab ${activeReviewSubTab === 'platform-suggestions' ? 'skill-review-tab__subtab--active' : ''}`}
          onClick={() => setActiveReviewSubTab('platform-suggestions')}
        >
          <strong>Đề xuất kỹ năng nền tảng</strong>
          <span>Duyệt skill mentor muốn bổ sung</span>
        </button>
      </div>

      {activeReviewSubTab === 'mentor-verifications' ? (
        <div className="skill-review-tab__embedded-panel">
          <MentorVerificationAdminTab initialRequesterRole="MENTOR" lockRequesterRole />
        </div>
      ) : (
        <>
          {error && <div className="skill-review-tab__error">{error}</div>}

          <div className="skill-review-tab__card">
            <div className="admin-roadmap-catalog__toolbar">
              <input
                className="skill-review-tab__search-input admin-roadmap-catalog__toolbar-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, khóa chuẩn, ID..."
              />
              <select className="skill-review-tab__search-input admin-roadmap-catalog__toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | SkillSuggestion['status'])}>
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ duyệt</option>
                <option value="APPROVED_CREATED">Đã tạo mới</option>
                <option value="MERGED_TO_EXISTING">Đã gộp</option>
                <option value="REJECTED">Đã từ chối</option>
              </select>
              <select className="skill-review-tab__search-input admin-roadmap-catalog__toolbar-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as SuggestionSortKey)}>
                <option value="createdAt">Mới nhất</option>
                <option value="id">ID tăng dần</option>
                <option value="suggestedName">Tên A-Z</option>
                <option value="suggestedCanonicalKey">Khóa chuẩn A-Z</option>
              </select>
            </div>
            {loading ? <p>Đang tải...</p> : (
              <table className="skill-review-tab__table skill-review-tab__table--dropdown-safe">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên đề xuất</th>
                    <th>Khóa chuẩn</th>
                    <th>Gộp vào kỹ năng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuggestions.map(s => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.suggestedName}</td>
                      <td><code className="skill-review-tab__code">{s.suggestedCanonicalKey}</code></td>
                      <td className="skill-review-tab__merge-cell">
                        <SearchSkillInput 
                          onSelect={(skillId) => setMergeTargetId(prev => ({ ...prev, [s.id]: skillId }))} 
                        />
                      </td>
                      <td className="skill-review-tab__actions">
                        <button onClick={() => handleApprove(s.id)} className="skill-review-tab__btn skill-review-tab__btn--approve">Duyệt</button>
                        <button onClick={() => handleMerge(s.id)} className="skill-review-tab__btn skill-review-tab__btn--merge">Gộp</button>
                        <button onClick={() => handleReject(s.id)} className="skill-review-tab__btn skill-review-tab__btn--reject">Từ chối</button>
                      </td>
                    </tr>
                  ))}
                  {filteredSuggestions.length === 0 && <tr><td colSpan={5} className="skill-review-tab__empty-state">Không có đề xuất nào phù hợp.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SkillSuggestionReviewTab;
