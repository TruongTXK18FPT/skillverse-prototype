import React, { useState, useEffect } from 'react';
import { 
  X, Users, Search, Crown, UserMinus, Shield, 
  Loader2, User, Mail, Clock, MoreVertical 
} from 'lucide-react';
import { GroupMemberDTO, getGroupMembers, kickMember } from '../../services/groupChatService';
import { useAuth } from '../../context/AuthContext';
import { showAppError } from '../../context/ToastContext';
import './MemberListModal.css';

interface MemberListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  mentorId: number;
  onMemberKicked?: () => void;
}

const MemberListModal: React.FC<MemberListModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  mentorId,
  onMemberKicked
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMemberDTO[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<GroupMemberDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const [kickingMember, setKickingMember] = useState<number | null>(null);
  const [confirmKick, setConfirmKick] = useState<GroupMemberDTO | null>(null);

  const isMentor = user?.id === mentorId;

  useEffect(() => {
    if (isOpen && groupId && user) {
      fetchMembers();
    }
  }, [isOpen, groupId, user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(m => 
          m.userName.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, members]);

  const fetchMembers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getGroupMembers(groupId, user.id);
      // Sort: mentor first, then by name
      const sorted = data.sort((a, b) => {
        if (a.role === 'MENTOR') return -1;
        if (b.role === 'MENTOR') return 1;
        return a.userName.localeCompare(b.userName);
      });
      setMembers(sorted);
      setFilteredMembers(sorted);
    } catch (err) {
      setError('Không thể tải danh sách thành viên');
      console.error('Error fetching members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKickMember = async (member: GroupMemberDTO) => {
    if (!user || !isMentor || member.role === 'MENTOR') return;
    
    setKickingMember(member.userId);
    
    try {
      await kickMember(groupId, user.id, member.userId);
      setMembers(prev => prev.filter(m => m.userId !== member.userId));
      setConfirmKick(null);
      onMemberKicked?.();
    } catch (err) {
      console.error('Error kicking member:', err);
      showAppError('Không thể xóa thành viên', 'Không thể xóa thành viên. Vui lòng thử lại.');
    } finally {
      setKickingMember(null);
    }
  };

  const formatJoinDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Convert to Vietnam timezone (GMT+7)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const getMemberCount = () => {
    const mentorCount = members.filter(m => m.role === 'MENTOR').length;
    const studentCount = members.filter(m => m.role === 'STUDENT').length;
    return { mentorCount, studentCount, total: members.length };
  };

  if (!isOpen) return null;

  const { mentorCount, studentCount, total } = getMemberCount();

  return (
    <div className="member-list-overlay" onClick={onClose}>
      <div className="member-list-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="member-list-header">
          <div className="member-list-header-info">
            <div className="member-list-icon">
              <Users size={24} />
            </div>
            <div>
              <h2 className="member-list-title">Thành viên nhóm</h2>
              <p className="member-list-subtitle">{groupName}</p>
            </div>
          </div>
          <button className="member-list-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="member-list-stats">
          <div className="member-stat">
            <span className="member-stat-value">{total}</span>
            <span className="member-stat-label">Tổng</span>
          </div>
          <div className="member-stat-divider" />
          <div className="member-stat mentor">
            <span className="member-stat-value">{mentorCount}</span>
            <span className="member-stat-label">Mentor</span>
          </div>
          <div className="member-stat-divider" />
          <div className="member-stat">
            <span className="member-stat-value">{studentCount}</span>
            <span className="member-stat-label">Học viên</span>
          </div>
        </div>

        {/* Search */}
        <div className="member-list-search">
          <Search size={16} className="member-search-icon" />
          <input
            type="text"
            placeholder="Tìm thành viên..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="member-search-input"
          />
          {searchQuery && (
            <button 
              className="member-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Member list */}
        <div className="member-list-content">
          {isLoading ? (
            <div className="member-list-loading">
              <Loader2 size={32} className="spinning" />
              <span>Đang tải...</span>
            </div>
          ) : error ? (
            <div className="member-list-error">
              <p>{error}</p>
              <button onClick={fetchMembers} className="member-retry-btn">
                Thử lại
              </button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="member-list-empty">
              <Users size={40} />
              <p>{searchQuery ? 'Không tìm thấy thành viên' : 'Chưa có thành viên'}</p>
            </div>
          ) : (
            <div className="member-list-items">
              {filteredMembers.map(member => (
                <div 
                  key={member.userId} 
                  className={`member-item ${member.role === 'MENTOR' ? 'mentor' : ''}`}
                >
                  <div className="member-avatar">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.userName} />
                    ) : (
                      <div className="member-avatar-placeholder">
                        {member.role === 'MENTOR' ? (
                          <Crown size={20} />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                    )}
                    {member.isOnline && <div className="member-online-dot" />}
                  </div>

                  <div className="member-info">
                    <div className="member-name-row">
                      <span className="member-name">{member.userName}</span>
                      {member.role === 'MENTOR' && (
                        <span className="member-badge mentor">
                          <Crown size={12} />
                          Mentor
                        </span>
                      )}
                      {member.userId === user?.id && (
                        <span className="member-badge you">Bạn</span>
                      )}
                    </div>
                    <div className="member-details">
                      <span className="member-email">
                        <Mail size={12} />
                        {member.email}
                      </span>
                      <span className="member-joined">
                        <Clock size={12} />
                        {formatJoinDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action menu for mentor */}
                  {isMentor && member.role !== 'MENTOR' && member.userId !== user?.id && (
                    <div className="member-actions">
                      <button
                        className="member-action-btn"
                        onClick={() => setActionMenuOpen(
                          actionMenuOpen === member.userId ? null : member.userId
                        )}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {actionMenuOpen === member.userId && (
                        <div className="member-action-menu">
                          <button
                            className="member-action-item danger"
                            onClick={() => {
                              setConfirmKick(member);
                              setActionMenuOpen(null);
                            }}
                          >
                            <UserMinus size={16} />
                            <span>Xóa khỏi nhóm</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mentor info footer */}
        {isMentor && (
          <div className="member-list-footer">
            <Shield size={14} />
            <span>Bạn là Mentor và có thể quản lý thành viên</span>
          </div>
        )}

        {/* Confirm kick modal */}
        {confirmKick && (
          <div className="kick-confirm-overlay" onClick={() => setConfirmKick(null)}>
            <div className="kick-confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="kick-confirm-icon">
                <UserMinus size={32} />
              </div>
              <h3>Xác nhận xóa thành viên</h3>
              <p>
                Bạn có chắc muốn xóa <strong>{confirmKick.userName}</strong> khỏi nhóm?
              </p>
              <div className="kick-confirm-actions">
                <button 
                  className="kick-cancel-btn"
                  onClick={() => setConfirmKick(null)}
                  disabled={kickingMember === confirmKick.userId}
                >
                  Hủy
                </button>
                <button 
                  className="kick-confirm-btn"
                  onClick={() => handleKickMember(confirmKick)}
                  disabled={kickingMember === confirmKick.userId}
                >
                  {kickingMember === confirmKick.userId ? (
                    <>
                      <Loader2 size={16} className="spinning" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <UserMinus size={16} />
                      Xóa thành viên
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberListModal;
