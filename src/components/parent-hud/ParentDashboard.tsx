import React, { useState, useEffect } from 'react';
import './parent-dashboard.css';
import { toast } from 'react-toastify';
import parentService, { ParentDashboardData } from '../../services/parentService';
import { RoadmapSessionSummary } from '../../types/Roadmap';
import { ChatSession, ChatMessage } from '../../types/Chat';
import walletService from '../../services/walletService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    TrendingUp, 
    Clock, 
    Award, 
    AlertTriangle, 
    Activity,
    BookOpen,
    Wallet,
    MessageSquare,
    Briefcase,
    FileText,
    X,
    Zap,
    ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StudentLearningReport from './StudentLearningReport';

const ParentDashboard: React.FC = () => {
    const { user } = useAuth();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const navigate = useNavigate();
    const [data, setData] = useState<ParentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    
    // Deposit Modal State
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [isDepositing, setIsDepositing] = useState(false);

    // Roadmap Modal State
    const [showRoadmapModal, setShowRoadmapModal] = useState(false);
    const [studentRoadmaps, setStudentRoadmaps] = useState<any[]>([]); // Using any[] for now, should be RoadmapSessionSummary[]
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
            const returnUrl = window.location.origin + '/parent/dashboard?payment=success';
            const cancelUrl = window.location.origin + '/parent/dashboard?payment=cancel';
            
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
            case 'Good': return '#4ade80';
            case 'Behind': return '#fb923c';
            case 'Risk': return '#f87171';
            default: return '#cbd5e1';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (loading) return <div className="parent-db-container"><div className="parent-db-loading">Đang tải dữ liệu...</div></div>;

    return (
        <div className="parent-db-container">
            <div className="parent-db-welcome-section">
                <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                    {user?.avatarUrl && (
                        <img 
                            src={user.avatarUrl} 
                            alt="Profile" 
                            style={{
                                width: 80, 
                                height: 80, 
                                borderRadius: '50%', 
                                border: '3px solid rgba(96, 165, 250, 0.5)',
                                objectFit: 'cover'
                            }} 
                        />
                    )}
                    <div>
                        <h1 className="parent-db-title">Welcome back, {user?.fullName || 'Parent'}!</h1>
                        <p className="parent-db-subtitle">Đồng hành cùng con trên hành trình tri thức</p>
                    </div>
                </div>
            </div>

            <div className="parent-db-tabs">
                <button 
                    className={`parent-db-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <Activity size={18} /> Tổng Quan
                </button>
                <button 
                    className={`parent-db-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    <Users size={18} /> Chi Tiết Học Sinh
                </button>
            </div>

            <div className="parent-db-content">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="parent-db-overview-grid"
                        >
                            {/* Invite Card */}
                            <div className="parent-db-card parent-db-invite-card">
                                <h3><Users size={20} /> Liên Kết Học Sinh Mới</h3>
                                <p style={{color: '#94a3b8', marginBottom: '1rem'}}>Nhập email của con bạn để gửi lời mời liên kết tài khoản.</p>
                                <div className="parent-db-invite-input-group">
                                    <input 
                                        type="email" 
                                        placeholder="email.hocsinh@example.com" 
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                    <button onClick={handleInvite}>Gửi Lời Mời</button>
                                </div>
                            </div>

                            {/* Student Summary Cards */}
                            {data?.students.map(student => (
                                <div key={student.id} className="parent-db-card parent-db-student-summary-card" onClick={() => { setSelectedStudentId(student.id); setActiveTab('students'); }}>
                                    <div className="parent-db-student-header">
                                        <img 
                                            src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}`} 
                                            alt={student.firstName} 
                                            className="avatar" 
                                        />
                                        <div>
                                            <h4>{student.firstName} {student.lastName}</h4>
                                            {student.progress && (
                                                <span className="parent-db-status-badge" style={{ borderColor: getStatusColor(student.progress.learningStatus), color: getStatusColor(student.progress.learningStatus) }}>
                                                    {student.progress.learningStatus === 'Good' ? 'Đang học tốt' : student.progress.learningStatus === 'Behind' ? 'Cần nhắc nhở' : 'Cần hỗ trợ'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {student.progress && (
                                    <div className="parent-db-student-stats-mini">
                                        <div className="parent-db-stat-item">
                                            <TrendingUp size={16} color="#4facfe" />
                                            <span>Roadmap: {student.progress.roadmapProgress || 0}%</span>
                                        </div>
                                        <div className="parent-db-stat-item">
                                            <Clock size={16} color="#ffd700" />
                                            <span>Tuần này: {student.progress.studyTimeWeek || 0}h</span>
                                        </div>
                                    </div>
                                    )}
                                    <div className="parent-db-progress-bar-mini">
                                        <div className="fill" style={{ width: `${student.progress?.roadmapProgress || 0}%` }}></div>
                                    </div>
                                </div>
                            ))}
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
                                        <h4 style={{ color: '#fb923c', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Đang chờ duyệt</h4>
                                        {sentRequests.map(req => (
                                            <div key={req.id} style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                                                {req.student?.email || 'Unknown'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {data.students.map(s => (
                                    <button 
                                        key={s.id} 
                                        className={`parent-db-selector-btn ${selectedStudentId === s.id ? 'active' : ''}`}
                                        onClick={() => setSelectedStudentId(s.id)}
                                    >
                                        <img src={s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.firstName}`} alt="" />
                                        {s.firstName}
                                    </button>
                                ))}
                            </div>

                            {selectedStudentId && (() => {
                                const student = data.students.find(s => s.id === selectedStudentId);
                                if (!student) return <div className="parent-db-student-detail-content"><p>Vui lòng chọn học sinh</p></div>;
                                return (
                                    <div className="parent-db-student-detail-content">
                                        <div className="parent-db-detail-header">
                                            <div className="info">
                                                <h2>{student.firstName} {student.lastName}</h2>
                                                <p>{student.email}</p>
                                                <div className="parent-db-badges">
                                                    <span className="parent-db-badge premium">
                                                        {student.progress?.premiumPlan ? `Premium: ${student.progress.premiumPlan}` : 'Free Plan'}
                                                        {student.progress?.premiumExpiry && <span style={{ fontSize: '0.7em', marginLeft: '0.5rem', opacity: 0.8 }}>
                                                            (Hết hạn: {new Date(student.progress.premiumExpiry).toLocaleDateString('vi-VN')})
                                                        </span>}
                                                    </span>
                                                    <span className="parent-db-badge streak">
                                                        🔥 {student.progress?.streakDays || 0} ngày streak
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="parent-db-actions">
                                                <button className="parent-db-btn-action primary" onClick={() => setShowDepositModal(true)}>Nạp Ví Học Tập</button>
                                                <button className="parent-db-btn-action secondary" onClick={() => navigate('/messages', { state: { openChatWith: student.id, type: 'FAMILY' } })}>Gửi Lời Nhắn</button>
                                                <button className="parent-db-btn-action" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }} onClick={() => handleViewRoadmaps(student.id)}>Xem Roadmap</button>
                                                <button className="parent-db-btn-action" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }} onClick={() => handleViewLearningReport(student)}>
                                                    <ClipboardList size={16} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                                                    Báo Cáo Học Tập
                                                </button>
                                                <button className="parent-db-btn-action" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }} onClick={() => navigate('/premium', { state: { forStudent: student.id } })}>Mua Premium/Khóa Học</button>
                                            </div>
                                        </div>

                                        <div className="parent-db-stats-grid">
                                            <div className="parent-db-stat-box">
                                                <div className="parent-db-icon-bg blue"><BookOpen size={24} /></div>
                                                <div className="value">{student.progress?.totalRoadmaps || 0}</div>
                                                <div className="label">Roadmaps đã tạo</div>
                                            </div>
                                            <div className="parent-db-stat-box" onClick={() => handleViewChatSessions(student.id)} style={{ cursor: 'pointer' }}>
                                                <div className="parent-db-icon-bg green"><MessageSquare size={24} /></div>
                                                <div className="value">{student.progress?.chatSessionsCount || 0}</div>
                                                <div className="label">Phiên Chat AI (Xem chi tiết)</div>
                                            </div>
                                            <div className="parent-db-stat-box">
                                                <div className="parent-db-icon-bg purple"><Briefcase size={24} /></div>
                                                <div className="value">{student.progress?.completedJobs || 0}</div>
                                                <div className="label">Công việc hoàn thành</div>
                                            </div>
                                            <div className="parent-db-stat-box">
                                                <div className="parent-db-icon-bg orange"><FileText size={24} /></div>
                                                <div className="value">{student.progress?.portfolioCreated ? 'Đã tạo' : 'Chưa có'}</div>
                                                <div className="label">Portfolio</div>
                                            </div>
                                        </div>

                                        <div className="chart-section" style={{ marginTop: '2rem', background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '16px' }}>
                                            <h3 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>Thống Kê Thời Gian Học Tập (Phút)</h3>
                                            <div style={{ height: 300, width: '100%' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={[
                                                        { name: 'Hôm nay', minutes: student.progress?.studyTimeToday || 0 },
                                                        { name: 'Tuần này', minutes: student.progress?.studyTimeWeek || 0 },
                                                        { name: 'Tháng này', minutes: student.progress?.studyTimeMonth || 0 },
                                                    ]}>
                                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                                        <YAxis stroke="#94a3b8" />
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                                            itemStyle={{ color: '#e2e8f0' }}
                                                        />
                                                        <Bar dataKey="minutes" fill="#60a5fa" radius={[4, 4, 0, 0]}>
                                                            {
                                                                [0, 1, 2].map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#60a5fa', '#34d399', '#a78bfa'][index]} />
                                                                ))
                                                            }
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="parent-db-projects-section">
                                            <h3>Dự Án & Thực Hành</h3>
                                            <div className="parent-db-projects-list">
                                                {student.projects.map(p => (
                                                    <div key={p.id} className="parent-db-project-item">
                                                        <div className="parent-db-project-info">
                                                            <h4>{p.title}</h4>
                                                            <div className="parent-db-tech-stack">
                                                                {p.skills.map(skill => <span key={skill}>{skill}</span>)}
                                                            </div>
                                                        </div>
                                                        <div className={`parent-db-project-status ${p.status.toLowerCase().replace(' ', '-')}`}>
                                                            {p.status} {p.score && `- ${p.score}/100`}
                                                        </div>
                                                    </div>
                                                ))}
                                                {student.projects.length === 0 && <p style={{color: '#94a3b8'}}>Chưa có dự án nào.</p>}
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
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDepositModal(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        <motion.div 
                            className="deposit-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#1e293b',
                                padding: '2rem',
                                borderRadius: '16px',
                                width: '100%',
                                maxWidth: '400px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                            }}
                        >
                            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e2e8f0' }}>
                                <Wallet color="#60a5fa" /> Nạp Tiền Vào Ví
                            </h2>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Số tiền muốn nạp (VNĐ)</label>
                                <input 
                                    type="number" 
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="VD: 100000"
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontSize: '1.2rem',
                                        outline: 'none'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {[50000, 100000, 200000, 500000].map(amt => (
                                        <button 
                                            key={amt}
                                            onClick={() => setDepositAmount(amt.toString())}
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                fontSize: '0.85rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px',
                                                color: '#cbd5e1',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {formatCurrency(amt)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    onClick={() => setShowDepositModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: '#e2e8f0',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleDeposit}
                                    disabled={isDepositing}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        cursor: isDepositing ? 'not-allowed' : 'pointer',
                                        opacity: isDepositing ? 0.7 : 1
                                    }}
                                >
                                    {isDepositing ? 'Đang xử lý...' : 'Thanh Toán PayOS'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Roadmap Modal */}
            <AnimatePresence>
                {showRoadmapModal && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowRoadmapModal(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                    >
                        <motion.div 
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '2rem',
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, color: '#f8fafc' }}>Lộ Trình Học Tập</h2>
                                <button 
                                    onClick={() => setShowRoadmapModal(false)}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {loadingRoadmaps ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
                            ) : studentRoadmaps.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Học sinh chưa tạo lộ trình nào.</div>
                            ) : (
                                <div className="roadmaps-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {studentRoadmaps.map((roadmap: any) => (
                                        <div key={roadmap.id} style={{ 
                                            background: 'rgba(255,255,255,0.05)', 
                                            padding: '1.5rem', 
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0, color: '#60a5fa' }}>{roadmap.title}</h3>
                                                <span style={{ 
                                                    fontSize: '0.8rem', 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '999px', 
                                                    background: roadmap.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                    color: roadmap.status === 'COMPLETED' ? '#4ade80' : '#60a5fa'
                                                }}>
                                                    {roadmap.status}
                                                </span>
                                            </div>
                                            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>{roadmap.description}</p>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                                <span>📅 {new Date(roadmap.createdAt).toLocaleDateString('vi-VN')}</span>
                                                <span>⏱️ {roadmap.duration}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Sessions Modal */}
            <AnimatePresence>
                {showChatSessionsModal && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowChatSessionsModal(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                    >
                        <motion.div 
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '2rem',
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, color: '#f8fafc' }}>
                                    {selectedChatSession ? 'Chi Tiết Phiên Chat' : 'Lịch Sử Chat AI'}
                                </h2>
                                <button 
                                    onClick={() => {
                                        if (selectedChatSession) {
                                            setSelectedChatSession(null);
                                        } else {
                                            setShowChatSessionsModal(false);
                                        }
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {loadingChatSessions ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
                            ) : selectedChatSession ? (
                                <div className="chat-messages-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {loadingChatMessages ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Đang tải tin nhắn...</div>
                                    ) : (
                                        chatSessionMessages.map((msg) => (
                                            <div key={msg.id} style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '0.5rem',
                                                marginBottom: '1rem'
                                            }}>
                                                <div style={{ 
                                                    alignSelf: 'flex-end', 
                                                    background: '#3b82f6', 
                                                    color: 'white', 
                                                    padding: '0.75rem 1rem', 
                                                    borderRadius: '12px 12px 0 12px',
                                                    maxWidth: '80%'
                                                }}>
                                                    {msg.userMessage}
                                                </div>
                                                <div style={{ 
                                                    alignSelf: 'flex-start', 
                                                    background: '#334155', 
                                                    color: '#e2e8f0', 
                                                    padding: '0.75rem 1rem', 
                                                    borderRadius: '12px 12px 12px 0',
                                                    maxWidth: '80%'
                                                }}>
                                                    {msg.aiResponse}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
                                                    {new Date(msg.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : studentChatSessions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Học sinh chưa có phiên chat nào.</div>
                            ) : (
                                <div className="chat-sessions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {studentChatSessions.map((session) => (
                                        <div 
                                            key={session.sessionId} 
                                            onClick={() => selectedStudentId && handleViewChatSessionDetails(selectedStudentId, session)}
                                            style={{ 
                                                background: 'rgba(255,255,255,0.05)', 
                                                padding: '1.5rem', 
                                                borderRadius: '12px', 
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '1rem' }}>{session.title || `Session #${session.sessionId}`}</h3>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    {new Date(session.lastMessageAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                                                {session.messageCount} tin nhắn
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Learning Report Modal */}
            {selectedStudentForReport && (
                <StudentLearningReport
                    student={selectedStudentForReport}
                    isOpen={showLearningReport}
                    onClose={() => {
                        setShowLearningReport(false);
                        setSelectedStudentForReport(null);
                    }}
                />
            )}
        </div>
    );
};

export default ParentDashboard;
