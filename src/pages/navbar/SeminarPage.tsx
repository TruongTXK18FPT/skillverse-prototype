import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import MeowlKuruLoader from '../../components/kuru-loader/MeowlKuruLoader';
import '../../components/seminar-hud/briefing-styles.css';
import HoloPagination from '../../components/mentorship-hud/HoloPagination';
import BriefingHero from '../../components/seminar-hud/BriefingHero';
import BriefingRow from '../../components/seminar-hud/BriefingRow';
import BriefingSidebar from '../../components/seminar-hud/BriefingSidebar';
import FrequencyTuner from '../../components/seminar-hud/FrequencyTuner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MeowGuide from '../../components/meowl/MeowlGuide';
import { seminarService, clearAnalyticsCache } from '../../services/seminarService';
import { Seminar, SeminarAnalytics } from '../../types/seminar';
import NeuralModal from '../../components/learning-hud/NeuralModal';
import { toast } from 'react-toastify';

// Helper: Ensure external URL has protocol
const ensureExternalUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

const SeminarPage: React.FC = () => {
  const { theme } = useTheme();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const itemsPerPage = 6;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Analytics State
  const [analytics, setAnalytics] = useState<SeminarAnalytics>({
    totalSeminars: 0,
    activeSeminars: 0,
    completedSeminars: 0,
    topSpeakers: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  
  // Modal State
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'details' | 'confirm' | 'success' | 'error'>('details');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const categoryLabels = ['TẤT CẢ', 'CÔNG NGHỆ', 'KINH DOANH', 'THIẾT KẾ'];
  const labelToValue: Record<string, string> = {
    'TẤT CẢ': 'all',
    'CÔNG NGHỆ': 'technology',
    'KINH DOANH': 'business',
    'THIẾT KẾ': 'design'
  };

  useEffect(() => {
    loadSeminars();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await seminarService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('⚠️ Không thể tải thống kê seminar');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleRefreshAnalytics = () => {
    clearAnalyticsCache();
    fetchAnalytics();
    toast.success('🔄 Đang làm mới thống kê...');
  };

  const loadSeminars = async () => {
    setLoading(true);
    try {
        // Fetch all accepted seminars (fetching 100 to handle client-side filtering comfortably for MVP)
        const response = await seminarService.getAllSeminars(0, 100);
        setSeminars(response.content);
        
        // Check for openId param after seminars are loaded
        const openId = searchParams.get('openId');
        if (openId) {
            try {
                // Fetch specific seminar details to ensure fresh data (especially isOwned status)
                const seminarDetail = await seminarService.getSeminarById(Number(openId));
                if (seminarDetail) {
                    setSelectedSeminar(seminarDetail);
                    setModalContent('details');
                    setIsModalOpen(true);
                }
            } catch (error) {
                console.error("Failed to fetch specific seminar details", error);
                // Fallback to finding in the list if fetch fails
                const seminarToOpen = response.content.find(s => s.id === Number(openId));
                if (seminarToOpen) {
                    setSelectedSeminar(seminarToOpen);
                    setModalContent('details');
                    setIsModalOpen(true);
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch seminars", error);
    } finally {
        setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    // Open modal immediately with loading state
    setModalContent('details');
    setIsModalOpen(true);
    setIsDetailLoading(true);
    
    try {
      // Always fetch fresh data from backend for accurate isOwned status
      console.log('[SeminarPage] Fetching seminar ID:', id);
      const freshSeminar = await seminarService.getSeminarById(Number(id));
      console.log('[SeminarPage] API Response:', {
        id: freshSeminar.id,
        title: freshSeminar.title,
        isOwned: freshSeminar.isOwned,
        meetingLink: freshSeminar.meetingLink
      });
      setSelectedSeminar(freshSeminar);
    } catch (error) {
      console.error("Failed to fetch seminar details", error);
      // Fallback to cached data if API fails
      const cachedSeminar = seminars.find(s => s.id === Number(id));
      if (cachedSeminar) {
        setSelectedSeminar(cachedSeminar);
      } else {
        setIsModalOpen(false);
      }
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Show confirmation dialog before buying
  const handleRequestBuyTicket = () => {
    if (!selectedSeminar) return;
    setModalContent('confirm');
  };

  const handleConfirmBuyTicket = async () => {
    if (!selectedSeminar) return;
    setIsProcessing(true);
    try {
        console.log('[SeminarPage] Buying ticket for seminar ID:', selectedSeminar.id);
        await seminarService.buyTicket(selectedSeminar.id);
        
        // Trigger wallet balance update in Header
        window.dispatchEvent(new Event('wallet:updated'));
        
        // Fetch fresh data immediately after purchase to get accurate isOwned status
        console.log('[SeminarPage] Fetching fresh data after purchase...');
        const freshSeminar = await seminarService.getSeminarById(selectedSeminar.id);
        console.log('[SeminarPage] Fresh data after purchase:', {
            id: freshSeminar.id,
            isOwned: freshSeminar.isOwned,
            meetingLink: freshSeminar.meetingLink
        });
        setSelectedSeminar(freshSeminar);
        
        setModalContent('success');
        
        loadSeminars(); // Refresh global list in background
    } catch (err: any) {
        console.error('[SeminarPage] Buy ticket failed:', err);
        setErrorMessage(err.response?.data?.message || "Không thể mua vé. Vui lòng kiểm tra số dư ví.");
        setModalContent('error');
    } finally {
        setIsProcessing(false);
    }
  };

  const filteredSeminars = seminars.filter(seminar => {
    const matchesSearch = seminar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seminar.description.toLowerCase().includes(searchTerm.toLowerCase());
    // Note: BE doesn't have 'tags' yet, so we assume all are generic or filter by description/title if needed.
    // For MVP preserving "all" category behavior
    const matchesCategory = filterCategory === 'all'; 
    return matchesSearch && matchesCategory;
  });

  const paginatedSeminars = filteredSeminars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className={`seminar-page ${theme}`} data-theme={theme}>
        <div className="loading-container">
          <MeowlKuruLoader size="small" text="" />
          <p>Đang tải thông tin seminar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`seminar-page ${theme}`} data-theme={theme}>
      <BriefingHero />

      <div className="briefing-layout-grid">
        <div className="briefing-feed">
          <div className="briefing-search-container">
            <span className="briefing-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm hội thảo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="briefing-search-input"
            />
          </div>

          <FrequencyTuner
            categories={categoryLabels}
            activeCategory={categoryLabels.find((l) => labelToValue[l] === filterCategory) || 'TẤT CẢ'}
            onCategoryChange={(label) => setFilterCategory(labelToValue[label])}
          />

          {filteredSeminars.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">📅</div>
              <h3>Không tìm thấy hội thảo</h3>
              <p>Hãy thử thay đổi từ khóa hoặc chuyên mục</p>
            </div>
          ) : (
            <div className="briefing-list">
              {paginatedSeminars.map((seminar) => (
                <BriefingRow
                  key={seminar.id}
                  seminar={seminar}
                  onAction={handleOpenModal}
                />
              ))}
            </div>
          )}

          {filteredSeminars.length > itemsPerPage && (
            <div className="pagination-wrapper">
              <HoloPagination
                totalItems={filteredSeminars.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        <BriefingSidebar
          totalSeminars={analytics.totalSeminars}
          activeSeminars={analytics.activeSeminars}
          completedSeminars={analytics.completedSeminars}
          topSpeakers={analytics.topSpeakers}
          loading={analyticsLoading}
          onRefresh={handleRefreshAnalytics}
        />
      </div>

      <MeowGuide currentPage="seminars" />

      {/* Detail / Buy Modal */}
      <NeuralModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
            modalContent === 'details' ? selectedSeminar?.title || 'Chi tiết' :
            modalContent === 'success' ? 'Đăng ký thành công' : 'Lỗi'
        }
      >
        {modalContent === 'details' && isDetailLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                <MeowlKuruLoader size="small" text="" />
                <p style={{ color: 'var(--lhud-text-dim)', marginTop: '1rem' }}>Đang tải thông tin...</p>
            </div>
        )}

        {modalContent === 'details' && !isDetailLoading && selectedSeminar && (
            <div style={{ color: 'var(--lhud-text-primary)' }}>
                <img 
                    src={selectedSeminar.imageUrl || 'https://via.placeholder.com/800x400'} 
                    alt={selectedSeminar.title}
                    style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <strong>Thời gian bắt đầu:</strong> <br/> {new Date(selectedSeminar.startTime).toLocaleString()}
                    </div>
                    <div>
                        <strong>Thời gian kết thúc:</strong> <br/> {new Date(selectedSeminar.endTime).toLocaleString()}
                    </div>
                    <div>
                        <strong>Giá vé:</strong> <br/> 
                        <span style={{ color: 'var(--lhud-cyan)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {selectedSeminar.price === 0 ? 'MIỄN PHÍ' : `${selectedSeminar.price.toLocaleString()} VNĐ`}
                        </span>
                    </div>
                    <div>
                         <strong>Người tổ chức:</strong> <br/> {selectedSeminar.creatorName || 'Recruiter'}
                    </div>
                    {/* Capacity Information */}
                    {selectedSeminar.maxCapacity && (
                        <div>
                            <strong>Sức chứa:</strong> <br/>
                            <span style={{ 
                                color: selectedSeminar.isSoldOut ? 'var(--lhud-error)' : 'var(--lhud-cyan)',
                                fontSize: '1.1rem',
                                fontWeight: 'bold'
                            }}>
                                {selectedSeminar.isSoldOut ? '🔴 HẾT VÉ' : 
                                    `${selectedSeminar.ticketsSold}/${selectedSeminar.maxCapacity} vé (còn ${selectedSeminar.remainingCapacity})`
                                }
                            </span>
                        </div>
                    )}
                    {!selectedSeminar.maxCapacity && (
                        <div>
                            <strong>Sức chứa:</strong> <br/>
                            <span style={{ color: 'var(--lhud-cyan)' }}>
                                ♾️ Không giới hạn ({selectedSeminar.ticketsSold} vé đã bán)
                            </span>
                        </div>
                    )}
                </div>
                
                <div style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
                    <h4 style={{ color: 'var(--lhud-text-bright)', marginBottom: '0.5rem' }}>Nội dung chi tiết</h4>
                    <p style={{ whiteSpace: 'pre-line' }}>{selectedSeminar.description}</p>
                </div>

                {selectedSeminar.isOwned ? (
                    <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '8px', border: '1px solid var(--lhud-cyan)' }}>
                        <h4 style={{ margin: 0, color: 'var(--lhud-cyan)' }}>✅ Bạn đã sở hữu vé này</h4>
                        {selectedSeminar.meetingLink && (
                            <div style={{ marginTop: '0.5rem' }}>
                                Link tham gia: <a href={ensureExternalUrl(selectedSeminar.meetingLink)} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>{selectedSeminar.meetingLink}</a>
                            </div>
                        )}
                        <button 
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                background: 'transparent',
                                border: '1px solid var(--lhud-cyan)',
                                color: 'var(--lhud-cyan)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                            onClick={() => {
                                setIsModalOpen(false);
                                navigate('/my-bookings?tab=tickets');
                            }}
                        >
                            Xem vé của tôi
                        </button>
                    </div>
                ) : (
                    new Date() > new Date(selectedSeminar.endTime) ? (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid var(--lhud-error)' }}>
                             <h4 style={{ margin: 0, color: 'var(--lhud-error)' }}>⚠️ Sự kiện đã kết thúc</h4>
                             <p style={{ margin: '0.5rem 0 0', color: 'var(--lhud-text-dim)' }}>
                                 Bạn không thể mua vé cho sự kiện này nữa.
                             </p>
                        </div>
                    ) : selectedSeminar.isSoldOut ? (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid var(--lhud-error)' }}>
                             <h4 style={{ margin: 0, color: 'var(--lhud-error)' }}>🔴 HẾT VÉ</h4>
                             <p style={{ margin: '0.5rem 0 0', color: 'var(--lhud-text-dim)' }}>
                                 Sự kiện này đã đạt số lượng người tham gia tối đa ({selectedSeminar.maxCapacity} vé).
                             </p>
                        </div>
                    ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                         <button 
                            className="briefing-row-btn" 
                            style={{ background: 'transparent', border: '1px solid var(--lhud-border)' }}
                            onClick={() => setIsModalOpen(false)}
                         >
                            Đóng
                         </button>
                         <button 
                            className="briefing-row-btn"
                            onClick={handleRequestBuyTicket}
                            disabled={isProcessing}
                         >
                            {isProcessing ? 'Đang xử lý...' : `Mua vé ngay (${selectedSeminar.price === 0 ? 'Miễn phí' : selectedSeminar.price.toLocaleString() + ' VNĐ'})`}
                         </button>
                    </div>
                    )
                )}
            </div>
        )}

        {modalContent === 'confirm' && selectedSeminar && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎫</div>
                <h3 style={{ color: 'var(--lhud-text-bright)', marginBottom: '1rem' }}>Xác nhận đăng ký</h3>
                <p style={{ color: 'var(--lhud-text-dim)', marginBottom: '0.5rem' }}>
                    Bạn có chắc muốn đăng ký tham gia hội thảo:
                </p>
                <p style={{ color: 'var(--lhud-cyan)', fontWeight: 'bold', marginBottom: '1rem' }}>
                    "{selectedSeminar.title}"
                </p>
                <div style={{ 
                    background: 'rgba(var(--lhud-cyan-rgb), 0.1)', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--lhud-cyan)'
                }}>
                    <p style={{ margin: 0, color: 'var(--lhud-text-primary)' }}>
                        💰 Chi phí: <strong style={{ color: selectedSeminar.price === 0 ? 'var(--lhud-success)' : 'var(--lhud-warning)' }}>
                            {selectedSeminar.price === 0 ? 'MIỄN PHÍ' : `${selectedSeminar.price.toLocaleString()} VNĐ`}
                        </strong>
                    </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button 
                        className="briefing-row-btn" 
                        style={{ background: 'transparent', border: '1px solid var(--lhud-border)' }}
                        onClick={() => setModalContent('details')}
                        disabled={isProcessing}
                    >
                        Quay lại
                    </button>
                    <button 
                        className="briefing-row-btn"
                        onClick={handleConfirmBuyTicket}
                        disabled={isProcessing}
                        style={{ background: 'var(--lhud-cyan)', color: 'var(--lhud-bg-dark)' }}
                    >
                        {isProcessing ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
                    </button>
                </div>
            </div>
        )}

        {modalContent === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h3 style={{ color: 'var(--lhud-text-bright)' }}>Bạn đã đăng ký tham gia thành công!</h3>
                <p style={{ color: 'var(--lhud-text-dim)', marginBottom: '2rem' }}>
                    Vé đã được gửi vào tài khoản của bạn. Bạn có thể xem link tham gia tại trang chi tiết seminar hoặc trong mục "Vé của tôi".
                </p>
                <button className="briefing-row-btn" onClick={() => setIsModalOpen(false)}>Đóng</button>
            </div>
        )}

        {modalContent === 'error' && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ color: '#ef4444' }}>Đăng ký thất bại</h3>
                <p style={{ color: 'var(--lhud-text-dim)', marginBottom: '2rem' }}>{errorMessage}</p>
                <button className="briefing-row-btn" onClick={() => setModalContent('details')}>Quay lại</button>
            </div>
        )}
      </NeuralModal>
    </div>
  );
};

export default SeminarPage;
