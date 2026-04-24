import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import MentorRoadmapWorkspacePanel from '../../components/mentor/MentorRoadmapWorkspacePanel';
import './MentorRoadmapWorkspacePage.css';

/**
 * Trang workspace chuyên dụng cho mentor điều phối một booking đồng hành roadmap.
 * Đường dẫn: /mentor/roadmap-workspace/:bookingId
 */
const MentorRoadmapWorkspacePage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const parsedId = Number(bookingId);

  if (!bookingId || !Number.isFinite(parsedId) || parsedId <= 0) {
    return (
      <div className="mrwp-page">
        <div className="mrwp-invalid">
          <h2>Mã booking không hợp lệ</h2>
          <p>Đường dẫn không chứa bookingId hợp lệ. Vui lòng quay lại danh sách booking.</p>
          <button className="mrwp-back-btn" onClick={() => navigate('/mentor')}>
            <ArrowLeft size={16} /> Về bảng điều khiển Mentor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mrwp-page">
      <header className="mrwp-page__header">
        <button
          type="button"
          className="mrwp-back-btn"
          onClick={() => navigate('/mentor')}
          title="Quay lại bảng điều khiển"
        >
          <ArrowLeft size={16} /> Về Bảng điều khiển
        </button>
        <div className="mrwp-page__title">
          <div className="mrwp-page__icon">
            <LayoutDashboard size={18} />
          </div>
          <div>
            <h1>Workspace Đồng Hành Roadmap</h1>
            <p>Quản lý roadmap, assignment, meeting và xác nhận hoàn thành cho học viên.</p>
          </div>
        </div>
      </header>

      <main className="mrwp-page__body">
        <MentorRoadmapWorkspacePanel bookingId={parsedId} />
      </main>
    </div>
  );
};

export default MentorRoadmapWorkspacePage;
