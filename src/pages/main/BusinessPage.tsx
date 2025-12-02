import React from 'react';
import CommandDeck from '../../components/business-hud/CommandDeck';

// Export interfaces for compatibility if needed elsewhere
export interface MinJob {
  id: string;
  title: string;
  description: string;
  skills: string[];
  budget: number;
  deadline: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Closed';
  applicants: number;
  createdAt: string;
}

export interface Freelancer {
  id: string;
  name: string;
  skills: string[];
  rating: number;
  completedProjects: number;
  hourlyRate: number;
  avatar?: string;
}

const BusinessPage: React.FC = () => {
  return <CommandDeck />;
};

export default BusinessPage;