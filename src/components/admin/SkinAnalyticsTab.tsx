import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Trophy, TrendingUp, Users, Crown } from 'lucide-react';
import { skinService, MeowlSkinResponse } from '../../services/skinService';
import './SkinAnalyticsTab.css';

const SkinAnalyticsTab: React.FC = () => {
  const [data, setData] = useState<MeowlSkinResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const stats = await skinService.getSkinStats();
      setData(stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading analytics...</div>;
  }

  // Calculate summary stats
  const totalSkins = data.length;
  const totalPurchases = data.reduce((acc, skin) => acc + (skin.purchasedCount || 0), 0);
  const totalActiveUsers = data.reduce((acc, skin) => acc + (skin.usedCount || 0), 0); // Approximate
  const topSkin = data.length > 0 ? data[0] : null;

  // Prepare chart data
  const topSellingData = data
    .slice(0, 5)
    .map(skin => ({
      name: skin.nameVi,
      purchases: skin.purchasedCount || 0,
      active: skin.usedCount || 0
    }));

  return (
    <div className="skin-analytics-container">
      <div className="skin-analytics-header">
        <h2 className="skin-analytics-title">Skin Analytics Center</h2>
        <p className="skin-analytics-subtitle">Real-time statistics on skin popularity and sales performance</p>
      </div>

      <div className="skin-analytics-stat-cards-row">
        <div className="skin-analytics-stat-card">
          <TrendingUp className="skin-analytics-stat-icon" size={24} />
          <div className="skin-analytics-stat-card-title">Total Purchases</div>
          <div className="skin-analytics-stat-card-value">{totalPurchases}</div>
        </div>
        <div className="skin-analytics-stat-card">
          <Crown className="skin-analytics-stat-icon" size={24} />
          <div className="skin-analytics-stat-card-title">Total Skins</div>
          <div className="skin-analytics-stat-card-value">{totalSkins}</div>
        </div>
        <div className="skin-analytics-stat-card">
          <Users className="skin-analytics-stat-icon" size={24} />
          <div className="skin-analytics-stat-card-title">Active Usage</div>
          <div className="skin-analytics-stat-card-value">{totalActiveUsers}</div>
        </div>
        {topSkin && (
          <div className="skin-analytics-stat-card" style={{ borderColor: '#f59e0b' }}>
            <Trophy className="skin-analytics-stat-icon" size={24} color="#f59e0b" />
            <div className="skin-analytics-stat-card-title">Top Performer</div>
            <div className="skin-analytics-stat-card-value" style={{ fontSize: '1.5rem' }}>{topSkin.nameVi}</div>
          </div>
        )}
      </div>

      <div className="skin-analytics-grid">
        <div className="skin-analytics-chart-card">
          <h3 className="skin-analytics-chart-title">
            <TrendingUp size={20} className="text-blue-400" />
            Top 5 Best Selling Skins
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={topSellingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="purchases" name="Lượt mua" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active" name="Đang sử dụng" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="skin-analytics-leaderboard-card">
          <h3 className="skin-analytics-chart-title">
            <Trophy size={20} className="text-yellow-400" />
            Leaderboard
          </h3>
          <div className="skin-analytics-leaderboard-list">
            {data.slice(0, 5).map((skin, index) => (
              <div key={skin.id} className="skin-analytics-leaderboard-item">
                <div className={`skin-analytics-rank-badge skin-analytics-rank-${index + 1} ${index > 2 ? 'skin-analytics-rank-other' : ''}`}>
                  {index + 1}
                </div>
                <img src={skin.imageUrl} alt={skin.name} className="skin-analytics-mini-preview" />
                <div className="skin-analytics-info">
                  <span className="skin-analytics-name">{skin.nameVi}</span>
                  <div className="skin-analytics-stats-row">
                    <span>Sold: <span className="skin-analytics-stat-highlight">{skin.purchasedCount}</span></span>
                    {skin.isPremium && <span className="text-yellow-400 text-xs border border-yellow-500/30 px-1 rounded">Premium</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinAnalyticsTab;
