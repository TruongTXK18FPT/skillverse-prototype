import React from 'react';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import HoloProgressBar from './HoloProgressBar';
import './learning-hud.css';

interface NeuralInterfaceLayoutProps {
  courseTitle: string;
  courseDescription?: string;
  progress: { percent: number };
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onBack: () => void;
  children: React.ReactNode;
}

const NeuralInterfaceLayout: React.FC<NeuralInterfaceLayoutProps> = ({
  courseTitle,
  courseDescription,
  progress,
  isSidebarOpen,
  onToggleSidebar,
  onBack,
  children
}) => {
  return (
    <div className="learning-hud-container">
      <div className="learning-hud-layout">
        {/* Header */}
        <header className="learning-hud-header">
          <div className="learning-hud-header-left">
            <button
              onClick={onBack}
              className="learning-hud-back-btn"
            >
              <ArrowLeft size={20} />
              <span>Exit</span>
            </button>
            <div className="learning-hud-course-title">
              <h3>{courseTitle}</h3>
              {courseDescription && <span>{courseDescription}</span>}
            </div>
          </div>

          <div className="learning-hud-header-center">
            <HoloProgressBar percent={progress.percent} />
          </div>

          <div className="learning-hud-header-right">
            <button
              onClick={onToggleSidebar}
              className="learning-hud-sidebar-toggle"
            >
              <LayoutDashboard size={20} />
              <span>System Log</span>
            </button>
          </div>
        </header>

        {/* Body - Contains Sidebar + Main Content */}
        <div className="learning-hud-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default NeuralInterfaceLayout;