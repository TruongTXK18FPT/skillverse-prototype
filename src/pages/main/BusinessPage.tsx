import React, { useState } from 'react';
import PostMinJobTab from '../../components/business/PostMinJobTab';
import MinJobListTab from '../../components/business/MinJobListTab';
import SuggestedFreelancersTab from '../../components/business/SuggestedFreelancersTab';
import '../../styles/BusinessPage.css';

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
  const [activeTab, setActiveTab] = useState<'post' | 'list' | 'freelancers'>('post');
  const [minJobs, setMinJobs] = useState<MinJob[]>([
    {
      id: '1',
      title: 'Thiết Kế Lại Website',
      description: 'Cần thiết kế lại website công ty theo phong cách hiện đại',
      skills: ['React', 'TypeScript', 'CSS'],
      budget: 1500,
      deadline: '2025-08-15',
      status: 'Open',
      applicants: 5,
      createdAt: '2025-07-01'
    },
    {
      id: '2',
      title: 'Phát Triển Ứng Dụng Di Động',
      description: 'Phát triển ứng dụng di động đa nền tảng',
      skills: ['React Native', 'JavaScript', 'Tích Hợp API'],
      budget: 3000,
      deadline: '2025-09-30',
      status: 'In Progress',
      applicants: 12,
      createdAt: '2025-06-20'
    },
    {
      id: '3',
      title: 'Hệ Thống Thương Mại Điện Tử',
      description: 'Xây dựng hệ thống bán hàng trực tuyến hoàn chỉnh',
      skills: ['Vue.js', 'Node.js', 'MongoDB', 'Thanh Toán'],
      budget: 5000,
      deadline: '2025-10-30',
      status: 'Open',
      applicants: 8,
      createdAt: '2025-06-25'
    }
  ]);

  const freelancers: Freelancer[] = [
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

  const handleCreateMinJob = (newJob: Omit<MinJob, 'id' | 'status' | 'applicants' | 'createdAt'>) => {
    const job: MinJob = {
      ...newJob,
      id: Date.now().toString(),
      status: 'Open',
      applicants: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setMinJobs(prev => [job, ...prev]);
    setActiveTab('list');
  };

  const handleCloseJob = (jobId: string) => {
    setMinJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, status: 'Closed' as const } : job
      )
    );
  };

  return (
    <div className="business-page">
      <div className="business-header">
        <div className="business-header-content">
          <h1>🏢 Bảng Điều Khiển Doanh Nghiệp</h1>
          <p>Quản lý công việc nhỏ và tìm kiếm freelancer hoàn hảo</p>
          <div className="business-stats">
            <div className="stat-item">
              <span className="stat-number">{minJobs.length}</span>
              <span className="stat-label">Công Việc</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{freelancers.length}</span>
              <span className="stat-label">Freelancer</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{minJobs.filter(job => job.status === 'Open').length}</span>
              <span className="stat-label">Đang Mở</span>
            </div>
          </div>
        </div>
        <div className="business-header-animation">
          <div className="floating-icon">💼</div>
          <div className="floating-icon">🚀</div>
          <div className="floating-icon">⭐</div>
        </div>
      </div>

      <div className="bsn-tab-navigation">
        <button
          className={`bsn-tab-button ${activeTab === 'post' ? 'active' : ''}`}
          onClick={() => setActiveTab('post')}
        >
          <span className="bsn-tab-icon">📝</span>
          <span className="bsn-tab-text">Đăng Công Việc</span>
          <span className="bsn-tab-description">Tạo công việc mới</span>
        </button>
        <button
          className={`bsn-tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <span className="bsn-tab-icon">📋</span>
          <span className="bsn-tab-text">Danh Sách Công Việc</span>
          <span className="bsn-tab-description">Quản lý công việc</span>
        </button>
        <button
          className={`bsn-tab-button ${activeTab === 'freelancers' ? 'active' : ''}`}
          onClick={() => setActiveTab('freelancers')}
        >
          <span className="bsn-tab-icon">🔍</span>
          <span className="bsn-tab-text">Freelancer Gợi Ý</span>
          <span className="bsn-tab-description">Tìm tài năng</span>
        </button>
      </div>

      <div className="bsn-tab-content">
        {activeTab === 'post' && (
          <div className="bsn-tab-panel fade-in">
            <PostMinJobTab onCreateJob={handleCreateMinJob} />
          </div>
        )}
        {activeTab === 'list' && (
          <div className="bsn-tab-panel fade-in">
            <MinJobListTab jobs={minJobs} onCloseJob={handleCloseJob} />
          </div>
        )}
        {activeTab === 'freelancers' && (
          <div className="bsn-tab-panel fade-in">
            <SuggestedFreelancersTab freelancers={freelancers} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessPage;