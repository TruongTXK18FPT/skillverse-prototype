import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import { JobPostingResponse, JobStatus, JobApplicationStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import ApplicantsModal from '../business/ApplicantsModal';
import './fleet-styles.css';

interface OperationLogProps {
  refreshTrigger?: number;
}

const OperationLog: React.FC<OperationLogProps> = ({ refreshTrigger }) => {
  const { showError, showSuccess } = useToast();
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  const [selectedJob, setSelectedJob] = useState<JobPostingResponse | null>(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPostingResponse | null>(null);

  // Reopen Modal State
  const [reopenModal, setReopenModal] = useState<{
    visible: boolean;
    jobId: number | null;
    deadline: string;
    clearApplications: boolean;
    isFree: boolean;
  }>({
    visible: false,
    jobId: null,
    deadline: '',
    clearApplications: true,
    isFree: false
  });

  // Close Modal State
  const [closeModal, setCloseModal] = useState<{
    visible: boolean;
    jobId: number | null;
  }>({
    visible: false,
    jobId: null
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    requiredSkills: [] as string[],
    minBudget: '',
    maxBudget: '',
    deadline: '',
    isRemote: true,
    location: ''
  });

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger, localRefreshTrigger]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getMyJobs();
      setJobs(data);
      
      // If a job is selected, update its details from the fresh data
      if (selectedJob) {
        const updatedSelectedJob = data.find(job => job.id === selectedJob.id);
        if (updatedSelectedJob) {
          setSelectedJob(updatedSelectedJob);
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showError('System Error', 'Failed to retrieve operation logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (window.confirm('Cáº¢NH BÃO: Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n há»§y tin tuyá»ƒn dá»¥ng nÃ y? HÃ nh Ä‘á»™ng nÃ y sáº½ xÃ³a vÄ©nh viá»…n dá»¯ liá»‡u vÃ  Ä‘Æ¡n á»©ng tuyá»ƒn.')) {
      try {
        await jobService.deleteJob(jobId);
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        if (selectedJob?.id === jobId) setSelectedJob(null);
        showSuccess('ThÃ nh CÃ´ng', 'Tin tuyá»ƒn dá»¥ng Ä‘Ã£ Ä‘Æ°á»£c há»§y thÃ nh cÃ´ng.');
      } catch (err: any) {
        console.error('Failed to delete job:', err);
        showError('Error', 'KhÃ´ng thá»ƒ há»§y tin tuyá»ƒn dá»¥ng. Vui lÃ²ng thá»­ láº¡i.');
      }
    }
  };

  const handleCloseJob = (jobId: number) => {
    setCloseModal({
      visible: true,
      jobId: jobId
    });
  };

  const confirmClose = async () => {
    if (!closeModal.jobId) return;

    try {
      await jobService.changeJobStatus(closeModal.jobId, JobStatus.CLOSED);
      // Update local state
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === closeModal.jobId ? { ...job, status: JobStatus.CLOSED } : job
      ));
      if (selectedJob?.id === closeModal.jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: JobStatus.CLOSED } : null);
      }
      showSuccess('Thành Công', 'Nhiá»‡m vá»¥ Ä‘Ã£ Ä‘Æ°á»£c Ä‘Ã³ng láº¡i.');
      setCloseModal({ visible: false, jobId: null });
    } catch (err: any) {
      console.error('Failed to close job:', err);
      showError('Error', 'KhÃ´ng thá»ƒ Ä‘Ã³ng nhiá»‡m vá»¥.');
    }
  };

  const handleReopenClick = (job: JobPostingResponse) => {
    // Check grace period (5 minutes)
    const updatedAt = new Date(job.updatedAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - updatedAt) / (1000 * 60);
    const isFree = diffMinutes <= 5;

    // Default deadline: +30 days
    const defaultDeadline = new Date();
    defaultDeadline.setDate(defaultDeadline.getDate() + 30);
    const deadlineStr = defaultDeadline.toISOString().split('T')[0];

    setReopenModal({
      visible: true,
      jobId: job.id,
      deadline: deadlineStr,
      clearApplications: true,
      isFree
    });
  };

  const confirmReopen = async () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); // Tomorrow
    const minDateStr = minDate.toISOString().split('T')[0];

    if (new Date(reopenModal.deadline) < minDate) {
        showError('Lá»—i NgÃ y ThÃ¡ng', 'Háº¡n chÃ³t pháº£i tá»« ngÃ y mai trá»Ÿ Ä‘i.');
        return;
    }

    if (!reopenModal.jobId) return;

    try {
      await jobService.reopenJob(reopenModal.jobId, {
        deadline: reopenModal.deadline,
        clearApplications: reopenModal.clearApplications
      });
      
      await fetchJobs();
      
      if (selectedJob?.id === reopenModal.jobId) {
         setSelectedJob(prev => prev ? { ...prev, status: JobStatus.OPEN } : null);
      }

      showSuccess('Thành Công', 'Nhiá»‡m vá»¥ Ä‘Ã£ Ä‘Æ°á»£c tÃ¡i kÃ­ch hoáº¡t.');

      // Dispatch wallet update event
      window.dispatchEvent(new Event('wallet:updated'));

      setReopenModal(prev => ({ ...prev, visible: false }));
    } catch (err: any) {
      console.error('Failed to reopen job:', err);
      showError('Error', 'KhÃ´ng thá»ƒ má»Ÿ láº¡i nhiá»‡m vá»¥.');
    }
  };

  const handleEditJob = (job: JobPostingResponse) => {
    setEditingJob(job);
    setEditForm({
      title: job.title,
      description: job.description,
      requiredSkills: [...job.requiredSkills],
      minBudget: job.minBudget.toString(),
      maxBudget: job.maxBudget.toString(),
      deadline: job.deadline,
      isRemote: job.isRemote,
      location: job.location || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingJob) return;

    try {
      await jobService.updateJob(editingJob.id, {
        title: editForm.title,
        description: editForm.description,
        requiredSkills: editForm.requiredSkills,
        minBudget: parseFloat(editForm.minBudget),
        maxBudget: parseFloat(editForm.maxBudget),
        deadline: editForm.deadline,
        isRemote: editForm.isRemote,
        location: editForm.isRemote ? null : editForm.location
      });

      showSuccess('Thành Công', 'ThÃ´ng tin nhiá»‡m vá»¥ Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t.');
      setEditingJob(null);
      fetchJobs();
      
      // Update selected job if it's the one being edited
      if (selectedJob?.id === editingJob.id) {
         // We should ideally fetch the fresh job, but let's update basic fields
         setSelectedJob(prev => prev ? {
             ...prev,
             title: editForm.title,
             description: editForm.description,
             minBudget: parseFloat(editForm.minBudget),
             maxBudget: parseFloat(editForm.maxBudget),
             deadline: editForm.deadline
         } : null);
      }
    } catch (error) {
      console.error('Error updating job:', error);
      showError('Update Failed', 'KhÃ´ng thá»ƒ cáº­p nháº­t thÃ´ng tin nhiá»‡m vá»¥.');
    }
  };

  // Deprecated - kept for reference if needed, but UI uses handleReopenClick now
  const handleReopenJob = async (jobId: number) => {
     console.warn('Deprecated handleReopenJob called. Use handleReopenClick instead.');
  };

  const handleViewDetails = (job: JobPostingResponse) => {
    setSelectedJob(job);
  };

  const handleOpenApplicants = () => {
    if (selectedJob) {
      setShowApplicantsModal(true);
    }
  };

  const handleAcceptApplicant = async (appId: number, name: string) => {
    if (window.confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n CHáº¤P NHáº¬N á»©ng viÃªn ${name}?`)) {
      try {
        await jobService.updateApplicationStatus(appId, {
          status: 'ACCEPTED' as JobApplicationStatus,
          acceptanceMessage: 'ChÃºc má»«ng! Báº¡n Ä‘Ã£ Ä‘Æ°á»£c chá»n tham gia Ä‘á»™i ngÅ©.'
        });
        // Trigger local refresh for modal
        setLocalRefreshTrigger(prev => prev + 1);
        showSuccess('Tuyá»ƒn Dá»¥ng ThÃ nh CÃ´ng', `ÄÃ£ cháº¥p nháº­n ${name} vÃ o Ä‘á»™i!`);
      } catch (e) {
        showError('Lá»—i', 'KhÃ´ng thá»ƒ cháº¥p nháº­n á»©ng viÃªn nÃ y.');
      }
    }
  };

  const handleRejectApplicant = async (appId: number, name: string) => {
    if (window.confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n Tá»ª CHá»I á»©ng viÃªn ${name}?`)) {
      try {
        await jobService.updateApplicationStatus(appId, {
          status: 'REJECTED' as JobApplicationStatus,
          rejectionReason: 'Há»“ sÆ¡ chÆ°a phÃ¹ há»£p vá»›i yÃªu cáº§u hiá»‡n táº¡i.'
        });
        // Trigger local refresh for modal
        setLocalRefreshTrigger(prev => prev + 1);
        showSuccess('ÄÃ£ Tá»« Chá»‘i', `ÄÃ£ gá»­i thÃ´ng bÃ¡o tá»« chá»‘i cho ${name}.`);
      } catch (e) {
        showError('Lá»—i', 'KhÃ´ng thá»ƒ tá»« chá»‘i á»©ng viÃªn nÃ y.');
      }
    }
  };

  const getStatusBadgeClass = (status: JobStatus): string => {
    switch (status) {
      case 'OPEN': return 'fleet-status-open';
      case 'CLOSED': return 'fleet-status-closed';
      default: return 'fleet-status-closed';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="fleet-panel">
      <div className="fleet-title">
        <i className="fas fa-list-alt"></i>
        Nháº­t KÃ½ Hoáº¡t Äá»™ng
      </div>
      
      {isLoading ? (
        <div style={{ color: 'var(--fleet-cyan)', padding: '20px', textAlign: 'center' }}>
          Äang táº£i dá»¯ liá»‡u...
        </div>
      ) : (
        <>
          <table className="fleet-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vá»‹ TrÃ­ Tuyá»ƒn Dá»¥ng</th>
                <th>Háº¡n ChÃ³t</th>
                <th>NgÃ¢n SÃ¡ch</th>
                <th>Tráº¡ng ThÃ¡i</th>
                <th>HÃ nh Äá»™ng</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--fleet-text-muted)' }}>
                    KhÃ´ng tÃ¬m tháº¥y tin tuyá»ƒn dá»¥ng nÃ o. HÃ£y táº¡o tin má»›i.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr 
                    key={job.id} 
                    className={selectedJob?.id === job.id ? 'fleet-row-selected' : ''}
                  >
                    <td 
                      style={{ fontFamily: 'monospace', color: 'var(--fleet-cyan)', cursor: 'pointer' }}
                      onClick={() => handleViewDetails(job)}
                    >
                      #{job.id}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{job.title}</td>
                    <td>{formatDate(job.deadline)}</td>
                    <td>{job.isNegotiable ? 'Thá»a thuáº­n' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.maxBudget)}</td>
                    <td>
                      <span className={`fleet-status-badge ${getStatusBadgeClass(job.status)}`}>
                        [{job.status === 'OPEN' ? 'Má»ž' : job.status === 'PENDING_APPROVAL' ? 'CHá»œ DUYá»†T' : 'ÄÃ“NG'}]
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="fleet-btn-icon" 
                          onClick={() => handleViewDetails(job)}
                          title="Xem Chi Tiáº¿t & Thao TÃ¡c"
                          style={{ color: 'var(--fleet-cyan)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2em' }}
                        >
                          <i className="fas fa-info-circle"></i> â„¹ï¸
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Job Details Panel (Slide-in or Modal) */}
          {selectedJob && (
            <div className="fleet-details-panel">
              <div className="fleet-details-header">
                <h3>Chi Tiáº¿t Tin #{selectedJob.id}</h3>
                <button 
                  className="fleet-close-btn"
                  onClick={() => setSelectedJob(null)}
                >
                  âœ•
                </button>
              </div>
              
              <div className="fleet-details-content">
                <div className="fleet-detail-row">
                  <label>TiÃªu Äá»:</label>
                  <span>{selectedJob.title}</span>
                </div>
                <div className="fleet-detail-row">
                  <label>Tráº¡ng ThÃ¡i:</label>
                  <span className={`fleet-status-badge ${getStatusBadgeClass(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div className="fleet-detail-row">
                  <label>MÃ´ Táº£:</label>
                  <p>{selectedJob.description}</p>
                </div>
                <div className="fleet-detail-row">
                  <label>Quyá»n Lá»£i:</label>
                  <p>{selectedJob.benefits || 'ChÆ°a cáº­p nháº­t'}</p>
                </div>
                <div className="fleet-detail-row">
                  <label>Ká»¹ NÄƒng:</label>
                  <div className="fleet-merc-skills">
                    {selectedJob.requiredSkills?.map(s => <span key={s} className="fleet-chip">{s}</span>) || 'KhÃ´ng cÃ³ yÃªu cáº§u'}
                  </div>
                </div>
                <div className="fleet-detail-row">
                  <label>HÃ¬nh Thá»©c:</label>
                  <span>{selectedJob.isRemote ? 'LÃ m viá»‡c tá»« xa (Remote)' : selectedJob.location} - {selectedJob.jobType}</span>
                </div>
                <div className="fleet-detail-row">
                  <label>Tuyá»ƒn Dá»¥ng:</label>
                  <span>{selectedJob.hiringQuantity} ngÆ°á»i ({selectedJob.experienceLevel})</span>
                </div>
                
                <div className="fleet-details-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    className="fleet-btn-icon"
                    onClick={handleOpenApplicants}
                    style={{ 
                      background: 'rgba(6, 182, 212, 0.1)', 
                      border: '1px solid var(--fleet-cyan)', 
                      color: 'var(--fleet-cyan)',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    ðŸ‘¥ Xem á»¨ng ViÃªn
                  </button>

                  {selectedJob.status === 'OPEN' && (
                    <button 
                      className="fleet-btn-warning"
                      onClick={() => handleCloseJob(selectedJob.id)}
                    >
                      ðŸ›‘ ÄÃ³ng Nhiá»‡m Vá»¥
                    </button>
                  )}
                  
                  {selectedJob.status === 'CLOSED' && (
                    <>
                      <button 
                        className="fleet-btn-primary-small"
                        onClick={() => handleEditJob(selectedJob)}
                        style={{ 
                          background: 'rgba(245, 158, 11, 0.1)', 
                          color: '#f59e0b', 
                          borderColor: '#f59e0b',
                          flex: '0 0 auto',
                          width: 'auto',
                          padding: '8px 16px'
                        }}
                      >
                        âœï¸ Chá»‰nh Sá»­a
                      </button>
                      <button 
                        className="fleet-btn-success"
                        onClick={() => handleReopenClick(selectedJob)}
                      >
                        ðŸ”„ Má»Ÿ Láº¡i Nhiá»‡m Vá»¥
                      </button>
                    </>
                  )}
                  
                  <button 
                    className="fleet-btn-danger"
                    onClick={() => handleDelete(selectedJob.id)}
                  >
                    ðŸ—‘ï¸ Há»§y Nhiá»‡m Vá»¥
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Applicants Modal */}
          {showApplicantsModal && selectedJob && (
            <ApplicantsModal
              jobId={selectedJob.id}
              jobTitle={selectedJob.title}
              onClose={() => setShowApplicantsModal(false)}
              onAccept={handleAcceptApplicant}
              onReject={handleRejectApplicant}
              refreshTrigger={localRefreshTrigger}
            />
          )}

          {/* Close Job Modal */}
          {closeModal.visible && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={() => setCloseModal(prev => ({ ...prev, visible: false }))}>
              <div className="fleet-panel" style={{ width: '500px', maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="fleet-details-header">
                  <h3 style={{ color: 'var(--fleet-warning)' }}>ðŸ›‘ XÃ¡c Nháº­n ÄÃ³ng Nhiá»‡m Vá»¥</h3>
                  <button className="fleet-close-btn" onClick={() => setCloseModal(prev => ({ ...prev, visible: false }))}>âœ•</button>
                </div>
                
                <div style={{ padding: '20px 0', color: '#e2e8f0' }}>
                  <p>Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n Ä‘Ã³ng nhiá»‡m vá»¥ nÃ y khÃ´ng?</p>
                  <ul style={{ margin: '15px 0 15px 20px', lineHeight: '1.6' }}>
                    <li>á»¨ng viÃªn sáº½ khÃ´ng thá»ƒ ná»™p Ä‘Æ¡n má»›i.</li>
                    <li>Nhiá»‡m vá»¥ sáº½ chuyá»ƒn sang tráº¡ng thÃ¡i <strong>CLOSED</strong>.</li>
                    <li>Báº¡n cÃ³ thá»ƒ má»Ÿ láº¡i sau (cÃ³ phÃ­ náº¿u quÃ¡ thá»i gian Ã¢n háº¡n).</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button className="fleet-btn-secondary" onClick={() => setCloseModal(prev => ({ ...prev, visible: false }))}>Há»§y Bá»</button>
                  <button className="fleet-btn-danger" onClick={confirmClose}>XÃ¡c Nháº­n ÄÃ³ng</button>
                </div>
              </div>
            </div>
          )}

          {/* Reopen Job Modal */}
          {reopenModal.visible && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={() => setReopenModal(prev => ({ ...prev, visible: false }))}>
              <div className="fleet-panel" style={{ width: '500px', maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="fleet-details-header">
                  <h3>ðŸ”„ Má»Ÿ Láº¡i Nhiá»‡m Vá»¥</h3>
                  <button className="fleet-close-btn" onClick={() => setReopenModal(prev => ({ ...prev, visible: false }))}>âœ•</button>
                </div>
                
                <div style={{ 
                  backgroundColor: reopenModal.isFree ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: reopenModal.isFree ? '#10b981' : '#f59e0b',
                  padding: '15px', borderRadius: '4px', marginBottom: '20px',
                  border: `1px solid ${reopenModal.isFree ? '#10b981' : '#f59e0b'}`
                }}>
                  <strong>{reopenModal.isFree ? 'âœ¨ MIá»„N PHÃ' : 'ðŸ’° PHÃ: 20.000 VNÄ'}</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#e2e8f0' }}>
                    {reopenModal.isFree 
                      ? 'Báº¡n Ä‘ang trong thá»i gian Ã¢n háº¡n (5 phÃºt). Má»Ÿ láº¡i job sáº½ khÃ´ng tá»‘n phÃ­.'
                      : 'ÄÃ£ quÃ¡ thá»i gian Ã¢n háº¡n 5 phÃºt. PhÃ­ má»Ÿ láº¡i sáº½ Ä‘Æ°á»£c trá»« vÃ o vÃ­ cá»§a báº¡n.'
                    }
                  </p>
                </div>

                <div className="fleet-input-group">
                  <label className="fleet-label">Háº¡n ChÃ³t Má»›i *</label>
                  <input
                    type="date"
                    className="fleet-input"
                    value={reopenModal.deadline}
                    onChange={(e) => setReopenModal(prev => ({ ...prev, deadline: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="fleet-input-group">
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={reopenModal.clearApplications}
                      onChange={(e) => setReopenModal(prev => ({ ...prev, clearApplications: e.target.checked }))}
                      style={{ marginRight: '10px', width: 'auto' }}
                    />
                    <span>
                      <strong>XÃ³a danh sÃ¡ch á»©ng viÃªn cÅ©?</strong>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="fleet-btn-secondary" onClick={() => setReopenModal(prev => ({ ...prev, visible: false }))}>Há»§y</button>
                  <button className="fleet-btn-primary" onClick={confirmReopen}>âœ… XÃ¡c Nháº­n</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Job Modal */}
          {editingJob && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={() => setEditingJob(null)}>
              <div className="fleet-panel" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <div className="fleet-details-header">
                  <h3>âœï¸ Chá»‰nh Sá»­a Tin Tuyá»ƒn Dá»¥ng</h3>
                  <button className="fleet-close-btn" onClick={() => setEditingJob(null)}>âœ•</button>
                </div>
                
                <div className="fleet-input-group">
                  <label className="fleet-label">TiÃªu Äá» *</label>
                  <input type="text" className="fleet-input" value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} />
                </div>

                <div className="fleet-input-group">
                  <label className="fleet-label">MÃ´ Táº£ *</label>
                  <textarea 
                    className="fleet-input" 
                    value={editForm.description} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    style={{ background: 'transparent', border: '1px solid var(--fleet-border)', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="fleet-input-group" style={{ flex: 1 }}>
                    <label className="fleet-label">NgÃ¢n SÃ¡ch Min (VND)</label>
                    <input type="number" className="fleet-input" value={editForm.minBudget} onChange={(e) => setEditForm(prev => ({ ...prev, minBudget: e.target.value }))} />
                  </div>
                  <div className="fleet-input-group" style={{ flex: 1 }}>
                    <label className="fleet-label">NgÃ¢n SÃ¡ch Max (VND)</label>
                    <input type="number" className="fleet-input" value={editForm.maxBudget} onChange={(e) => setEditForm(prev => ({ ...prev, maxBudget: e.target.value }))} />
                  </div>
                </div>

                <div className="fleet-input-group">
                  <label className="fleet-label">Háº¡n ChÃ³t</label>
                  <input type="date" className="fleet-input" value={editForm.deadline} onChange={(e) => setEditForm(prev => ({ ...prev, deadline: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button className="fleet-btn-secondary" onClick={() => setEditingJob(null)}>Há»§y</button>
                  <button className="fleet-btn-primary" onClick={handleSaveEdit}>ðŸ’¾ LÆ°u Thay Äá»•i</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OperationLog;
