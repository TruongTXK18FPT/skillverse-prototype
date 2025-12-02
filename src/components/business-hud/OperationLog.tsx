import React, { useState, useEffect } from 'react';
import jobService from '../../services/jobService';
import { JobPostingResponse, JobStatus } from '../../data/jobDTOs';
import { useToast } from '../../hooks/useToast';
import './fleet-styles.css';

interface OperationLogProps {
  refreshTrigger?: number;
}

const OperationLog: React.FC<OperationLogProps> = ({ refreshTrigger }) => {
  const { showError } = useToast();
  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getMyJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showError('System Error', 'Failed to retrieve operation logs.');
    } finally {
      setIsLoading(false);
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
        Operation Log
      </div>
      
      {isLoading ? (
        <div style={{ color: 'var(--fleet-cyan)', padding: '20px', textAlign: 'center' }}>
          Scanning database...
        </div>
      ) : (
        <table className="fleet-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mission Objective</th>
              <th>Deadline</th>
              <th>Budget</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--fleet-text-muted)' }}>
                  No active operations found. Initialize a new mission.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--fleet-cyan)' }}>#{job.id}</td>
                  <td style={{ fontWeight: 'bold' }}>{job.title}</td>
                  <td>{formatDate(job.deadline)}</td>
                  <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.maxBudget)}</td>
                  <td>
                    <span className={`fleet-status-badge ${getStatusBadgeClass(job.status)}`}>
                      [{job.status}]
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OperationLog;
