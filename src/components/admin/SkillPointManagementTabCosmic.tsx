import React, { useState } from 'react';
import {
  Zap, TrendingUp, Award, Gift, Search,
  Plus, Minus, RefreshCw, History, Star, Crown,
  Target, Sparkles, Coins, ArrowUpRight, ArrowDownRight,
  User, Calendar
} from 'lucide-react';
import './SkillPointManagementTabCosmic.css';

interface PointAdjustment {
  id: number;
  user: string;
  userId: string;
  amount: number;
  reason: string;
  date: string;
  admin: string;
  type: 'add' | 'deduct';
}

interface SkillPointStats {
  totalDistributed: number;
  totalUsed: number;
  activeRewards: number;
  monthlyGrowth: number;
  topEarner: string;
  avgPointsPerUser: number;
}

const SkillPointManagementTabCosmic: React.FC = () => {
  // Form state
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  // Reward form state
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'adjust' | 'reward' | 'history'>('adjust');

  // Mock data
  const [stats] = useState<SkillPointStats>({
    totalDistributed: 2500000,
    totalUsed: 150000,
    activeRewards: 12,
    monthlyGrowth: 25,
    topEarner: 'Nguyễn Văn A',
    avgPointsPerUser: 1250
  });

  const [recentAdjustments] = useState<PointAdjustment[]>([
    {
      id: 1,
      user: 'Nguyễn Văn A',
      userId: 'USR001',
      amount: 500,
      reason: 'Hoàn thành khóa học xuất sắc',
      date: '2024-01-15 14:30',
      admin: 'Admin1',
      type: 'add'
    },
    {
      id: 2,
      user: 'Trần Thị B',
      userId: 'USR002',
      amount: 200,
      reason: 'Vi phạm quy tắc cộng đồng',
      date: '2024-01-15 10:15',
      admin: 'Admin2',
      type: 'deduct'
    },
    {
      id: 3,
      user: 'Lê Văn C',
      userId: 'USR003',
      amount: 1000,
      reason: 'Thưởng mentor xuất sắc tháng',
      date: '2024-01-14 16:45',
      admin: 'Admin1',
      type: 'add'
    },
    {
      id: 4,
      user: 'Phạm Thị D',
      userId: 'USR004',
      amount: 300,
      reason: 'Tham gia sự kiện đặc biệt',
      date: '2024-01-14 09:20',
      admin: 'Admin3',
      type: 'add'
    },
    {
      id: 5,
      user: 'Hoàng Văn E',
      userId: 'USR005',
      amount: 150,
      reason: 'Hoàn thành nhiệm vụ hàng ngày',
      date: '2024-01-13 18:00',
      admin: 'System',
      type: 'add'
    }
  ]);

  const mockUsers = [
    { id: 'USR001', name: 'Nguyễn Văn A', points: 15000 },
    { id: 'USR002', name: 'Trần Thị B', points: 8500 },
    { id: 'USR003', name: 'Lê Văn C', points: 22000 },
    { id: 'USR004', name: 'Phạm Thị D', points: 5200 },
    { id: 'USR005', name: 'Hoàng Văn E', points: 12300 },
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleAdjustPoints = (type: 'add' | 'deduct') => {
    if (!selectedUser || !adjustmentAmount || !adjustmentReason) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      const amount = parseInt(adjustmentAmount);
      console.log('Adjusting points:', { selectedUser, amount, adjustmentReason, type });
      
      // Reset form
      setSelectedUser('');
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setLoading(false);
      alert(`${type === 'add' ? 'Cộng' : 'Trừ'} ${amount} điểm thành công!`);
    }, 1000);
  };

  const handleCreateReward = () => {
    if (!rewardTitle || !rewardAmount || !rewardDescription) {
      alert('Vui lòng điền đầy đủ thông tin phần thưởng!');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      console.log('Creating reward:', { rewardTitle, rewardAmount, rewardDescription });
      
      // Reset form
      setRewardTitle('');
      setRewardAmount('');
      setRewardDescription('');
      setLoading(false);
      alert('Tạo phần thưởng thành công!');
    }, 1000);
  };

  return (
    <div className="sp-cosmic">
      {/* Header Section */}
      <div className="sp-section sp-section-header">
        <div className="sp-header">
          <div className="sp-header-left">
            <div className="sp-header-icon">
              <Zap size={32} />
            </div>
            <div>
              <h2>Quản Lý Điểm Kỹ Năng</h2>
              <p>Điều chỉnh và theo dõi hệ thống điểm thưởng của người dùng</p>
            </div>
          </div>
          <button className="sp-refresh-btn" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="sp-section sp-section-stats">
        <div className="sp-stats-grid">
          {/* Total Distributed - Electric Yellow */}
          <div className="sp-stat-card vibrant-yellow">
            <div className="sp-stat-glow"></div>
            <div className="sp-stat-icon">
              <Coins size={28} />
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">{formatNumber(stats.totalDistributed)}</div>
              <div className="sp-stat-label">Tổng điểm đã phát</div>
            </div>
          </div>

          {/* Total Used - Purple */}
          <div className="sp-stat-card vibrant-purple">
            <div className="sp-stat-glow"></div>
            <div className="sp-stat-icon">
              <Target size={28} />
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">{formatNumber(stats.totalUsed)}</div>
              <div className="sp-stat-label">Điểm đã sử dụng</div>
            </div>
          </div>

          {/* Active Rewards - Pink */}
          <div className="sp-stat-card vibrant-pink">
            <div className="sp-stat-glow"></div>
            <div className="sp-stat-icon">
              <Gift size={28} />
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">{stats.activeRewards}</div>
              <div className="sp-stat-label">Phần thưởng hoạt động</div>
            </div>
          </div>

          {/* Monthly Growth - Green */}
          <div className="sp-stat-card vibrant-green">
            <div className="sp-stat-glow"></div>
            <div className="sp-stat-icon">
              <TrendingUp size={28} />
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">+{stats.monthlyGrowth}%</div>
              <div className="sp-stat-label">Tăng trưởng tháng</div>
            </div>
          </div>

          {/* Top Earner - Cyan */}
          <div className="sp-stat-card vibrant-cyan">
            <div className="sp-stat-glow"></div>
            <div className="sp-stat-icon">
              <Crown size={28} />
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">{stats.topEarner.split(' ')[0]}</div>
              <div className="sp-stat-label">Top người dùng</div>
            </div>
          </div>

          {/* Avg Points - Orange */}
          <div className="sp-stat-card vibrant-orange">
            <div className="sp-stat-glow"></div>
            <div className="sp-stat-icon">
              <Star size={28} />
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">{formatNumber(stats.avgPointsPerUser)}</div>
              <div className="sp-stat-label">Điểm TB/người</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sp-section sp-section-tabs">
        <div className="sp-tab-nav">
          <button 
            className={`sp-tab-btn ${activeSection === 'adjust' ? 'active' : ''}`}
            onClick={() => setActiveSection('adjust')}
          >
            <Zap size={18} />
            Điều chỉnh điểm
          </button>
          <button 
            className={`sp-tab-btn ${activeSection === 'reward' ? 'active' : ''}`}
            onClick={() => setActiveSection('reward')}
          >
            <Gift size={18} />
            Tạo phần thưởng
          </button>
          <button 
            className={`sp-tab-btn ${activeSection === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSection('history')}
          >
            <History size={18} />
            Lịch sử
          </button>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="sp-section sp-section-content">
        {/* Adjust Points Section */}
        {activeSection === 'adjust' && (
          <div className="sp-content-card sp-adjust-form">
            <div className="sp-card-header">
              <Sparkles size={24} />
              <h3>Điều Chỉnh Điểm Người Dùng</h3>
            </div>
            
            <div className="sp-form-body">
              {/* Search User */}
              <div className="sp-form-group">
                <label>Tìm kiếm người dùng</label>
                <div className="sp-search-wrapper">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Nhập tên hoặc ID người dùng..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
              </div>

              {/* User Select */}
              <div className="sp-form-group">
                <label>Chọn người dùng</label>
                <div className="sp-select-wrapper">
                  <User size={18} />
                  <select 
                    value={selectedUser} 
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">-- Chọn người dùng --</option>
                    {mockUsers.filter(u => 
                      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
                      u.id.toLowerCase().includes(searchUser.toLowerCase())
                    ).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} (ID: {user.id}) - {formatNumber(user.points)} điểm
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount Input */}
              <div className="sp-form-group">
                <label>Số điểm điều chỉnh</label>
                <div className="sp-amount-input">
                  <div className="sp-input-wrapper">
                    <Coins size={18} />
                    <input
                      type="number"
                      min="1"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      placeholder="Nhập số điểm..."
                    />
                  </div>
                  <div className="sp-amount-preview">
                    <Sparkles size={16} />
                    <span>{adjustmentAmount ? `${parseInt(adjustmentAmount).toLocaleString()} điểm` : '0 điểm'}</span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="sp-form-group">
                <label>Lý do điều chỉnh</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Nhập lý do điều chỉnh điểm..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="sp-action-buttons">
                <button 
                  className="sp-btn sp-btn-add"
                  onClick={() => handleAdjustPoints('add')}
                  disabled={loading}
                >
                  <Plus size={18} />
                  Cộng điểm
                </button>
                <button 
                  className="sp-btn sp-btn-deduct"
                  onClick={() => handleAdjustPoints('deduct')}
                  disabled={loading}
                >
                  <Minus size={18} />
                  Trừ điểm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Reward Section */}
        {activeSection === 'reward' && (
          <div className="sp-content-card sp-reward-form">
            <div className="sp-card-header">
              <Award size={24} />
              <h3>Tạo Phần Thưởng Mới</h3>
            </div>
            
            <div className="sp-form-body">
              {/* Reward Title */}
              <div className="sp-form-group">
                <label>Tên phần thưởng</label>
                <div className="sp-input-wrapper">
                  <Gift size={18} />
                  <input
                    type="text"
                    value={rewardTitle}
                    onChange={(e) => setRewardTitle(e.target.value)}
                    placeholder="Ví dụ: Mentor xuất sắc tháng..."
                  />
                </div>
              </div>

              {/* Reward Amount */}
              <div className="sp-form-group">
                <label>Số điểm thưởng</label>
                <div className="sp-amount-input">
                  <div className="sp-input-wrapper">
                    <Coins size={18} />
                    <input
                      type="number"
                      min="1"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      placeholder="Nhập số điểm thưởng..."
                    />
                  </div>
                  <div className="sp-amount-preview">
                    <Star size={16} />
                    <span>{rewardAmount ? `${parseInt(rewardAmount).toLocaleString()} điểm` : '0 điểm'}</span>
                  </div>
                </div>
              </div>

              {/* Reward Description */}
              <div className="sp-form-group">
                <label>Mô tả phần thưởng</label>
                <textarea
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về phần thưởng và điều kiện nhận..."
                  rows={4}
                />
              </div>

              {/* Create Button */}
              <div className="sp-action-buttons">
                <button 
                  className="sp-btn sp-btn-create"
                  onClick={handleCreateReward}
                  disabled={loading}
                >
                  <Sparkles size={18} />
                  Tạo phần thưởng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        {activeSection === 'history' && (
          <div className="sp-content-card sp-history">
            <div className="sp-card-header">
              <History size={24} />
              <h3>Lịch Sử Điều Chỉnh Gần Đây</h3>
            </div>
            
            <div className="sp-history-list">
              {recentAdjustments.map((item) => (
                <div key={item.id} className={`sp-history-item ${item.type}`}>
                  <div className="sp-history-icon">
                    {item.type === 'add' ? (
                      <ArrowUpRight size={20} />
                    ) : (
                      <ArrowDownRight size={20} />
                    )}
                  </div>
                  
                  <div className="sp-history-info">
                    <div className="sp-history-user">
                      <User size={14} />
                      <span>{item.user}</span>
                      <span className="sp-history-userid">({item.userId})</span>
                    </div>
                    <div className="sp-history-reason">{item.reason}</div>
                    <div className="sp-history-meta">
                      <span><Calendar size={12} /> {item.date}</span>
                      <span><User size={12} /> {item.admin}</span>
                    </div>
                  </div>
                  
                  <div className={`sp-history-amount ${item.type}`}>
                    {item.type === 'add' ? '+' : '-'}{item.amount.toLocaleString()}
                    <span>điểm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillPointManagementTabCosmic;
