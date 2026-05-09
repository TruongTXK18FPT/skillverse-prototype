import React, { useEffect, useState, useRef } from 'react';
import { adminSkillRegistryService } from '../../../services/adminSkillRegistryService';
import { SkillSuggestion, Skill } from '../../../types/skillRegistry';
import './SkillSuggestionReviewTab.css';

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
        placeholder="Tìm skill để merge..."
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
              Không tải được skill.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

const SkillSuggestionReviewTab: React.FC = () => {
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<Record<number, number | null>>({});

  const fetchSuggestions = async () => {
    try {
      setError(null);
      const data = await adminSkillRegistryService.getPendingSuggestions(0, 50);
      setSuggestions(data.items);
    } catch {
      setError('Không tải được danh sách suggestion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuggestions(); }, []);

  const remove = (id: number) => setSuggestions(prev => prev.filter(s => s.id !== id));

  const handleApprove = async (id: number) => {
    setError(null);
    try {
      await adminSkillRegistryService.approveSuggestion(id);
      remove(id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('SKILL_ALREADY_EXISTS') ? 'Skill đã tồn tại — dùng Merge thay vì Approve.' : 'Approve thất bại: ' + msg);
    }
  };

  const handleMerge = async (id: number) => {
    const matchedSkillId = mergeTargetId[id];
    if (!matchedSkillId) {
      setError('Vui lòng chọn một Skill hợp lệ từ danh sách để merge.');
      return;
    }
    setError(null);
    try {
      await adminSkillRegistryService.mergeSuggestion(id, matchedSkillId);
      remove(id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      setError(msg.includes('TARGET_SKILL_NOT_ACTIVE') ? `Skill ID ${matchedSkillId} không ACTIVE.` : 'Merge thất bại: ' + msg);
    }
  };

  const handleReject = async (id: number) => {
    setError(null);
    try {
      await adminSkillRegistryService.rejectSuggestion(id, 'Rejected by Admin');
      remove(id);
    } catch (e: any) {
      setError('Reject thất bại: ' + (e?.response?.data?.message || e?.message));
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-tab-header">
        <h2>Duyệt Skill Suggestion</h2>
        <p>Xem xét và duyệt các kỹ năng được đề xuất từ Mentor</p>
      </div>

      {error && <div className="skill-review-tab__error">{error}</div>}

      <div className="skill-review-tab__card">
        {loading ? <p>Loading...</p> : (
          <table className="skill-review-tab__table" style={{ overflow: 'visible' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Suggested Name</th>
                <th>Canonical Key</th>
                <th>Merge vào Skill</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.suggestedName}</td>
                  <td><code style={{ fontSize: 12 }}>{s.suggestedCanonicalKey}</code></td>
                  <td style={{ position: 'relative' }}>
                    <SearchSkillInput 
                      onSelect={(skillId) => setMergeTargetId(prev => ({ ...prev, [s.id]: skillId }))} 
                    />
                  </td>
                  <td className="skill-review-tab__actions">
                    <button onClick={() => handleApprove(s.id)} className="skill-review-tab__btn skill-review-tab__btn--approve">Approve</button>
                    <button onClick={() => handleMerge(s.id)} className="skill-review-tab__btn skill-review-tab__btn--merge">Merge</button>
                    <button onClick={() => handleReject(s.id)} className="skill-review-tab__btn skill-review-tab__btn--reject">Reject</button>
                  </td>
                </tr>
              ))}
              {suggestions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>No pending suggestions.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SkillSuggestionReviewTab;
