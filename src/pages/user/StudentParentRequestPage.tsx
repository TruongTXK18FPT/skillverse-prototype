import React, { useEffect, useState } from 'react';
import studentLinkService, { ParentStudentLinkResponse, LinkStatus } from '../../services/studentLinkService';
import Header from '../../components/layout/Header';
import { Check, X, User, Calendar, Shield, Link as LinkIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../styles/StudentParentRequestPage.css';

const StudentParentRequestPage: React.FC = () => {
  const [links, setLinks] = useState<ParentStudentLinkResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const data = await studentLinkService.getStudentLinks();
      setLinks(data);
    } catch (error) {
      console.error('Failed to fetch links', error);
      toast.error('Không thể tải danh sách yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (linkId: number, status: LinkStatus) => {
    try {
      await studentLinkService.updateLinkStatus(linkId, status);
      toast.success(status === LinkStatus.ACTIVE ? 'Đã chấp nhận yêu cầu!' : 'Đã từ chối yêu cầu.');
      fetchLinks();
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('Có lỗi xảy ra.');
    }
  };

  const pendingLinks = links.filter(link => link.status === LinkStatus.PENDING);
  const activeLinks = links.filter(link => link.status === LinkStatus.ACTIVE);

  return (
    <div className="spr-container">
      <Header />
      <div className="spr-content">
        <h1 className="spr-title">Kết nối Phụ huynh</h1>
        
        <div className="spr-section">
          <h2 className="spr-section-title">
            <Shield size={24} color="#06b6d4" />
            <span>Yêu cầu đang chờ ({pendingLinks.length})</span>
          </h2>
          {loading ? (
            <p style={{color: '#94a3b8', textAlign: 'center'}}>Đang tải dữ liệu...</p>
          ) : pendingLinks.length === 0 ? (
            <p className="spr-empty">Không có yêu cầu nào đang chờ xử lý.</p>
          ) : (
            <div className="space-y-4">
              {pendingLinks.map(link => (
                <div key={link.id} className="spr-card pending-glow">
                  <div className="spr-card-info">
                    <div className="spr-avatar pending">
                      <User size={24} />
                    </div>
                    <div className="spr-details">
                      <h3>{link.parent.fullName || link.parent.email}</h3>
                      <p>{link.parent.email}</p>
                      <div className="spr-date">
                        <Calendar size={14} /> {new Date(link.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="spr-actions">
                    <button
                      onClick={() => handleUpdateStatus(link.id, LinkStatus.ACTIVE)}
                      className="spr-btn accept"
                      title="Chấp nhận"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(link.id, LinkStatus.REJECTED)}
                      className="spr-btn reject"
                      title="Từ chối"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="spr-section">
          <h2 className="spr-section-title">
            <LinkIcon size={24} color="#06b6d4" />
            <span>Phụ huynh đã liên kết ({activeLinks.length})</span>
          </h2>
          {activeLinks.length === 0 ? (
            <p className="spr-empty">Chưa có phụ huynh nào được liên kết.</p>
          ) : (
            <div className="space-y-4">
              {activeLinks.map(link => (
                <div key={link.id} className="spr-card">
                  <div className="spr-card-info">
                    <div className="spr-avatar active">
                      <User size={24} />
                    </div>
                    <div className="spr-details">
                      <h3>{link.parent.fullName || link.parent.email}</h3>
                      <p>{link.parent.email}</p>
                      <div className="spr-date">
                        Liên kết từ: {new Date(link.updatedAt || link.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentParentRequestPage;
