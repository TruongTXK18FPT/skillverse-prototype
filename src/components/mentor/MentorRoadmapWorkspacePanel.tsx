import React, { useState, useEffect } from 'react';
import { Target, Video, Plus, Edit, Trash2, Save, X, RefreshCw, LayoutDashboard, ChevronRight, FileText, Calendar } from 'lucide-react';
import { mentorRoadmapWorkspaceService, RoadmapMentorWorkspaceResponse, RoadmapFollowUpMeetingDTO, RoadmapMentorNodeUpsertRequest } from '../../services/mentorRoadmapWorkspaceService';
import { useAppToast } from '../../context/ToastContext';
import NodeMentoringWorkspace from './NodeMentoringWorkspace';
import './MentorRoadmapSettingsTab.css';

interface Props {
  bookingId: number;
}

const MentorRoadmapWorkspacePanel: React.FC<Props> = ({ bookingId }) => {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<RoadmapMentorWorkspaceResponse | null>(null);
  const { showSuccess, showError } = useAppToast();

  // Follow-up Meeting state
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Partial<RoadmapFollowUpMeetingDTO> | null>(null);
  const [meetingSaving, setMeetingSaving] = useState(false);

  // Node state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'MENTORING' | 'EDIT_NODE'>('MENTORING');
  
  // Node editing state
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Partial<RoadmapMentorNodeUpsertRequest> & { isNew?: boolean }>({});
  const [nodeSaving, setNodeSaving] = useState(false);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const data = await mentorRoadmapWorkspaceService.getWorkspace(bookingId);
      setWorkspace(data);
    } catch (err) {
      console.error(err);
      showError('Lỗi', 'Không thể tải workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [bookingId]);

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting?.title || !editingMeeting.scheduledAt) {
      showError('Lỗi', 'Vui lòng điền tiêu đề và thời gian.');
      return;
    }

    try {
      setMeetingSaving(true);
      if (editingMeeting.id) {
        await mentorRoadmapWorkspaceService.updateFollowUp(bookingId, editingMeeting.id, editingMeeting);
        showSuccess('Thành công', 'Đã cập nhật meeting.');
      } else {
        await mentorRoadmapWorkspaceService.createFollowUp(bookingId, {
          title: editingMeeting.title,
          scheduledAt: editingMeeting.scheduledAt,
          durationMinutes: editingMeeting.durationMinutes || 60,
          meetingLink: editingMeeting.meetingLink,
          agenda: editingMeeting.agenda,
        } as RoadmapFollowUpMeetingDTO);
        showSuccess('Thành công', 'Đã tạo meeting mới.');
      }
      setFollowUpModalOpen(false);
      loadWorkspace();
    } catch (err) {
      console.error(err);
      showError('Lỗi', 'Không thể lưu meeting.');
    } finally {
      setMeetingSaving(false);
    }
  };

  const handleDeleteFollowUp = async (meetingId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa meeting này?')) return;
    try {
      await mentorRoadmapWorkspaceService.deleteFollowUp(bookingId, meetingId);
      showSuccess('Thành công', 'Đã xóa meeting.');
      loadWorkspace();
    } catch (err) {
      console.error(err);
      showError('Lỗi', 'Không thể xóa meeting.');
    }
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode.title) {
      showError('Lỗi', 'Vui lòng nhập tên Node.');
      return;
    }

    try {
      setNodeSaving(true);
      if (editingNode.isNew) {
        await mentorRoadmapWorkspaceService.createNode(bookingId, editingNode as RoadmapMentorNodeUpsertRequest);
        showSuccess('Thành công', 'Đã thêm Node mới.');
      } else if (editingNode.nodeId) {
        await mentorRoadmapWorkspaceService.updateNode(bookingId, editingNode.nodeId, editingNode as RoadmapMentorNodeUpsertRequest);
        showSuccess('Thành công', 'Đã cập nhật Node.');
        setSelectedNodeId(editingNode.nodeId);
      }
      setNodeModalOpen(false);
      loadWorkspace();
    } catch (err) {
      console.error(err);
      showError('Lỗi', 'Không thể lưu Node.');
    } finally {
      setNodeSaving(false);
    }
  };

  const selectedNode = workspace?.roadmap?.nodes?.find((n: any) => n.id === selectedNodeId);

  if (loading) {
    return (
      <div className="mentor-roadmap-settings-loading">
        <div className="spinner"></div>
        <p>Đang tải Workspace...</p>
      </div>
    );
  }

  if (!workspace) {
    return <div className="mr-empty-state">Không có dữ liệu workspace.</div>;
  }

  return (
    <div className="mr-workspace-panel">
      <div className="mr-workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Workspace Đồng Hành (Booking #{workspace.booking.id})</h2>
          <p style={{ color: 'var(--mr-text-muted)' }}>Quản lý roadmap và lịch hẹn cho học viên {workspace.booking.learnerName}</p>
        </div>
        <button className="mr-btn-secondary" onClick={loadWorkspace}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div className="mr-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Roadmap Tree & Journey Info */}
        <div className="mr-workspace-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Roadmap Tree */}
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#e2e8f0' }}>Roadmap Tree</h3>
              <button 
                className="mr-btn-primary" 
                onClick={() => {
                  setEditingNode({ isNew: true, title: '', type: 'MAIN', estimatedTimeMinutes: 120 });
                  setNodeModalOpen(true);
                }}
                style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <Plus size={14} /> Thêm Node
              </button>
            </div>

            <div className="mr-nodes-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {workspace.roadmap?.nodes ? (
                (workspace.roadmap.nodes as any[]).map((node, index) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <div 
                      key={node.id} 
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setRightPanelTab('MENTORING');
                      }}
                      style={{ 
                        padding: '0.75rem 1rem', 
                        background: isSelected ? 'rgba(8, 145, 178, 0.15)' : 'rgba(255,255,255,0.03)', 
                        border: `1px solid ${isSelected ? '#0891b2' : 'var(--mr-border)'}`, 
                        borderRadius: '8px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '24px', height: '24px', background: isSelected ? '#0891b2' : '#334155', color: '#fff', borderRadius: '50%', fontSize: '0.75rem', flexShrink: 0 }}>
                          {index + 1}
                        </span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', color: isSelected ? '#22d3ee' : '#e2e8f0' }}>
                            {node.title}
                          </h4>
                          <div style={{ fontSize: '0.75rem', color: 'var(--mr-text-muted)', marginTop: '0.25rem' }}>
                            {node.type === 'MAIN' ? 'Chính' : 'Phụ'} • {node.estimatedTimeMinutes} phút
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: isSelected ? '#22d3ee' : '#64748b' }} />
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--mr-text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Chưa có node nào. Hãy thêm node đầu tiên.</p>
              )}
            </div>
            
            <button
              onClick={() => setSelectedNodeId(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                background: !selectedNodeId ? 'rgba(8, 145, 178, 0.15)' : 'transparent',
                border: `1px solid ${!selectedNodeId ? '#0891b2' : '#334155'}`,
                color: !selectedNodeId ? '#22d3ee' : '#e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <Target size={16} /> Thông tin chung & Gate
            </button>
          </div>

          {/* Follow-up Meetings Summary */}
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} /> Lịch hẹn ({workspace.followUpMeetings.length})
              </h3>
              <button 
                className="mr-btn-primary" 
                onClick={() => {
                  setEditingMeeting({ title: '', scheduledAt: new Date().toISOString().slice(0, 16), durationMinutes: 60 });
                  setFollowUpModalOpen(true);
                }}
                style={{ padding: '0.25rem', background: 'transparent', color: '#22d3ee', border: 'none', cursor: 'pointer' }}
                title="Thêm lịch hẹn"
              >
                <Plus size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
              {workspace.followUpMeetings.length > 0 ? (
                workspace.followUpMeetings.map((meeting) => (
                  <div key={meeting.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ color: '#22d3ee' }}>{meeting.title}</strong>
                      <span style={{ fontSize: '0.7rem', padding: '2px 4px', background: meeting.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: meeting.status === 'COMPLETED' ? '#10b981' : '#f59e0b', borderRadius: '4px' }}>
                        {meeting.status}
                      </span>
                    </div>
                    <div style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
                      {new Date(meeting.scheduledAt).toLocaleString('vi-VN')}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setEditingMeeting(meeting); setFollowUpModalOpen(true); }} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0 }}><Edit size={14} /></button>
                      <button onClick={() => handleDeleteFollowUp(meeting.id!)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><Trash2 size={14} /></button>
                      {meeting.meetingLink && (
                        <a href={meeting.meetingLink} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: '#22d3ee' }}><Video size={14} /></a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--mr-text-muted)', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>Chưa có lịch hẹn.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Node Details & Mentoring Workspace */}
        <div className="mr-workspace-column" style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {selectedNodeId ? (
            <>
              {/* Tabs for Selected Node */}
              <div style={{ display: 'flex', borderBottom: '1px solid #334155', background: 'rgba(15, 23, 42, 0.8)' }}>
                <button
                  onClick={() => setRightPanelTab('MENTORING')}
                  style={{
                    flex: 1, padding: '1rem', background: 'transparent', border: 'none',
                    borderBottom: rightPanelTab === 'MENTORING' ? '2px solid #0891b2' : '2px solid transparent',
                    color: rightPanelTab === 'MENTORING' ? '#22d3ee' : '#94a3b8',
                    fontWeight: rightPanelTab === 'MENTORING' ? 'bold' : 'normal',
                    cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center'
                  }}
                >
                  <FileText size={16} /> Chấm điểm & Review Node
                </button>
                <button
                  onClick={() => setRightPanelTab('EDIT_NODE')}
                  style={{
                    flex: 1, padding: '1rem', background: 'transparent', border: 'none',
                    borderBottom: rightPanelTab === 'EDIT_NODE' ? '2px solid #0891b2' : '2px solid transparent',
                    color: rightPanelTab === 'EDIT_NODE' ? '#22d3ee' : '#94a3b8',
                    fontWeight: rightPanelTab === 'EDIT_NODE' ? 'bold' : 'normal',
                    cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center'
                  }}
                >
                  <Edit size={16} /> Chỉnh sửa Node
                </button>
              </div>

              {/* Tab Content */}
              <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                {rightPanelTab === 'MENTORING' && (
                  <div className="mr-embedded-mentoring">
                    <NodeMentoringWorkspace 
                      booking={{
                        ...workspace.booking,
                        journeyId: workspace.journeyId,
                        nodeId: selectedNodeId
                      }}
                      onActionComplete={loadWorkspace}
                    />
                  </div>
                )}
                
                {rightPanelTab === 'EDIT_NODE' && selectedNode && (
                  <div className="mr-edit-node-panel">
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Edit size={18} /> Chỉnh sửa thông tin Node
                    </h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setEditingNode({ ...selectedNode, nodeId: selectedNode.id });
                      handleSaveNode(e);
                    }}>
                      {/* Reuse the same form fields but embedded */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>Tên Node</label>
                        <input 
                          type="text" 
                          defaultValue={selectedNode.title || ''} 
                          onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                          required
                        />
                      </div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>Mô tả ngắn</label>
                        <textarea 
                          defaultValue={selectedNode.description || ''} 
                          onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', minHeight: '100px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>Thời gian (phút)</label>
                          <input 
                            type="number" 
                            defaultValue={selectedNode.estimatedTimeMinutes || 120} 
                            onChange={(e) => setEditingNode({ ...editingNode, estimatedTimeMinutes: Number(e.target.value) })}
                            style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem' }}>Loại Node</label>
                          <select
                            defaultValue={selectedNode.type || 'MAIN'} 
                            onChange={(e) => setEditingNode({ ...editingNode, type: e.target.value as any })}
                            style={{ width: '100%', padding: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                          >
                            <option value="MAIN">Node Chính (Main)</option>
                            <option value="SIDE">Node Phụ (Side)</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" disabled={nodeSaving} style={{ width: '100%', padding: '0.75rem', background: '#0891b2', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                        <Save size={18} /> {nodeSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '1.5rem', height: '100%', overflowY: 'auto' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={20} /> Thông tin chung & Hành trình
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Bạn có thể xem tổng quan và quyết định xác nhận hoàn thành Roadmap cho học viên tại đây.</p>
              </div>
              
              <div className="mr-embedded-mentoring">
                <NodeMentoringWorkspace 
                  booking={{
                    ...workspace.booking,
                    journeyId: workspace.journeyId
                    // No nodeId -> forces it to default to FINAL_CONFIRMATION logic or disabled review
                  }}
                  onActionComplete={loadWorkspace}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Follow-Up Meeting Modal ── */}
      {followUpModalOpen && editingMeeting && (
        <div className="mr-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mr-modal-content" style={{ background: '#1e293b', width: '500px', maxWidth: '90vw', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>{editingMeeting.id ? 'Sửa Lịch Hẹn' : 'Tạo Lịch Hẹn Mới'}</h3>
              <button onClick={() => setFollowUpModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveFollowUp} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Tiêu đề</label>
                <input 
                  type="text" 
                  value={editingMeeting.title || ''} 
                  onChange={(e) => setEditingMeeting({ ...editingMeeting, title: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Thời gian</label>
                  <input 
                    type="datetime-local" 
                    value={editingMeeting.scheduledAt ? new Date(editingMeeting.scheduledAt).toISOString().slice(0, 16) : ''} 
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, scheduledAt: new Date(e.target.value).toISOString() })}
                    style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Thời lượng (phút)</label>
                  <input 
                    type="number" 
                    value={editingMeeting.durationMinutes || 60} 
                    onChange={(e) => setEditingMeeting({ ...editingMeeting, durationMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Link Meeting</label>
                <input 
                  type="url" 
                  value={editingMeeting.meetingLink || ''} 
                  onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingLink: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Agenda / Nội dung</label>
                <textarea 
                  value={editingMeeting.agenda || ''} 
                  onChange={(e) => setEditingMeeting({ ...editingMeeting, agenda: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setFollowUpModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #334155', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={meetingSaving} style={{ padding: '0.5rem 1rem', background: '#0891b2', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} /> {meetingSaving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Node Editor Modal ── */}
      {nodeModalOpen && editingNode && (
        <div className="mr-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mr-modal-content" style={{ background: '#1e293b', width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', border: '1px solid #334155' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#1e293b', zIndex: 10 }}>
              <h3 style={{ margin: 0, color: '#fff' }}>{editingNode.isNew ? 'Thêm Node Mới' : 'Sửa Node'}</h3>
              <button onClick={() => setNodeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveNode} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Tên Node</label>
                <input 
                  type="text" 
                  value={editingNode.title || ''} 
                  onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Mô tả ngắn</label>
                <textarea 
                  value={editingNode.description || ''} 
                  onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Thời gian dự kiến (phút)</label>
                  <input 
                    type="number" 
                    value={editingNode.estimatedTimeMinutes || 120} 
                    onChange={(e) => setEditingNode({ ...editingNode, estimatedTimeMinutes: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '0.85rem' }}>Loại Node</label>
                  <select
                    value={editingNode.type || 'MAIN'} 
                    onChange={(e) => setEditingNode({ ...editingNode, type: e.target.value as any })}
                    style={{ width: '100%', padding: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="MAIN">Node Chính (Main)</option>
                    <option value="SIDE">Node Phụ (Side)</option>
                  </select>
                </div>
              </div>
              
              <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px dashed #0891b2', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#22d3ee' }}>
                  Tính năng chỉnh sửa sâu (tiêu chí đánh giá, danh sách bài tập thực hành...) sẽ được mở trong cập nhật tiếp theo.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" onClick={() => setNodeModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #334155', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={nodeSaving} style={{ padding: '0.5rem 1rem', background: '#0891b2', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} /> {nodeSaving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MentorRoadmapWorkspacePanel;
