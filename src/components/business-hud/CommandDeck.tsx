import React, { useState, useEffect } from 'react';
import FleetHeader from './FleetHeader';
import FleetStatsBar from './FleetStatsBar';
import OperationLog from './OperationLog';
import MissionLaunchPad from './MissionLaunchPad';
import MercenaryRadar from './MercenaryRadar';
import './fleet-styles.css';
import portfolioService from '../../services/portfolioService';
import { FreelancerCardDisplay, CandidateSummaryDTO } from '../../data/portfolioDTOs';
import jobService from '../../services/jobService';
import { JobStatus } from '../../data/jobDTOs';

const CommandDeck: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mission' | 'radar'>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [freelancers, setFreelancers] = useState<FreelancerCardDisplay[]>([]);
  const [loadingRadar, setLoadingRadar] = useState(false);
  const [radarPage, setRadarPage] = useState(0);
  const [radarTotalPages, setRadarTotalPages] = useState(0);
  const [stats, setStats] = useState({
    activeOps: 0,
    crewCount: 0,
    openSlots: 0
  });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab, refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      const jobs = await jobService.getMyJobs();
      
      const activeOps = jobs.filter(j => j.status === JobStatus.OPEN).length;
      
      // Crew count = Total applicants across all jobs (renamed to Tổng Số Ứng Viên)
      const crewCount = jobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0);
      
      // Open slots = Sum of hiringQuantity for OPEN jobs
      const openSlots = jobs
        .filter(j => j.status === JobStatus.OPEN)
        .reduce((sum, job) => sum + (job.hiringQuantity || 1), 0);

      setStats({ activeOps, crewCount, openSlots });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'radar') {
      fetchCandidates(radarPage);
    }
  }, [activeTab, radarPage]);

  const fetchCandidates = async (page: number) => {
    try {
      setLoadingRadar(true);
      const result = await portfolioService.getCandidates(page, 8); // 8 items per page
      const mappedFreelancers = mapToFreelancerDisplay(result.content);
      setFreelancers(mappedFreelancers);
      setRadarTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to fetch candidates for radar:', error);
    } finally {
      setLoadingRadar(false);
    }
  };

  const parseSkills = (skillsJson?: string): string[] => {
    if (!skillsJson) return [];
    try {
      return JSON.parse(skillsJson);
    } catch (e) {
      return [];
    }
  };

  const mapToFreelancerDisplay = (candidates: CandidateSummaryDTO[]): FreelancerCardDisplay[] => {
    return candidates.map(c => ({
      id: c.userId,
      name: c.fullName || 'Người dùng Skillverse',
      professionalTitle: c.professionalTitle || 'Freelancer',
      skills: parseSkills(c.topSkills),
      rating: 0, 
      completedProjects: c.totalProjects || 0,
      hourlyRate: c.hourlyRate || 0,
      avatar: c.avatarUrl,
      isHighlighted: c.isHighlighted,
      customUrlSlug: c.customUrlSlug
    }));
  };

  const handleMissionLaunched = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('dashboard'); // Return to dashboard after launch
  };

  const handleEditJob = (job: any) => {
    // In future: Open edit modal or navigate to edit page
    // Currently switch to mission tab and pre-fill form (if supported)
    // For now just show alert as placeholder
    console.log('Edit job:', job);
    alert(`Tính năng chỉnh sửa nhiệm vụ #${job.id} đang được phát triển.`);
  };

  const handleViewApplicants = (jobId: number) => {
    // In future: Navigate to applicant management
    console.log('View applicants for job:', jobId);
    alert(`Tính năng xem ứng viên cho nhiệm vụ #${jobId} đang được phát triển.`);
  };

  return (
    <div className="fleet-container">
      <FleetHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="fleet-grid">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="fleet-main">
            <FleetStatsBar 
              activeOps={stats.activeOps} 
              crewCount={stats.crewCount} 
              openSlots={stats.openSlots} 
            />
            <div style={{ marginTop: '20px' }}>
              <OperationLog 
                refreshTrigger={refreshTrigger} 
              />
            </div>
          </div>
        )}

        {/* Mission Launch View */}
        {activeTab === 'mission' && (
          <div className="fleet-main">
            <MissionLaunchPad onMissionLaunched={handleMissionLaunched} />
          </div>
        )}

        {/* Radar View */}
        {activeTab === 'radar' && (
          <div className="fleet-main">
            <MercenaryRadar 
              freelancers={freelancers} 
              pagination={{
                page: radarPage,
                totalPages: radarTotalPages,
                onPageChange: setRadarPage
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandDeck;
