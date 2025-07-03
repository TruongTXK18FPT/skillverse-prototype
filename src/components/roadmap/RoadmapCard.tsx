import { CheckCircle2, Circle, PlayCircle, Route } from 'lucide-react';
import './RoadmapComponents.css';

interface RoadmapStep {
  id: number;
  title: string;
  completed: boolean;
  current?: boolean;
  duration: string;
}

interface RoadmapCardProps {
  title: string;
  category: string;
  progress: number;
  estimatedTime: string;
  difficulty: string;
  color: string;
  steps: RoadmapStep[];
}

const RoadmapCard = ({ 
  title, 
  category, 
  progress, 
  estimatedTime, 
  difficulty, 
  color, 
  steps 
}: RoadmapCardProps) => {
  return (
    <div className="sv-roadmap-card">
      <div className="sv-roadmap-card__header">
        <div className="sv-roadmap-card__info">
          <h3 className="sv-roadmap-card__title">{title}</h3>
          <span className="sv-roadmap-card__category">{category}</span>
        </div>
        <div className="sv-roadmap-card__stats">
          <div className="sv-roadmap-card__progress">
            <div className="sv-roadmap-card__progress-bar">
              <div 
                className="sv-roadmap-card__progress-fill"
                style={{ width: `${progress}%`, backgroundColor: color }}
              ></div>
            </div>
            <span className="sv-roadmap-card__progress-text">{progress}%</span>
          </div>
          <div className="sv-roadmap-card__meta">
            <span className="sv-roadmap-card__difficulty">{difficulty}</span>
            <span className="sv-roadmap-card__time">{estimatedTime}</span>
          </div>
        </div>
      </div>
      
      <div className="sv-roadmap-card__steps">
        {steps.slice(0, 4).map((step) => (
          <div key={step.id} className={`sv-roadmap-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}>
            <div className="sv-roadmap-step__indicator">
              {step.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
              {step.current && !step.completed && <PlayCircle className="h-4 w-4 text-white" />}
              {!step.completed && !step.current && <Circle className="h-4 w-4" />}
            </div>
            <div className="sv-roadmap-step__content">
              <span className="sv-roadmap-step__title">{step.title}</span>
              <span className="sv-roadmap-step__duration">{step.duration}</span>
            </div>
          </div>
        ))}
        {steps.length > 4 && (
          <div className="sv-roadmap-step__more">
            +{steps.length - 4} more steps
          </div>
        )}
      </div>
      
      <div className="sv-roadmap-card__actions">
        <button className="sv-button sv-button--primary sv-button--small">
          <PlayCircle className="h-4 w-4 mr-1" />
          Continue Learning
        </button>
        <button className="sv-button sv-button--secondary sv-button--small">
          <Route className="h-4 w-4 mr-1" />
          View Full Path
        </button>
      </div>
    </div>
  );
};

export default RoadmapCard;
