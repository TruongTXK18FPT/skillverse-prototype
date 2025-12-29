import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Check, X, ExternalLink, Bell } from 'lucide-react';
import parentService, { ParentStudentLinkResponse } from '../../services/parentService';

const ParentConnectionSection: React.FC = () => {
    const [links, setLinks] = useState<ParentStudentLinkResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLinks();
    }, []);

    const loadLinks = async () => {
        try {
            const data = await parentService.getStudentLinks();
            setLinks(data);
        } catch (error) {
            console.error('Failed to load parent links', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (linkId: number, status: 'ACTIVE' | 'REJECTED') => {
        try {
            await parentService.updateLinkStatus(linkId, status);
            loadLinks();
        } catch (error) {
            console.error('Failed to update link status', error);
        }
    };

    const pendingLinks = links.filter(l => l.status === 'PENDING');
    const activeLinks = links.filter(l => l.status === 'ACTIVE');

    if (loading) return null;

    return (
        <div className="profile-section" style={{ 
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="profile-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={24} color="#8b5cf6" />
                    <span>Kết nối Phụ huynh</span>
                    {pendingLinks.length > 0 && (
                        <span style={{
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontWeight: 'bold',
                            marginLeft: '0.5rem'
                        }}>
                            {pendingLinks.length} mới
                        </span>
                    )}
                </h2>
                <Link 
                    to="/student-parent-request" 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#8b5cf6',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    Quản lý chi tiết <ExternalLink size={16} />
                </Link>
            </div>

            {/* Pending Requests */}
            {pendingLinks.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                        color: '#f59e0b', 
                        fontSize: '0.9rem', 
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Bell size={16} />
                        Yêu cầu đang chờ duyệt
                    </h3>
                    {pendingLinks.map(link => (
                        <div key={link.id} style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>
                                    {link.parent?.fullName || 'Phụ huynh'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                    {link.parent?.email}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleAction(link.id, 'ACTIVE')}
                                    style={{
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        color: 'white',
                                        fontWeight: '500'
                                    }}
                                >
                                    <Check size={16} /> Chấp nhận
                                </button>
                                <button
                                    onClick={() => handleAction(link.id, 'REJECTED')}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        border: '1px solid rgba(239, 68, 68, 0.5)',
                                        borderRadius: '8px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#ef4444'
                                    }}
                                    title="Từ chối"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Active Links */}
            {activeLinks.length > 0 ? (
                <div>
                    <h3 style={{ 
                        color: '#22c55e', 
                        fontSize: '0.9rem', 
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Check size={16} />
                        Phụ huynh đã liên kết ({activeLinks.length})
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {activeLinks.map(link => (
                            <div key={link.id} style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '10px',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <Users size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '500', color: '#f8fafc', fontSize: '0.9rem' }}>
                                        {link.parent?.fullName || 'Phụ huynh'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                        {link.parent?.email}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : pendingLinks.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    color: '#94a3b8',
                    padding: '1rem'
                }}>
                    <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>Chưa có kết nối phụ huynh nào.</p>
                    <p style={{ fontSize: '0.85rem' }}>Phụ huynh có thể gửi yêu cầu kết nối từ tài khoản của họ.</p>
                </div>
            )}
        </div>
    );
};

export default ParentConnectionSection;
