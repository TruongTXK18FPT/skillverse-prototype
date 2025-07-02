import React, { useState } from 'react';
import './SkillPointManagementTab.css';

const SkillPointManagementTab: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');

  const recentAdjustments = [
    {
      id: 1,
      user: 'Nguyễn Văn A',
      amount: 500,
      reason: 'Hoàn thành khóa học xuất sắc',
      date: '2024-01-15 14:30',
      admin: 'Admin1'
    },
    {
      id: 2,
      user: 'Trần Thị B',
      amount: -200,
      reason: 'Vi phạm quy tắc cộng đồng',
      date: '2024-01-15 10:15',
      admin: 'Admin2'
    },
    {
      id: 3,
      user: 'Lê Văn C',
      amount: 1000,
      reason: 'Thưởng mentor xuất sắc tháng',
      date: '2024-01-14 16:45',
      admin: 'Admin1'
    },
    {
      id: 4,
      user: 'Phạm Thị D',
      amount: 300,
      reason: 'Tham gia sự kiện đặc biệt',
      date: '2024-01-14 09:20',
      admin: 'Admin3'
    }
  ];

  const handleAdjustPoints = (type: 'add' | 'deduct') => {
    if (!selectedUser || !adjustmentAmount || !adjustmentReason) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    
    const amount = type === 'add' ? parseInt(adjustmentAmount) : -parseInt(adjustmentAmount);
    console.log('Adjusting points:', { selectedUser, amount, adjustmentReason });
    
    // Reset form
    setSelectedUser('');
    setAdjustmentAmount('');
    setAdjustmentReason('');
    alert(`${type === 'add' ? 'Cộng' : 'Trừ'} ${Math.abs(amount)} điểm thành công!`);
  };

  const handleCreateReward = () => {
    if (!rewardTitle || !rewardAmount || !rewardDescription) {
      alert('Vui lòng điền đầy đủ thông tin phần thưởng!');
      return;
    }
    
    console.log('Creating reward:', { rewardTitle, rewardAmount, rewardDescription });
    
    // Reset form
    setRewardTitle('');
    setRewardAmount('');
    setRewardDescription('');
    alert('Tạo phần thưởng thành công!');
  };

  return (
    <div className="administrator-skillpoints">
      <div className="administrator-skillpoints-header">
        <h2>Quản Lý Điểm Kỹ Năng</h2>
        <p>Điều chỉnh và theo dõi hệ thống điểm thưởng của người dùng</p>
      </div>

      <div className="administrator-skillpoints-stats">
        <div className="administrator-skillpoints-stat">
          <div className="administrator-skillpoints-stat-icon">⚡</div>
          <div className="administrator-skillpoints-stat-number">2.5M</div>
          <div className="administrator-skillpoints-stat-label">Tổng điểm đã phát</div>
        </div>
        <div className="administrator-skillpoints-stat">
          <div className="administrator-skillpoints-stat-icon">🎯</div>
          <div className="administrator-skillpoints-stat-number">150K</div>
          <div className="administrator-skillpoints-stat-label">Điểm đã sử dụng</div>
        </div>
        <div className="administrator-skillpoints-stat">
          <div className="administrator-skillpoints-stat-icon">👑</div>
          <div className="administrator-skillpoints-stat-number">12</div>
          <div className="administrator-skillpoints-stat-label">Phần thưởng hoạt động</div>
        </div>
        <div className="administrator-skillpoints-stat">
          <div className="administrator-skillpoints-stat-icon">📈</div>
          <div className="administrator-skillpoints-stat-number">+25%</div>
          <div className="administrator-skillpoints-stat-label">Tăng trưởng tháng này</div>
        </div>
      </div>

      <div className="administrator-skillpoints-management">
        <div className="administrator-skillpoints-section">
          <h3>🔧 Điều Chỉnh Điểm Người Dùng</h3>
          
          <div className="administrator-skillpoints-form-group">
            <label htmlFor="user-select">Chọn người dùng:</label>
            <select 
              id="user-select"
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Chọn người dùng --</option>
              <option value="user1">Nguyễn Văn A (ID: 001)</option>
              <option value="user2">Trần Thị B (ID: 002)</option>
              <option value="user3">Lê Văn C (ID: 003)</option>
              <option value="user4">Phạm Thị D (ID: 004)</option>
            </select>
          </div>

          <div className="administrator-skillpoints-form-group">
            <label htmlFor="adjustment-amount">Số điểm điều chỉnh:</label>
            <div className="administrator-skillpoints-amount-input">
              <input
                id="adjustment-amount"
                type="number"
                min="1"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="Nhập số điểm..."
              />
              <div className="administrator-skillpoints-amount-display">
                {adjustmentAmount ? `${adjustmentAmount} điểm` : '0 điểm'}
              </div>
            </div>
          </div>

          <div className="administrator-skillpoints-form-group">
            <label htmlFor="adjustment-reason">Lý do điều chỉnh:</label>
            <textarea
              id="adjustment-reason"
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="Nhập lý do điều chỉnh điểm..."
              rows={3}
            />
          </div>

          <div className="administrator-skillpoints-buttons">
            <button 
              className="administrator-skillpoints-btn add"
              onClick={() => handleAdjustPoints('add')}
            >
              Cộng điểm
            </button>
            <button 
              className="administrator-skillpoints-btn deduct"
              onClick={() => handleAdjustPoints('deduct')}
            >
              Trừ điểm
            </button>
          </div>
        </div>

        <div className="administrator-skillpoints-section">
          <h3>🏆 Tạo Phần Thưởng Mới</h3>
          
          <div className="administrator-skillpoints-form-group">
            <label htmlFor="reward-title">Tên phần thưởng:</label>
            <input
              id="reward-title"
              type="text"
              value={rewardTitle}
              onChange={(e) => setRewardTitle(e.target.value)}
              placeholder="Ví dụ: Mentor xuất sắc tháng..."
            />
          </div>

          <div className="administrator-skillpoints-form-group">
            <label htmlFor="reward-points">Số điểm thưởng:</label>
            <div className="administrator-skillpoints-amount-input">
              <input
                id="reward-points"
                type="number"
                min="1"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="Nhập số điểm thưởng..."
              />
              <div className="administrator-skillpoints-amount-display">
                {rewardAmount ? `${rewardAmount} điểm` : '0 điểm'}
              </div>
            </div>
          </div>

          <div className="administrator-skillpoints-form-group">
            <label htmlFor="reward-description">Mô tả phần thưởng:</label>
            <textarea
              id="reward-description"
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              placeholder="Mô tả chi tiết về phần thưởng..."
              rows={3}
            />
          </div>

          <div className="administrator-skillpoints-buttons">
            <button 
              className="administrator-skillpoints-btn add"
              onClick={handleCreateReward}
              style={{ width: '100%' }}
            >
              Tạo phần thưởng
            </button>
          </div>
        </div>
      </div>

      <div className="administrator-skillpoints-history">
        <h3>Lịch Sử Điều Chỉnh Gần Đây</h3>
        <div className="administrator-skillpoints-history-list">
          {recentAdjustments.map((adjustment) => (
            <div key={adjustment.id} className="administrator-skillpoints-history-item">
              <div className="administrator-skillpoints-history-info">
                <h4>{adjustment.user}</h4>
                <p>{adjustment.reason}</p>
                <p><strong>Thực hiện bởi:</strong> {adjustment.admin}</p>
              </div>
              <div className={`administrator-skillpoints-history-amount ${adjustment.amount > 0 ? 'positive' : 'negative'}`}>
                {Math.abs(adjustment.amount)} điểm
              </div>
              <div className="administrator-skillpoints-history-date">
                {adjustment.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillPointManagementTab;
