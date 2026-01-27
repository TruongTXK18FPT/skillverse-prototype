import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import MeowlGuide from '../../components/meowl/MeowlGuide';
import { seminarService } from '../../services/seminarService';
import { Seminar } from '../../types/seminar';
import { Calendar, Clock, DollarSign, User, Link as LinkIcon } from 'lucide-react';
import '../../components/seminar-hud/briefing-styles.css';
import '../../styles/SeminarDetailPage.css';

// Helper: Ensure external URL has protocol
const ensureExternalUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

const SeminarDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeminar = async () => {
      if (!id) return;
      try {
        setLoading(true);
        console.log('[SeminarDetailPage] Fetching seminar ID:', id);
        const data = await seminarService.getSeminarById(Number(id));
        console.log('[SeminarDetailPage] API Response:', {
          id: data.id,
          title: data.title,
          isOwned: data.isOwned,
          startTime: data.startTime,
          endTime: data.endTime,
          meetingLink: data.meetingLink
        });
        setSeminar(data);
      } catch (err) {
        console.error("Failed to fetch seminar details", err);
        setError("Không tìm thấy thông tin hội thảo hoặc bạn không có quyền truy cập.");
      } finally {
        setLoading(false);
      }
    };
    fetchSeminar();
  }, [id]);

  if (loading) {
    return (
      <div className={`seminar-page ${theme} sdp-loading`} data-theme={theme}>
        <MeowlKuruLoader size="small" text="Đang tải chi tiết..." />
      </div>
    );
  }

  if (error || !seminar) {
    return (
      <div className={`seminar-page ${theme} sdp-error`} data-theme={theme}>
        <div className="sdp-error-icon">⚠️</div>
        <h3>{error || "Hội thảo không tồn tại"}</h3>
        <button 
            className="briefing-row-btn" 
            style={{ marginTop: '2rem' }}
            onClick={() => navigate('/seminar')}
        >
            Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className={`seminar-page ${theme} sdp-container`} data-theme={theme}>
      <div className="sdp-back-section">
        <button 
            className="sdp-back-btn"
            onClick={() => navigate('/my-bookings?tab=tickets')}
        >
            ← Quay lại vé của tôi
        </button>
      </div>

      <div className="sdp-card">
        {/* Hero Image */}
        <div 
          className="sdp-hero"
          style={{ backgroundImage: `url(${seminar.imageUrl || 'https://via.placeholder.com/1200x600'})` }}
        >
            <div className="sdp-hero-gradient" />
            <div className="sdp-hero-content">
                <h1 className="sdp-hero-title">{seminar.title}</h1>
                <div className="sdp-hero-meta">
                    <div className="sdp-hero-meta-item">
                        <User size={20} color="#06b6d4" />
                        <span>{seminar.creatorName || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="sdp-hero-meta-item">
                        <DollarSign size={20} color="#22c55e" />
                        <span className="sdp-price">
                            {seminar.price === 0 ? 'MIỄN PHÍ' : `${seminar.price.toLocaleString()} VNĐ`}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="sdp-content">
            <div className="sdp-grid">
                {/* Main Info */}
                <div className="sdp-main-info">
                    <h3>Giới thiệu hội thảo</h3>
                    <p className="sdp-description">{seminar.description}</p>
                </div>

                {/* Sidebar Info */}
                <div className="sdp-sidebar">
                    <h4 className="sdp-sidebar-title">Thông tin chi tiết</h4>
                    
                    {/* Trạng thái seminar */}
                    <div className="sdp-status">
                        {seminar.status === 'CLOSED' || new Date() > new Date(seminar.endTime) ? (
                            <div className="sdp-status-badge sdp-status-badge--ended">
                                ⏹️ Đã kết thúc
                            </div>
                        ) : seminar.status === 'OPEN' || new Date() >= new Date(seminar.startTime) ? (
                            <div className="sdp-status-badge sdp-status-badge--live">
                                🔴 Đang diễn ra
                            </div>
                        ) : (
                            <div className="sdp-status-badge sdp-status-badge--upcoming">
                                📅 Sắp diễn ra
                            </div>
                        )}
                    </div>
                    
                    <div className="sdp-time-block">
                        <div className="sdp-time-label">
                            <Calendar size={18} />
                            <span>Thời gian bắt đầu</span>
                        </div>
                        <div className="sdp-time-value">
                            {seminar.startTime ? new Date(seminar.startTime).toLocaleString('vi-VN') : 'Chưa cập nhật'}
                        </div>
                    </div>

                    <div className="sdp-time-block">
                        <div className="sdp-time-label">
                            <Clock size={18} />
                            <span>Thời gian kết thúc</span>
                        </div>
                        <div className="sdp-time-value">
                            {seminar.endTime ? new Date(seminar.endTime).toLocaleString('vi-VN') : 'Chưa cập nhật'}
                        </div>
                    </div>

                    <div className="sdp-ticket-section">
                        {seminar.isOwned ? (
                            <div>
                                <div className="sdp-ticket-owned">
                                    ✅ Bạn đã sở hữu vé
                                </div>
                                
                                {/* Seminar đã kết thúc - hiển thị thông báo */}
                                {(seminar.status === 'CLOSED' || new Date() > new Date(seminar.endTime)) ? (
                                    <div className="sdp-ticket-ended-msg">
                                        📋 Hội thảo đã kết thúc. Cảm ơn bạn đã tham gia!
                                    </div>
                                ) : seminar.meetingLink ? (
                                    <a 
                                        href={ensureExternalUrl(seminar.meetingLink)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="sdp-join-btn"
                                    >
                                        <LinkIcon size={18} />
                                        Tham gia ngay
                                    </a>
                                ) : (
                                    <div className="sdp-link-pending">
                                        Link tham gia chưa được cập nhật
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="sdp-no-ticket-msg">
                                {(seminar.status === 'CLOSED' || new Date() > new Date(seminar.endTime)) ? (
                                    <>Hội thảo này đã kết thúc.</>
                                ) : (
                                    <>
                                        Bạn chưa sở hữu vé này. <br/>
                                        <a href="/seminar">Quay lại trang danh sách</a> để mua vé.
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      <MeowlGuide currentPage="seminars" />
    </div>
  );
};

export default SeminarDetailPage;