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

  // Mock Data for Freelancers (Mercenaries)
  const mercenaries: Freelancer[] = [
    {
      id: '1',
      name: 'Nguyễn Thị Sarah',
      skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
      rating: 4.8,
      completedProjects: 47,
      hourlyRate: 6.5
    },
    {
      id: '2',
      name: 'Trần Minh Tuấn',
      skills: ['React Native', 'JavaScript', 'Firebase', 'UI/UX'],
      rating: 4.9,
      completedProjects: 32,
      hourlyRate: 5.5
    },
    {
      id: '3',
      name: 'Lê Thị Elena',
      skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
      rating: 4.7,
      completedProjects: 68,
      hourlyRate: 7
    },
    {
      id: '4',
      name: 'Phạm Văn David',
      skills: ['Vue.js', 'PHP', 'Laravel', 'MySQL'],
      rating: 4.6,
      completedProjects: 25,
      hourlyRate: 5
    },
    {
      id: '5',
      name: 'Hoàng Thị Anna',
      skills: ['Flutter', 'Dart', 'Firebase', 'iOS', 'Android'],
      rating: 4.9,
      completedProjects: 41,
      hourlyRate: 75
    },
    {
      id: '6',
      name: 'Vũ Minh Khôi',
      skills: ['Java', 'Spring Boot', 'Microservices', 'Docker'],
      rating: 4.8,
      completedProjects: 55,
      hourlyRate: 8
    }
  ];

  return (
    <div className="fleet-container">
      <FleetHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="fleet-grid">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="fleet-main">
            <FleetStatsBar activeOps={3} crewCount={6} openSlots={2} />
            <div style={{ marginTop: '20px' }}>
              <OperationLog refreshTrigger={refreshTrigger} />
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
            <MercenaryRadar freelancers={mercenaries} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandDeck;
