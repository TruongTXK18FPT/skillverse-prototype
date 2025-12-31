import React, { useState, useEffect } from 'react';
import './parent-dashboard.css';
import './parent-v2.css';
import { toast } from 'react-toastify';
import parentService, { ParentDashboardData } from '../../services/parentService';
import { ChatSession, ChatMessage } from '../../types/Chat';
import walletService from '../../services/walletService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    TrendingUp, 
    Clock, 
    Activity,
    BookOpen,
    Wallet,
    MessageSquare,
    X,
    Zap,
    ClipboardList,
    Plus,
    Sun,
    Moon,
    ChevronRight,
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StudentLearningReport from './StudentLearningReport';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

const ParentDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<ParentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    
    // Deposit Modal State
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [isDepositing, setIsDepositing] = useState(false);

    // Roadmap Modal State
    const [showRoadmapModal, setShowRoadmapModal] = useState(false);
    const [studentRoadmaps, setStudentRoadmaps] = useState<any[]>([]);
    const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);

    // Chat Session Modal State
    const [showChatSessionsModal, setShowChatSessionsModal] = useState(false);
    const [studentChatSessions, setStudentChatSessions] = useState<ChatSession[]>([]);
    const [loadingChatSessions, setLoadingChatSessions] = useState(false);
    const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
    const [chatSessionMessages, setChatSessionMessages] = useState<ChatMessage[]>([]);
    const [loadingChatMessages, setLoadingChatMessages] = useState(false);

    // Learning Report Modal State
    const [showLearningReport, setShowLearningReport] = useState(false);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);

    // Body Scroll Lock
    useEffect(() => {
        if (showDepositModal || showRoadmapModal || showChatSessionsModal || showLearningReport) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [showDepositModal, showRoadmapModal, showChatSessionsModal, showLearningReport]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleViewLearningReport = (student: any) => {
        setSelectedStudentForReport(student);
        setShowLearningReport(true);
    };

    const handleViewRoadmaps = async (studentId: number) => {
        setLoadingRoadmaps(true);
        setShowRoadmapModal(true);
        try {
            const roadmaps = await parentService.getStudentRoadmaps(studentId);
            setStudentRoadmaps(roadmaps);
        } catch (error) {
            console.error("Failed to fetch student roadmaps", error);
            // toast.error("Failed to load roadmaps");
        } finally {
            setLoadingRoadmaps(false);
        }
    };

    const handleViewChatSessions = async (studentId: number) => {
        setLoadingChatSessions(true);
        setShowChatSessionsModal(true);
        setSelectedChatSession(null); // Reset selected session
        try {
            const sessions = await parentService.getStudentChatSessions(studentId);
            setStudentChatSessions(sessions);
        } catch (error) {
            console.error("Failed to fetch student chat sessions", error);
            toast.error("Không thể tải lịch sử chat");
        } finally {
            setLoadingChatSessions(false);
        }
    };

    const handleViewChatSessionDetails = async (studentId: number, session: ChatSession) => {
        setLoadingChatMessages(true);
        setSelectedChatSession(session);
        try {
            const messages = await parentService.getStudentChatSessionDetails(studentId, session.sessionId);
            setChatSessionMessages(messages);
        } catch (error) {
            console.error("Failed to fetch chat session details", error);
            toast.error("Không thể tải chi tiết chat");
        } finally {
            setLoadingChatMessages(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const dashboardData = await parentService.getDashboard();
            setData(dashboardData);
            if (dashboardData.students.length > 0) {
                setSelectedStudentId(dashboardData.students[0].id);
            }

            try {
                const requests = await parentService.getSentRequests();
                setSentRequests(requests);
            } catch (reqError) {
                console.error("Failed to fetch sent requests", reqError);
            }

        } catch (error) {
            console.error("Failed to fetch dashboard", error);
            toast.error("Không thể tải dữ liệu dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        const amount = parseInt(depositAmount.replace(/\D/g, ''), 10);
        if (!amount || amount < 10000) {
            toast.warn("Vui lòng nhập số tiền tối thiểu 10.000 VNĐ");
            return;
        }

        setIsDepositing(true);
        try {
            const returnUrl = window.location.origin + '/parent-dashboard?payment=success';
            const cancelUrl = window.location.origin + '/parent-dashboard?payment=cancel';
            
            const response = await walletService.createDeposit({
                amount: amount,
                paymentMethod: 'PAYOS',
                returnUrl: returnUrl,
                cancelUrl: cancelUrl
            });
            
            if (response.data && response.data.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            } else {
                toast.error("Không nhận được link thanh toán");
            }
        } catch (error: any) {
            console.error("Deposit error:", error);
            toast.error(error.message || "Tạo giao dịch thất bại");
        } finally {
            setIsDepositing(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail) {
            toast.warn("Vui lòng nhập email học sinh");
            return;
        }
        try {
            await parentService.linkStudent(inviteEmail);
            toast.success("Đã gửi lời mời thành công!");
            setInviteEmail('');
            // Refresh requests
            const requests = await parentService.getSentRequests();
            setSentRequests(requests);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gửi lời mời thất bại");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Good': return 'var(--p-accent-green)';
            case 'Behind': return 'var(--p-accent-gold)';
            case 'Risk': return 'var(--p-accent-red)';
            default: return 'var(--p-text-muted)';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Good': return 'Ổn định';
            case 'Behind': return 'Cần chú ý';
            case 'Risk': return 'Cảnh báo';
            default: return 'Bình thường';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatAiResponse = (text: string) => {
        if (!text) return '';
        // Remove <thinking>...</thinking> and <suggestions>...</suggestions> tags and their content
        return text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').replace(/<suggestions>[\s\S]*?<\/suggestions>/g, '').trim();
    };

    if (loading) return <div className="parent-v2-container"><div className="parent-db-loading">Đang tải dữ liệu...</div></div>;

    return (
        <div className={`parent-v2-container ${theme === 'light' ? 'light-theme' : ''}`}>
            <div className="parent-v2-grid-bg" />
            
            <div className="parent-v2-header">
                <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                    <div className="parent-v2-avatar-wrapper">
                        <div className="parent-v2-avatar-glow" style={{ borderColor: 'var(--p-accent-gold)' }} />
                        {user?.avatarUrl ? (
                            <img 
                                src={user.avatarUrl} 
                                alt="Profile" 
                                style={{
                                    width: '100%', 
                                    height: '100%', 
                                    borderRadius: '50%', 
                                    objectFit: 'cover',
                                    position: 'relative',
                                    zIndex: 1
                                }} 
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--p-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                                <Users size={32} color="var(--p-accent-cyan)" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="parent-v2-title">Chào mừng trở lại, {user?.fullName?.split(' ').pop() || 'Phụ huynh'}</h1>
                        <p className="parent-v2-subtitle">TRUNG TÂM ĐIỀU HÀNH • TRẠNG THÁI: HOẠT ĐỘNG</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="parent-v2-theme-toggle" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className="parent-v2-wallet-display">
                        <Wallet size={20} />
                        <span>{formatCurrency(data?.parentWalletBalance || 0)}</span>
                    </div>
                </div>
            </div>

            <div className="parent-db-tabs" style={{ position: 'relative', zIndex: 1, margin: '0 2rem' }}>
                <button 
                    className={`parent-db-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <Activity size={18} /> Tổng quan
                </button>
                <button 
                    className={`parent-db-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    <Users size={18} /> Chi tiết học sinh
                </button>
            </div>

            <div className="parent-db-content" style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="parent-db-overview-grid"
                        >
                            {/* Student Summary Cards */}
                            {data?.students.map(student => (
                                <div 
                                    key={student.id} 
                                    className={`parent-v2-glass-card parent-v2-student-card status-${student.progress?.learningStatus?.toLowerCase() || 'good'}`} 
                                    onClick={() => { setSelectedStudentId(student.id); setActiveTab('students'); }}
                                >
                                    <div className="parent-db-student-header">
                                        <div className="parent-v2-avatar-wrapper">
                                            <div className="parent-v2-avatar-glow" />
                                            <img 
                                                src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}`} 
                                                alt={student.firstName} 
                                                className="avatar" 
                                                style={{ position: 'relative', zIndex: 1 }}
                                            />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--p-text)' }}>{student.firstName} {student.lastName}</h4>
                                            {student.progress && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(student.progress.learningStatus) }} />
                                                    <span style={{ fontSize: '0.8rem', color: getStatusColor(student.progress.learningStatus), fontWeight: 'bold' }}>
                                                        {getStatusText(student.progress.learningStatus)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {student.progress && (
                                    <div className="parent-db-student-stats-mini" style={{ marginTop: '1.5rem' }}>
                                        <div className="parent-db-stat-item">
                                            <TrendingUp size={16} color="var(--p-accent-cyan)" />
                                            <span>Lộ trình: {student.progress.roadmapProgress || 0}%</span>
                                        </div>
                                        <div className="parent-db-stat-item">
                                            <Clock size={16} color="var(--p-accent-gold)" />
                                            <span>Học tập: {student.progress.studyTimeWeek || 0}h</span>
                                        </div>
                                    </div>
                                    )}
                                    <div className="parent-v2-progress-container">
                                        <div className="parent-v2-progress-fill" style={{ width: `${student.progress?.roadmapProgress || 0}%` }}></div>
                                    </div>
                                </div>
                            ))}

                            {/* Invite Card */}
                            <div className="parent-v2-glass-card parent-v2-add-student-card" onClick={() => {
                                const email = prompt("Nhập email học sinh để liên kết:");
                                if (email) {
                                    setInviteEmail(email);
                                    handleInvite();
                                }
                            }}>
                                <div style={{ color: 'var(--p-accent-cyan)', marginBottom: '1rem' }}>
                                    <Plus size={48} />
                                </div>
                                <h4 style={{ color: 'var(--p-accent-cyan)', fontWeight: 700 }}>Thêm học sinh</h4>
                                <p style={{ color: 'var(--p-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>LIÊN KẾT TÀI KHOẢN MỚI</p>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'students' && data && (
                        <motion.div 
                            key="students"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="parent-db-students-detail-view"
                        >
                            <div className="parent-db-student-selector">
                                {sentRequests.length > 0 && (
                                    <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                                        <h4 style={{ color: 'var(--p-accent-gold)', margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 800 }}>ĐANG CHỜ DUYỆT</h4>
                                        {sentRequests.map(req => (
                                            <div key={req.id} style={{ fontSize: '0.75rem', color: 'var(--p-text-muted)', marginBottom: '0.25rem' }}>
                                                {req.student?.email || 'Không xác định'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {data.students.map(s => (
                                    <button 
                                        key={s.id} 
                                        className={`parent-db-selector-btn ${selectedStudentId === s.id ? 'active' : ''}`}
                                        onClick={() => setSelectedStudentId(s.id)}
                                        style={{ borderRadius: '12px', overflow: 'hidden', border: selectedStudentId === s.id ? '2px solid var(--p-accent-cyan)' : '1px solid var(--p-card-border)' }}
                                    >
                                        <img src={s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.firstName}`} alt="" />
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.firstName}</span>
                                    </button>
                                ))}
                            </div>

                            {selectedStudentId && (() => {
                                const student = data.students.find(s => s.id === selectedStudentId);
                                if (!student) return <div className="parent-db-student-detail-content"><p>Vui lòng chọn học sinh</p></div>;
                                return (
                                    <div className="parent-db-student-detail-content" style={{ background: 'transparent', padding: 0 }}>
                                        <div className="parent-v2-glass-card" style={{ marginBottom: '2rem' }}>
                                            <div className="parent-db-detail-header">
                                                <div className="info">
                                                    <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{student.firstName} {student.lastName}</h2>
                                                    <p style={{ color: 'var(--p-text-muted)' }}>{student.email}</p>
                                                    <div className="parent-db-badges" style={{ marginTop: '1rem' }}>
                                                        <span className="parent-db-badge premium" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--p-accent-gold)', border: '1px solid var(--p-accent-gold)' }}>
                                                            {student.progress?.premiumPlan ? `GÓI: ${student.progress.premiumPlan}` : 'GÓI CƠ BẢN'}
                                                            {student.progress?.premiumExpiry && <span style={{ fontSize: '0.8em', marginLeft: '0.5rem', opacity: 0.8 }}>
                                                                (Hết hạn: {new Date(student.progress.premiumExpiry).getTime() ? new Date(student.progress.premiumExpiry).toLocaleDateString('vi-VN') : 'N/A'})
                                                            </span>}
                                                        </span>
                                                        <span className="parent-db-badge streak" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--p-accent-red)', border: '1px solid var(--p-accent-red)' }}>
                                                             CHUỖI {student.progress?.streakDays || 0} NGÀY
                                                        </span>
                                                    </div>
                                                    <div style={{ marginTop: '1.5rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--p-accent-cyan)' }}>TIẾN ĐỘ HỌC TẬP</span>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--p-accent-cyan)' }}>{student.progress?.roadmapProgress || 0}%</span>
                                                        </div>
                                                        <div className="parent-v2-progress-container" style={{ height: '14px' }}>
                                                            <div className="parent-v2-progress-fill" style={{ width: `${student.progress?.roadmapProgress || 0}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="parent-v2-control-panel">
                                            <div className="parent-v2-zone">
                                                <div className="parent-v2-zone-label">Khu vực đầu tư</div>
                                                <button className="parent-v2-btn-gold" onClick={() => setShowDepositModal(true)}>
                                                    <Wallet size={18} /> Nạp Ví Học Tập
                                                </button>
                                                <button className="parent-v2-btn-gold" onClick={() => navigate('/premium', { state: { forStudent: student.id } })}>
                                                    <Zap size={18} /> Mua Premium/Khóa Học
                                                </button>
                                            </div>

                                            <div className="parent-v2-zone">
                                                <div className="parent-v2-zone-label">Khu vực giám sát</div>
                                                <button className="parent-v2-btn-cyan" onClick={() => handleViewRoadmaps(student.id)}>
                                                    <BookOpen size={18} /> Xem Lộ Trình
                                                </button>
                                                <button className="parent-v2-btn-cyan" onClick={() => handleViewLearningReport(student)}>
                                                    <ClipboardList size={18} /> Báo Cáo AI
                                                </button>
                                                <button className="parent-v2-btn-cyan" onClick={() => navigate('/messages', { state: { openChatWith: student.id, type: 'FAMILY' } })}>
                                                    <MessageSquare size={18} /> Nhắn Tin
                                                </button>
                                            </div>
                                        </div>

                                        <div className="parent-v2-stats-grid">
                                            <div className="parent-v2-stat-cell">
                                                <div className="parent-v2-stat-number">{student.progress?.totalRoadmaps || 0}</div>
                                                <div className="parent-v2-stat-label">Lộ trình</div>
                                            </div>
                                            <div className="parent-v2-stat-cell" onClick={() => handleViewChatSessions(student.id)} style={{ cursor: 'pointer' }}>
                                                <div className="parent-v2-stat-number">{student.progress?.chatSessionsCount || 0}</div>
                                                <div className="parent-v2-stat-label">Phiên AI</div>
                                            </div>
                                            <div className="parent-v2-stat-cell">
                                                <div className="parent-v2-stat-number">{student.progress?.completedJobs || 0}</div>
                                                <div className="parent-v2-stat-label">Việc làm</div>
                                            </div>
                                            <div className="parent-v2-stat-cell">
                                                <div className="parent-v2-stat-number" style={{ fontSize: '1.5rem' }}>{student.progress?.portfolioCreated ? 'ĐÃ CÓ' : 'CHƯA CÓ'}</div>
                                                <div className="parent-v2-stat-label">Hồ sơ</div>
                                            </div>
                                        </div>

                                        <div className="parent-v2-glass-card" style={{ marginTop: '2rem' }}>
                                            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Thời gian học tập (Phút)</h3>
                                            <div style={{ height: 300, width: '100%' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={[
                                                        { name: 'Hôm nay', minutes: student.progress?.studyTimeToday || 0 },
                                                        { name: 'Tuần này', minutes: student.progress?.studyTimeWeek || 0 },
                                                        { name: 'Tháng này', minutes: student.progress?.studyTimeMonth || 0 },
                                                    ]}>
                                                        <defs>
                                                            <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="var(--p-accent-cyan)" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="var(--p-accent-cyan)" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis dataKey="name" stroke="var(--p-text-muted)" tick={{ fontSize: 12 }} />
                                                        <YAxis stroke="var(--p-text-muted)" tick={{ fontSize: 12 }} />
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: 'var(--p-modal-bg)', border: '1px solid var(--p-card-border)', borderRadius: '12px' }}
                                                            itemStyle={{ color: 'var(--p-accent-cyan)' }}
                                                            labelStyle={{ color: 'var(--p-text)', fontWeight: 700, marginBottom: '4px' }}
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="minutes" 
                                                            stroke="var(--p-accent-cyan)" 
                                                            fillOpacity={1} 
                                                            fill="url(#colorMinutes)" 
                                                            strokeWidth={3}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="parent-v2-glass-card" style={{ marginTop: '2rem' }}>
                                            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Nhật ký nhiệm vụ: Dự án & Thực hành</h3>
                                            <div className="parent-db-projects-list">
                                                {student.projects.map(p => (
                                                    <div key={p.id} className="parent-db-project-item" style={{ background: 'var(--p-input-bg)', border: '1px solid var(--p-card-border)' }}>
                                                        <div className="parent-db-project-info">
                                                            <h4 style={{ fontWeight: 700 }}>{p.title}</h4>
                                                            <div className="parent-db-tech-stack">
                                                                {p.skills.map(skill => <span key={skill} style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--p-accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>{skill}</span>)}
                                                            </div>
                                                        </div>
                                                        <div className={`parent-db-project-status ${p.status.toLowerCase().replace(' ', '-')}`} style={{ fontWeight: 700 }}>
                                                            {p.status} {p.score && `- ${p.score}/100`}
                                                        </div>
                                                    </div>
                                                ))}
                                                {student.projects.length === 0 && <p style={{color: 'var(--p-text-muted)'}}>CHƯA CÓ NHIỆM VỤ NÀO.</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Deposit Modal */}
            <AnimatePresence>
                {showDepositModal && (
                    <div className="parent-v2-modal-overlay" onClick={() => setShowDepositModal(false)}>
                        <motion.div 
                            className="parent-v2-modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="parent-db-modal-close" onClick={() => setShowDepositModal(false)}>
                                <X size={24} />
                            </button>
                            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: 800, color: 'var(--p-text)' }}>Nạp Ví Học Tập</h2>
                            <p style={{ textAlign: 'center', color: 'var(--p-text-muted)', marginBottom: '2rem' }}>Số dư sẽ được chuyển trực tiếp vào ví của học sinh.</p>
                            
                            <div className="parent-v2-chip-grid">
                                {['50.000', '100.000', '200.000', '500.000'].map(amount => (
                                    <div 
                                        key={amount} 
                                        className={`parent-v2-chip ${depositAmount === amount ? 'active' : ''}`}
                                        onClick={() => setDepositAmount(amount)}
                                    >
                                        {amount} đ
                                    </div>
                                ))}
                            </div>

                            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                                <input 
                                    type="text" 
                                    className="parent-v2-input-glow"
                                    placeholder="Số tiền khác..."
                                    value={depositAmount}
                                    onChange={e => setDepositAmount(e.target.value)}
                                />
                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--p-accent-gold)', fontWeight: 800 }}>VND</div>
                            </div>

                            <button 
                                className="parent-v2-btn-gold" 
                                style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
                                onClick={handleDeposit}
                                disabled={isDepositing}
                            >
                                {isDepositing ? 'Đang xử lý...' : 'Xác nhận nạp tiền'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Roadmap Modal */}
            <AnimatePresence>
                {showRoadmapModal && (
                    <div className="parent-v2-modal-overlay" onClick={() => setShowRoadmapModal(false)}>
                        <motion.div 
                            className="parent-v2-modal-content roadmap-modal-content"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="parent-db-modal-close" onClick={() => setShowRoadmapModal(false)}>
                                <X size={24} />
                            </button>
                            <h2 style={{ marginBottom: '2rem', fontWeight: 800, color: 'var(--p-text)' }}>Lộ trình học tập</h2>
                            
                            {loadingRoadmaps ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải lộ trình...</div>
                            ) : (
                                <div className="roadmap-list">
                                    {studentRoadmaps.map((roadmap, idx) => (
                                        <div key={idx} className="roadmap-step-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <h4 style={{ fontWeight: 700, color: 'var(--p-accent-cyan)' }}>{roadmap.title || `Lộ trình ${idx + 1}`}</h4>
                                                <span style={{ fontSize: '0.8rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--p-accent-green)', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 700 }}>
                                                    {roadmap.status || 'Đang học'}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--p-text-muted)', marginBottom: '1rem' }}>{roadmap.description}</p>
                                            <div className="parent-v2-progress-container">
                                                <div className="parent-v2-progress-fill" style={{ width: `${roadmap.progress || 0}%` }}></div>
                                            </div>
                                            <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>{roadmap.progress || 0}% Hoàn thành</div>
                                        </div>
                                    ))}
                                    {studentRoadmaps.length === 0 && <p style={{ textAlign: 'center', color: 'var(--p-text-muted)' }}>Chưa có lộ trình nào được tạo.</p>}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Chat Sessions Modal */}
            <AnimatePresence>
                {showChatSessionsModal && (
                    <div className="parent-v2-modal-overlay" onClick={() => setShowChatSessionsModal(false)}>
                        <motion.div 
                            className="parent-v2-modal-content"
                            style={{ maxWidth: '1000px', width: '90%' }}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="parent-db-modal-close" onClick={() => setShowChatSessionsModal(false)}>
                                <X size={24} />
                            </button>
                            
                            {!selectedChatSession ? (
                                <>
                                    <h2 style={{ marginBottom: '1.5rem', fontWeight: 800, color: 'var(--p-text)' }}>Lịch sử tư vấn AI</h2>
                                    {loadingChatSessions ? (
                                        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
                                    ) : (
                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {studentChatSessions.map(session => (
                                                <div 
                                                    key={session.sessionId} 
                                                    className="parent-db-session-item"
                                                    onClick={() => handleViewChatSessionDetails(selectedStudentId!, session)}
                                                    style={{ background: 'var(--p-input-bg)', border: '1px solid var(--p-card-border)', borderRadius: '12px', padding: '1rem', marginBottom: '0.8rem', cursor: 'pointer' }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{session.title || 'Phiên tư vấn không tên'}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--p-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <Calendar size={12} /> {session.lastMessageAt ? new Date(session.lastMessageAt).toLocaleDateString('vi-VN') : 'Không rõ ngày'}
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={20} color="var(--p-text-muted)" />
                                                    </div>
                                                </div>
                                            ))}
                                            {studentChatSessions.length === 0 && <p style={{ textAlign: 'center', color: 'var(--p-text-muted)' }}>Chưa có phiên tư vấn nào.</p>}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <button onClick={() => setSelectedChatSession(null)} style={{ background: 'none', border: 'none', color: 'var(--p-accent-cyan)', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}> 
                                            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Quay lại
                                        </button>
                                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--p-text)' }}>{selectedChatSession.title}</h2>
                                    </div>
                                    <div style={{ maxHeight: '450px', overflowY: 'auto', padding: '1.5rem', background: 'var(--p-input-bg)', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                                        {loadingChatMessages ? (
                                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--p-text-muted)' }}>Đang tải nội dung...</div>
                                        ) : (
                                            chatSessionMessages.map((msg, idx) => (
                                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                                    {/* User Message */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                                        <div className="ai-chat-role-label user">Học sinh</div>
                                                        <div className="ai-chat-bubble user">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                                {msg.userMessage}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                    {/* AI Response */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                                        <div className="ai-chat-role-label ai">AI Mentor</div>
                                                        <div className="ai-chat-bubble ai">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                                                {formatAiResponse(msg.aiResponse)}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Learning Report Modal */}
            {showLearningReport && selectedStudentForReport && (
                <StudentLearningReport 
                    student={selectedStudentForReport} 
                    isOpen={showLearningReport}
                    onClose={() => setShowLearningReport(false)} 
                />
            )}
        </div>
    );
};

export default ParentDashboard;
