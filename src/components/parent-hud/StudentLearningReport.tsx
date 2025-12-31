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
    Download,
    ShieldCheck
} from 'lucide-react';
import parentService, { StudentDetail } from '../../services/parentService';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

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
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>('full');

    // Load latest report and history when modal opens (don't auto-generate)
    useEffect(() => {
        if (isOpen && student) {
            loadLatestReport();
        }
    }, [isOpen, student?.id]);

    const loadLatestReport = async () => {
        setError(null);
        try {
            // Load the latest existing report
            const latest = await parentService.getLatestLearningReport(student.id);
            if (latest) {
                setReport(latest);
            }
        } catch (err: any) {
            console.error("Failed to load learning report", err);
            // Don't show error - just means no reports yet
        }
    };

    const formatAiResponse = (text: string) => {
        if (!text) return '';
        // Remove <thinking>...</thinking> tags and their content
        return text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
    };

    const generateNewReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const reportData = await parentService.generateLearningReport(student.id);
            setReport(reportData);
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
                        <strong>Ngày tạo:</strong> ${report.generatedAt && new Date(report.generatedAt).getTime() ? new Date(report.generatedAt).toLocaleDateString('vi-VN', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : 'Không rõ ngày'}
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
                    className="parent-v2-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={e => e.stopPropagation()}
                        className="parent-v2-modal-content"
                        style={{
                            width: '100%',
                            maxWidth: '1000px',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 0,
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid var(--p-card-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'var(--p-card-bg)',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, var(--p-accent-gold) 0%, #b45309 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)'
                                }}>
                                    <FileText size={24} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, color: 'var(--p-text)', fontSize: '1.5rem', fontWeight: 800 }}>
                                        BÁO CÁO PHÂN TÍCH HỌC TẬP
                                    </h2>
                                    <p style={{ margin: 0, color: 'var(--p-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        HỌC SINH: {student.firstName} {student.lastName}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginRight: '3rem' }}>
                                <button
                                    onClick={generateNewReport}
                                    disabled={loading}
                                    className="parent-v2-btn-gold"
                                    style={{
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                                    QUÉT LẠI
                                </button>
                                {report && (
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="parent-v2-btn-cyan"
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        <Download size={16} />
                                        XUẤT DỮ LIỆU
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="parent-db-modal-close"
                                style={{ top: '50%', transform: 'translateY(-50%)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                            {/* Section Tabs */}
                            <div style={{
                                width: '220px',
                                borderRight: '1px solid var(--p-card-border)',
                                padding: '1rem',
                                overflowY: 'auto',
                                flexShrink: 0,
                                background: 'var(--p-card-bg)'
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
                                            border: activeSection === section.id ? '1px solid var(--p-accent-cyan)' : '1px solid transparent',
                                            background: activeSection === section.id 
                                                ? 'rgba(6, 182, 212, 0.1)'
                                                : 'transparent',
                                            color: activeSection === section.id ? 'var(--p-accent-cyan)' : 'var(--p-text-muted)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            fontWeight: 700,
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

                            {/* Report Body */}
                            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: 'var(--p-bg)' }}>
                                {loading ? (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                        <Loader2 size={48} color="var(--p-accent-gold)" className="spinning" />
                                        <p style={{ color: 'var(--p-accent-gold)', fontWeight: 700 }}>ĐANG PHÂN TÍCH DỮ LIỆU HỌC TẬP...</p>
                                    </div>
                                ) : error ? (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--p-accent-red)' }}>
                                        <AlertCircle size={48} />
                                        <p style={{ fontWeight: 700 }}>{error}</p>
                                        <button onClick={generateNewReport} className="parent-v2-btn-gold">THỬ LẠI</button>
                                    </div>
                                ) : report ? (
                                    <div className="report-content-v2">
                                        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--p-input-bg)', border: '1px solid var(--p-card-border)', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, color: 'var(--p-accent-cyan)', fontSize: '0.85rem', fontWeight: 700 }}>
                                                THỜI GIAN CẬP NHẬT: {new Date(report.generatedAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                        
                                        <div className="markdown-body-v2" style={{ color: 'var(--p-text)', lineHeight: '1.8', fontSize: '1.05rem' }}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkBreaks]}
                                                components={{
                                                    h1: ({children}) => <h1 style={{ color: 'var(--p-text)', borderBottom: '2px solid var(--p-accent-cyan)', paddingBottom: '0.5rem', marginTop: '2rem', fontWeight: 700 }}>{children}</h1>,
                                                    h2: ({children}) => <h2 style={{ color: 'var(--p-accent-cyan)', marginTop: '1.5rem', fontWeight: 600 }}>{children}</h2>,
                                                    h3: ({children}) => <h3 style={{ color: 'var(--p-text-muted)', marginTop: '1rem', fontWeight: 600 }}>{children}</h3>,
                                                    p: ({children}) => <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>{children}</p>,
                                                    ul: ({children}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>{children}</ul>,
                                                    li: ({children}) => <li style={{ marginBottom: '0.5rem' }}>{children}</li>,
                                                    strong: ({children}) => <strong style={{ color: 'var(--p-accent-gold)', fontWeight: 700 }}>{children}</strong>,
                                                    blockquote: ({children}) => (
                                                        <blockquote style={{
                                                            borderLeft: '4px solid var(--p-accent-cyan)',
                                                            paddingLeft: '1rem',
                                                            margin: '1rem 0',
                                                            color: 'var(--p-text-muted)',
                                                            fontStyle: 'italic',
                                                            background: 'rgba(6, 182, 212, 0.05)',
                                                            padding: '1rem',
                                                            borderRadius: '0 8px 8px 0'
                                                        }}>
                                                            {children}
                                                        </blockquote>
                                                    )
                                                }}
                                            >
                                                {activeSection === 'full' 
                                                    ? formatAiResponse(report.reportContent) 
                                                    : formatAiResponse((report.sections as any)[activeSection])}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={40} color="var(--p-accent-gold)" />
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <h3 style={{ color: 'var(--p-text)', marginBottom: '0.5rem', fontWeight: 600 }}>KHÔNG TÌM THẤY DỮ LIỆU</h3>
                                            <p style={{ color: 'var(--p-text-muted)', maxWidth: '300px', margin: '0 auto', fontSize: '0.9rem' }}>
                                                Tạo báo cáo hiệu suất mới để phân tích tiến trình học tập của học viên.
                                            </p>
                                        </div>
                                        <button onClick={generateNewReport} className="parent-v2-btn-gold">
                                            BẮT ĐẦU PHÂN TÍCH
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div style={{
                            padding: '1rem 2rem',
                            borderTop: '1px solid var(--p-border)',
                            background: 'rgba(0,0,0,0.05)',
                            fontSize: '0.75rem',
                            color: 'var(--p-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <ShieldCheck size={14} />
                            <span>
                                DỮ LIỆU ĐƯỢC TẠO BỞI HỆ THỐNG AI SKILLVERSE. TẤT CẢ PHÂN TÍCH DỰA TRÊN HOẠT ĐỘNG CỦA HỌC VIÊN.
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
