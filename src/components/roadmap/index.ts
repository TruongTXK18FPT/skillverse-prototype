export { default as RoadmapCard } from './RoadmapCard';
export { default as RoadmapSection } from './RoadmapSection';
export { default as RoadmapDetailViewer } from './RoadmapDetailViewer';
export { default as RoadmapList } from './RoadmapList';

// Export types
export interface RoadmapStep {
  id: number;
  title: string;
  completed: boolean;
  current?: boolean;
  duration: string;
}

export interface Roadmap {
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
