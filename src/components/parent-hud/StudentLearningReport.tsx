import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    FileText, 
    Target, 
    CheckCircle, 
    Brain, 
    Star, 
    AlertCircle, 
    Calendar,
    Loader2,
    RefreshCw,
    Download
} from 'lucide-react';
import parentService, { StudentDetail } from '../../services/parentService';
import ReactMarkdown from 'react-markdown';

interface StudentLearningReportProps {
    student: StudentDetail;
    isOpen: boolean;
    onClose: () => void;
}

export interface LearningReportData {
    generatedAt: string;
    studentId: number;
    studentName: string;
    reportContent: string;
    sections: {
        learningGoals: string;
        achievements: string;
        learningBehavior: string;
        strengths: string;
        risksAndGaps: string;
        recommendations: string;
    };
}

const StudentLearningReport: React.FC<StudentLearningReportProps> = ({ student, isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<LearningReportData | null>(null);
    const [reportHistory, setReportHistory] = useState<LearningReportData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>('full');
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Load latest report and history when modal opens (don't auto-generate)
    useEffect(() => {
        if (isOpen && student) {
            loadLatestReport();
        }
    }, [isOpen, student?.id]);

    const loadLatestReport = async () => {
        setLoadingHistory(true);
        setError(null);
        try {
            // Load the latest existing report
            const latest = await parentService.getLatestLearningReport(student.id);
            if (latest) {
                setReport(latest);
            }
            // Also load history
            const history = await parentService.getLearningReportHistory(student.id);
            setReportHistory(history);
        } catch (err: any) {
            console.error("Failed to load learning report", err);
            // Don't show error - just means no reports yet
        } finally {
            setLoadingHistory(false);
        }
    };

    const generateNewReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const reportData = await parentService.generateLearningReport(student.id);
            setReport(reportData);
            // Reload history to include new report
            const history = await parentService.getLearningReportHistory(student.id);
            setReportHistory(history);
        } catch (err: any) {
            console.error("Failed to generate learning report", err);
            setError(err.response?.data?.message || "Không thể tạo báo cáo. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!report) return;
        // Create a printable version
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Báo Cáo Học Tập - ${student.firstName} ${student.lastName}</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; padding: 40px; line-height: 1.8; color: #1e293b; }
                        h1 { color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                        h2 { color: #1e3a8a; margin-top: 30px; }
                        h3 { color: #334155; }
                        .meta { color: #64748b; font-size: 14px; margin-bottom: 20px; }
                        ul { margin-left: 20px; }
                        li { margin: 8px 0; }
                        .data-label { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
                        .ai-label { background: #f3e8ff; color: #7c3aed; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
                        blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #475569; }
                    </style>
                </head>
                <body>
                    <h1>📊 Báo Cáo Học Tập</h1>
                    <div class="meta">
                        <strong>Học viên:</strong> ${student.firstName} ${student.lastName}<br>
                        <strong>Email:</strong> ${student.email}<br>
                        <strong>Ngày tạo:</strong> ${new Date(report.generatedAt).toLocaleDateString('vi-VN', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    ${report.reportContent.replace(/\*\*/g, '<strong>').replace(/\n/g, '<br>')}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const sections = [
        { id: 'full', label: 'Toàn bộ', icon: FileText },
        { id: 'learningGoals', label: 'Mục tiêu', icon: Target },
        { id: 'achievements', label: 'Kết quả', icon: CheckCircle },
        { id: 'learningBehavior', label: 'Hành vi học', icon: Brain },
        { id: 'strengths', label: 'Điểm mạnh', icon: Star },
        { id: 'risksAndGaps', label: 'Lưu ý', icon: AlertCircle },
        { id: 'recommendations', label: 'Khuyến nghị', icon: Calendar },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '20px',
                            width: '100%',
                            maxWidth: '1000px',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.1)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(59, 130, 246, 0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FileText size={24} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.25rem' }}>
                                        Báo Cáo Học Tập
                                    </h2>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
                                        {student.firstName} {student.lastName}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={generateNewReport}
                                    disabled={loading}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(59, 130, 246, 0.5)',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        color: '#e2e8f0',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                                    Tạo lại
                                </button>
                                {report && (
                                    <button
                                        onClick={handleDownloadPDF}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <Download size={16} />
                                        In/PDF
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        padding: '0.5rem'
                                    }}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                            {/* Section Tabs */}
                            <div style={{
                                width: '200px',
                                borderRight: '1px solid rgba(255,255,255,0.1)',
                                padding: '1rem',
                                overflowY: 'auto',
                                flexShrink: 0
                            }}>
                                {sections.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            marginBottom: '0.5rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: activeSection === section.id 
                                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 100%)'
                                                : 'transparent',
                                            color: activeSection === section.id ? '#60a5fa' : '#94a3b8',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            fontSize: '0.85rem',
                                            textAlign: 'left',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <section.icon size={18} />
                                        {section.label}
                                    </button>
                                ))}
                            </div>

                            {/* Report Content */}
                            <div style={{
                                flex: 1,
                                padding: '2rem',
                                overflowY: 'auto'
                            }}>
                                {loading ? (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        gap: '1rem'
                                    }}>
                                        <Loader2 size={48} color="#60a5fa" className="spinning" />
                                        <p style={{ color: '#94a3b8' }}>Đang phân tích dữ liệu học tập...</p>
                                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                            AI đang tổng hợp từ roadmap, chat sessions và hoạt động học tập
                                        </p>
                                    </div>
                                ) : error ? (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        gap: '1rem'
                                    }}>
                                        <AlertCircle size={48} color="#ef4444" />
                                        <p style={{ color: '#ef4444' }}>{error}</p>
                                        <button
                                            onClick={generateNewReport}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Thử lại
                                        </button>
                                    </div>
                                ) : report ? (
                                    <div className="learning-report-content" style={{
                                        color: '#e2e8f0',
                                        lineHeight: 1.8
                                    }}>
                                        {/* Report timestamp */}
                                        <div style={{
                                            marginBottom: '1.5rem',
                                            padding: '0.75rem 1rem',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            borderRadius: '8px',
                                            borderLeft: '4px solid #3b82f6',
                                            fontSize: '0.85rem',
                                            color: '#94a3b8'
                                        }}>
                                            <strong style={{ color: '#60a5fa' }}>Thời điểm phân tích:</strong>{' '}
                                            {new Date(report.generatedAt).toLocaleString('vi-VN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>

                                        {/* Render content based on active section */}
                                        {activeSection === 'full' ? (
                                            <div className="markdown-content">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({children}) => <h1 style={{ color: '#f8fafc', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', marginTop: '2rem' }}>{children}</h1>,
                                                        h2: ({children}) => <h2 style={{ color: '#60a5fa', marginTop: '1.5rem' }}>{children}</h2>,
                                                        h3: ({children}) => <h3 style={{ color: '#94a3b8', marginTop: '1rem' }}>{children}</h3>,
                                                        p: ({children}) => <p style={{ marginBottom: '1rem' }}>{children}</p>,
                                                        ul: ({children}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>{children}</ul>,
                                                        li: ({children}) => <li style={{ marginBottom: '0.5rem' }}>{children}</li>,
                                                        strong: ({children}) => <strong style={{ color: '#f8fafc' }}>{children}</strong>,
                                                        blockquote: ({children}) => (
                                                            <blockquote style={{
                                                                borderLeft: '4px solid #60a5fa',
                                                                paddingLeft: '1rem',
                                                                margin: '1rem 0',
                                                                color: '#cbd5e1',
                                                                fontStyle: 'italic'
                                                            }}>
                                                                {children}
                                                            </blockquote>
                                                        )
                                                    }}
                                                >
                                                    {report.reportContent}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="section-content">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({children}) => <h1 style={{ color: '#f8fafc', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem' }}>{children}</h1>,
                                                        h2: ({children}) => <h2 style={{ color: '#60a5fa', marginTop: '1.5rem' }}>{children}</h2>,
                                                        h3: ({children}) => <h3 style={{ color: '#94a3b8', marginTop: '1rem' }}>{children}</h3>,
                                                        p: ({children}) => <p style={{ marginBottom: '1rem' }}>{children}</p>,
                                                        ul: ({children}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>{children}</ul>,
                                                        li: ({children}) => <li style={{ marginBottom: '0.5rem' }}>{children}</li>,
                                                        strong: ({children}) => <strong style={{ color: '#f8fafc' }}>{children}</strong>,
                                                    }}
                                                >
                                                    {report.sections[activeSection as keyof typeof report.sections] || 'Không có dữ liệu cho phần này.'}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        gap: '1.5rem'
                                    }}>
                                        {loadingHistory ? (
                                            <>
                                                <RefreshCw size={48} color="#3b82f6" className="spinning" />
                                                <p style={{ color: '#94a3b8' }}>Đang tải báo cáo...</p>
                                            </>
                                        ) : (
                                            <>
                                                <FileText size={64} color="#475569" />
                                                <div style={{ textAlign: 'center' }}>
                                                    <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
                                                        Chưa có báo cáo học tập nào.
                                                    </p>
                                                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                        Nhấn "Tạo lại" để tạo báo cáo mới bằng AI.
                                                    </p>
                                                </div>
                                                {reportHistory.length > 0 && (
                                                    <div style={{
                                                        marginTop: '1rem',
                                                        padding: '1rem',
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        borderRadius: '8px',
                                                        width: '100%',
                                                        maxWidth: '400px'
                                                    }}>
                                                        <p style={{ color: '#60a5fa', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                                            Lịch sử báo cáo ({reportHistory.length})
                                                        </p>
                                                        {reportHistory.slice(0, 3).map((hist, idx) => (
                                                            <div 
                                                                key={idx}
                                                                onClick={() => setReport(hist)}
                                                                style={{
                                                                    padding: '0.5rem',
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    borderRadius: '4px',
                                                                    marginBottom: '0.25rem',
                                                                    cursor: 'pointer',
                                                                    color: '#94a3b8',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                            >
                                                                {new Date(hist.generatedAt).toLocaleString('vi-VN')}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div style={{
                            padding: '1rem 2rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.2)',
                            fontSize: '0.8rem',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertCircle size={14} />
                            <span>
                                Báo cáo được tạo tự động bởi AI dựa trên dữ liệu hoạt động thực tế. 
                                Các nhận định có thể không hoàn toàn chính xác và chỉ mang tính tham khảo.
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Add spinning animation CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .spinning {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(styleSheet);

export default StudentLearningReport;
