import React, { useState } from 'react';
import PostMinJobTab from '../../components/business/PostMinJobTab';
import MinJobListTab from '../../components/business/MinJobListTab';
import SuggestedFreelancersTab from '../../components/business/SuggestedFreelancersTab';
import ApplicantsModal from '../../components/business/ApplicantsModal';
import AcceptModal from '../../components/business/AcceptModal';
import RejectModal from '../../components/business/RejectModal';
import MeowlGuide from '../../components/MeowlGuide';
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
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  
  // Accept/Reject modal state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [selectedApplicantName, setSelectedApplicantName] = useState<string>('');
  const [refreshApplicantsTrigger, setRefreshApplicantsTrigger] = useState(0);
  
  // Mock data for stats display only
  const mockJobsCount = 3;
  const mockOpenJobsCount = 2;

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

  const handleViewApplicants = (jobId: number) => {
    setSelectedJobId(jobId);
    setShowApplicantsModal(true);
  };

  const handleCloseApplicantsModal = () => {
    setShowApplicantsModal(false);
    setSelectedJobId(null);
  };

  const handleAcceptApplicant = (applicationId: number, applicantName: string) => {
    setSelectedApplicationId(applicationId);
    setSelectedApplicantName(applicantName);
    setShowAcceptModal(true);
  };

  const handleRejectApplicant = (applicationId: number, applicantName: string) => {
    setSelectedApplicationId(applicationId);
    setSelectedApplicantName(applicantName);
    setShowRejectModal(true);
  };

  const handleCloseAcceptModal = () => {
    setShowAcceptModal(false);
    setSelectedApplicationId(null);
    setSelectedApplicantName('');
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setSelectedApplicationId(null);
    setSelectedApplicantName('');
  };

  const handleAcceptSuccess = () => {
    handleCloseAcceptModal();
    setRefreshApplicantsTrigger(prev => prev + 1); // Trigger ApplicantsModal refresh
  };

  const handleRejectSuccess = () => {
    handleCloseRejectModal();
    setRefreshApplicantsTrigger(prev => prev + 1); // Trigger ApplicantsModal refresh
  };

  return (
    <div className="business-page">
      <div className="business-header">
        <div className="business-header-content">
          <h1>🏢 Bảng Điều Khiển Doanh Nghiệp</h1>
          <p>Quản lý công việc nhỏ và tìm kiếm freelancer hoàn hảo</p>
          <div className="business-stats">
            <div className="business-stat-item">
              <span className="stat-number">{mockJobsCount}</span>
              <span className="business-stat-label">Công Việc</span>
            </div>
            <div className="business-stat-item">
              <span className="stat-number">{freelancers.length}</span>
              <span className="business-stat-label">Freelancer</span>
            </div>
            <div className="business-stat-item">
              <span className="stat-number">{mockOpenJobsCount}</span>
              <span className="business-stat-label">Đang Mở</span>
            </div>
          </div>
        </div>
        <div className="business-header-animation">
          <div className="business-floating-icon">💼</div>
          <div className="business-floating-icon">🚀</div>
          <div className="business-floating-icon">⭐</div>
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
            <PostMinJobTab />
          </div>
        )}
        {activeTab === 'list' && (
          <div className="bsn-tab-panel fade-in">
            <MinJobListTab onViewApplicants={handleViewApplicants} />
          </div>
        )}
        {activeTab === 'freelancers' && (
          <div className="bsn-tab-panel fade-in">
            <SuggestedFreelancersTab freelancers={freelancers} />
          </div>
        )}
      </div>

      {/* Applicants Modal */}
      {showApplicantsModal && selectedJobId && (
        <ApplicantsModal
          jobId={selectedJobId}
          jobTitle="Công Việc" 
          onClose={handleCloseApplicantsModal}
          onAccept={handleAcceptApplicant}
          onReject={handleRejectApplicant}
          refreshTrigger={refreshApplicantsTrigger}
        />
      )}

      {/* Accept Modal */}
      {showAcceptModal && selectedApplicationId && (
        <AcceptModal
          applicationId={selectedApplicationId}
          applicantName={selectedApplicantName}
          onClose={handleCloseAcceptModal}
          onSuccess={handleAcceptSuccess}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApplicationId && (
        <RejectModal
          applicationId={selectedApplicationId}
          applicantName={selectedApplicantName}
          onClose={handleCloseRejectModal}
          onSuccess={handleRejectSuccess}
        />
      )}

      {/* Meowl Guide */}
      <MeowlGuide currentPage="business" />
    </div>
  );
};

export default BusinessPage;