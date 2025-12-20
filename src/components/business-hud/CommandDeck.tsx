import React, { useState } from 'react';
import FleetHeader from './FleetHeader';
import FleetStatsBar from './FleetStatsBar';
import OperationLog from './OperationLog';
import MissionLaunchPad from './MissionLaunchPad';
import MercenaryRadar, { Freelancer } from './MercenaryRadar';
import './fleet-styles.css';

const CommandDeck: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mission' | 'radar'>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
            <FleetStatsBar activeOps={3} crewCount={6} openSlots={2} />
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
            <MercenaryRadar />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandDeck;
