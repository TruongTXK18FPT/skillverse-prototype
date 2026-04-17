import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  MentorProfile,
  getMyMentorProfile,
} from '../../services/mentorProfileService';
import {
  ReviewStatsResponse,
  getMyMentorReviewStats,
} from '../../services/reviewService';
import CommanderHeader from '../../components/profile-hud/mentor/CommanderHeader';
import '../../components/profile-hud/mentor/CommanderStyles.css';

const MentorProfilePage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStatsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      try {
        const [profileData, statsData] = await Promise.all([
          getMyMentorProfile(),
          getMyMentorReviewStats().catch((statsError) => {
            console.warn('Failed to load mentor review stats:', statsError);
            return null;
          }),
        ]);

        setProfile(profileData);
        setReviewStats(statsData);
      } catch (error) {
        console.error('Failed to load profile:', error);
        showError('Lỗi', 'Không thể tải dữ liệu hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, isAuthenticated, navigate, showError]);

  if (loading) {
    return (
      <div
        className="cmdr-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div className="cmdr-panel">
          <div className="cmdr-panel-title">Đang tải hệ thống...</div>
        </div>
      </div>
    );
  }

  const canSetBackupPassword =
    user?.authProvider === 'GOOGLE' && !user?.googleLinked;
  const canChangePassword =
    user?.authProvider === 'LOCAL' || user?.googleLinked;

  return (
    <div className="cmdr-container">
      <div className="cmdr-scanline"></div>

      <div className="cmdr-profile-shell">
        <CommanderHeader
          profile={profile}
          reviewStats={reviewStats}
          allowAvatarUpload={false}
          showPresenceToggle={false}
        />

        <div className="cmdr-panel cmdr-panel--security">
          <div className="cmdr-panel-title">
            Bảo mật tài khoản
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>SEC-MOD-11</span>
          </div>

          <p className="cmdr-security-description">
            Quản lý phương thức đăng nhập và cập nhật mật khẩu để bảo vệ tài khoản
            giảng viên.
          </p>

          <div className="cmdr-security-grid">
            {canSetBackupPassword && (
              <article className="cmdr-security-card cmdr-security-card--warning">
                <h3 className="cmdr-security-card-title">Mật khẩu dự phòng</h3>
                <p className="cmdr-security-card-desc">
                  Thiết lập mật khẩu dự phòng để đăng nhập khi Google OAuth không
                  khả dụng.
                </p>
                <button
                  type="button"
                  className="cmdr-btn cmdr-btn-danger"
                  onClick={() => navigate('/set-password')}
                >
                  <Shield size={18} />
                  Thiết lập mật khẩu
                </button>
              </article>
            )}

            {canChangePassword && (
              <article className="cmdr-security-card">
                <h3 className="cmdr-security-card-title">Đổi mật khẩu</h3>
                <p className="cmdr-security-card-desc">
                  Cập nhật mật khẩu định kỳ để tăng độ an toàn cho tài khoản của
                  bạn.
                </p>
                <button
                  type="button"
                  className="cmdr-btn cmdr-btn-primary"
                  onClick={() => navigate('/change-password')}
                >
                  <Lock size={18} />
                  Đổi mật khẩu
                </button>
              </article>
            )}
          </div>

          {user?.googleLinked && (
            <div className="cmdr-security-note">
              Xác thực kép đã kích hoạt: bạn có thể đăng nhập bằng cả Google và
              email + mật khẩu.
            </div>
          )}

          {!canSetBackupPassword && !canChangePassword && (
            <p className="cmdr-security-empty">
              Chưa có thao tác bảo mật khả dụng cho tài khoản hiện tại.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorProfilePage;
