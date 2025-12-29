import React, { useEffect, useState } from 'react';
import parentService, { ParentStudentLinkResponse } from '../../../services/parentService';
import { Check, X, UserPlus, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ParentRequests = () => {
    const navigate = useNavigate();
    const [pendingRequests, setPendingRequests] = useState<ParentStudentLinkResponse[]>([]);
    const [activeLinks, setActiveLinks] = useState<ParentStudentLinkResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const links = await parentService.getStudentLinks();
            // Separate PENDING and ACTIVE links
            setPendingRequests(links.filter(l => l.status === 'PENDING'));
            setActiveLinks(links.filter(l => l.status === 'ACTIVE'));
        } catch (error) {
            console.error('Failed to load parent requests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (linkId: number, status: 'ACTIVE' | 'REJECTED') => {
        try {
            await parentService.updateLinkStatus(linkId, status);
            loadRequests(); // Reload list
        } catch (error) {
            console.error('Failed to update request', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
        }
    };

    if (loading) return null;
    
    // Show nothing if no links at all
    if (pendingRequests.length === 0 && activeLinks.length === 0) return null;

    return (
        <div className="pilot-section" style={{ marginTop: '2rem' }}>
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
                <>
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <UserPlus size={20} color="#fbbf24" />
                        <h3 style={{ margin: 0, color: '#fbbf24' }}>Yêu cầu kết nối từ phụ huynh ({pendingRequests.length})</h3>
                    </div>
                    <div className="requests-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        {pendingRequests.map(req => (
                            <div key={req.id} style={{ 
                                background: 'rgba(251, 191, 36, 0.1)', 
                                padding: '1rem', 
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid rgba(251, 191, 36, 0.3)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>
                                        {req.parent?.firstName} {req.parent?.lastName || req.parent?.email}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#aaa' }}>{req.parent?.email}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.25rem' }}>
                                        ⏳ Đang chờ phê duyệt
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => handleAction(req.id, 'ACTIVE')}
                                        style={{ 
                                            background: '#22c55e', 
                                            border: 'none', 
                                            borderRadius: '8px', 
                                            padding: '0.5rem 1rem', 
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                        title="Chấp nhận"
                                    >
                                        <Check size={18} /> Chấp nhận
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.id, 'REJECTED')}
                                        style={{ 
                                            background: '#ef4444', 
                                            border: 'none', 
                                            borderRadius: '8px', 
                                            padding: '0.5rem 1rem', 
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                        title="Từ chối"
                                    >
                                        <X size={18} /> Từ chối
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Active Connections Section */}
            {activeLinks.length > 0 && (
                <>
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Users size={20} color="#22c55e" />
                        <h3 style={{ margin: 0, color: '#22c55e' }}>Phụ huynh đã kết nối ({activeLinks.length})</h3>
                    </div>
                    <div className="active-links-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activeLinks.map(link => (
                            <div key={link.id} style={{ 
                                background: 'rgba(34, 197, 94, 0.1)', 
                                padding: '1rem', 
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '1px solid rgba(34, 197, 94, 0.3)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <img 
                                        src={link.parent?.avatarUrl || '/images/meowl.jpg'} 
                                        alt={link.parent?.firstName || 'Parent'} 
                                        style={{ 
                                            width: '48px', 
                                            height: '48px', 
                                            borderRadius: '50%', 
                                            objectFit: 'cover',
                                            border: '2px solid #22c55e'
                                        }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#fff' }}>
                                            {link.parent?.firstName} {link.parent?.lastName}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#aaa' }}>{link.parent?.email}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#22c55e', marginTop: '0.25rem' }}>
                                            ✓ Đã kết nối
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate('/messages', { state: { openFamily: true } })}
                                    style={{ 
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                                        border: 'none', 
                                        borderRadius: '8px', 
                                        padding: '0.5rem 1rem', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    <MessageSquare size={18} /> Nhắn tin
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ParentRequests;
