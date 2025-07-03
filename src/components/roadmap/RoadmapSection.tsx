import { Map, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoadmapCard from './RoadmapCard';
import './RoadmapComponents.css';

interface RoadmapStep {
  id: number;
  title: string;
  completed: boolean;
  current?: boolean;
  duration: string;
}

interface Roadmap {
  id: number;
  title: string;
  category: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  estimatedTime: string;
  difficulty: string;
  color: string;
  steps: RoadmapStep[];
}

interface RoadmapSectionProps {
  roadmaps: Roadmap[];
}

const RoadmapSection = ({ roadmaps }: RoadmapSectionProps) => {
  const navigate = useNavigate();
  console.log('RoadmapSection rendering with roadmaps:', roadmaps);
  
  const handleViewAllRoadmaps = () => {
    navigate('/roadmap');
  };
  
  return (
    <div className="sv-roadmap-section" style={{ backgroundColor: '#f0f0f0', padding: '20px', margin: '20px 0' }}>
      <div className="sv-section-header">
        <div className="sv-section-header__title">
          <Map className="h-5 w-5 mr-2" />
          <h2>Learning Roadmaps ({roadmaps.length} roadmaps)</h2>
        </div>
        <button className="sv-button sv-button--text" onClick={handleViewAllRoadmaps}>
          View All Roadmaps
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
      
      <div className="sv-roadmap-grid">
        {roadmaps.map((roadmap) => (
          <RoadmapCard
            key={roadmap.id}
            title={roadmap.title}
            category={roadmap.category}
            progress={roadmap.progress}
            estimatedTime={roadmap.estimatedTime}
            difficulty={roadmap.difficulty}
            color={roadmap.color}
            steps={roadmap.steps}
          />
        ))}
      </div>
    </div>
  );
};

export default RoadmapSection;
