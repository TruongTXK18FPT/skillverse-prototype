import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Activity, BarChart2, Target, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { RoadmapSessionSummary } from '../../types/Roadmap';
import './AnalystTrack.css';

interface AnalystTrackProps {
  roadmaps: RoadmapSessionSummary[];
}

const AnalystTrack: React.FC<AnalystTrackProps> = ({ roadmaps }) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate Stats
  const totalRoadmaps = roadmaps.length;
  const totalProgress = roadmaps.reduce((acc, r) => acc + (r.progressPercentage || 0), 0);
  const avgCompletion = totalRoadmaps > 0 ? Math.round(totalProgress / totalRoadmaps) : 0;
  
  const completedRoadmaps = roadmaps.filter(r => (r.progressPercentage || 0) >= 100).length;
  const inProgressRoadmaps = roadmaps.filter(r => (r.progressPercentage || 0) > 0 && (r.progressPercentage || 0) < 100).length;

  // Sort by progress (descending)
  const sortedRoadmaps = [...roadmaps].sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0));

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="arm-analyst-track-container">
      <div className="arm-analyst-header">
        <div className="arm-header-title">
          <Activity className="arm-header-icon" />
          ANALYST TRACK
        </div>
        <div className="arm-header-actions">
          <button 
            className={`arm-refresh-btn ${isRefreshing ? 'arm-spin' : ''}`}
            onClick={handleRefresh}
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="arm-analyst-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="arm-stat-card">
          <div className="arm-stat-icon-wrapper" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)' }}>
            <PieChart size={20} />
          </div>
          <div className="arm-stat-content">
            <span className="arm-stat-value">{avgCompletion}%</span>
            <span className="arm-stat-label">AVG. COMPLETION</span>
          </div>
        </div>

        <div className="arm-stat-card">
          <div className="arm-stat-icon-wrapper" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)' }}>
            <Target size={20} />
          </div>
          <div className="arm-stat-content">
            <span className="arm-stat-value">{inProgressRoadmaps}</span>
            <span className="arm-stat-label">ACTIVE CAMPAIGNS</span>
          </div>
        </div>

        <div className="arm-stat-card">
          <div className="arm-stat-icon-wrapper" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={20} />
          </div>
          <div className="arm-stat-content">
            <span className="arm-stat-value">{completedRoadmaps}</span>
            <span className="arm-stat-label">COMPLETED</span>
          </div>
        </div>
      </div>

      <div className="arm-analyst-list-section">
        <div className="arm-list-header">
          <div className="arm-list-title">
            <BarChart2 size={16} />
            CAMPAIGN LOG
          </div>
          <button 
            className="arm-view-all-btn"
            onClick={() => navigate('/roadmap')}
          >
            VIEW ALL
          </button>
        </div>
        
        <div className="arm-roadmap-list">
          {sortedRoadmaps.length > 0 ? (
            sortedRoadmaps.map((roadmap) => (
              <div 
                key={roadmap.sessionId} 
                className="arm-roadmap-item"
                onClick={() => navigate(`/roadmap/${roadmap.sessionId}`)}
              >
                <div className="arm-item-header">
                  <span className="arm-item-title">{roadmap.title}</span>
                  <span className={`arm-item-badge ${roadmap.difficultyLevel?.toLowerCase() || 'beginner'}`}>
                    {roadmap.difficultyLevel || 'NORMAL'}
                  </span>
                </div>
                
                <div className="arm-item-meta">
                  <span className="arm-meta-info">
                    <Clock size={12} /> {roadmap.duration}
                  </span>
                  <span className="arm-meta-info">
                    <Target size={12} /> {roadmap.totalQuests} Quests
                  </span>
                </div>

                <div className="arm-item-progress-wrapper">
                  <div className="arm-progress-labels">
                    <span>Progress</span>
                    <span>{roadmap.progressPercentage || 0}%</span>
                  </div>
                  <div className="arm-item-progress-bar">
                    <div 
                      className={`arm-item-progress-fill ${
                        (roadmap.progressPercentage || 0) >= 100 ? 'complete' : 
                        (roadmap.progressPercentage || 0) > 50 ? 'good' : 'start'
                      }`}
                      style={{ width: `${roadmap.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="arm-empty-state">
              <AlertCircle size={24} />
              <span>No active campaigns found.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalystTrack;
