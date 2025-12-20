import React, { useEffect, useState } from 'react';
import { Trophy, Flame, ShoppingCart } from 'lucide-react';
import { skinService, MeowlSkinResponse } from '../../services/skinService';
import './skin-leaderboard.css';

const SkinLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<MeowlSkinResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await skinService.getSkinLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null; // Or a small loader
  if (leaderboard.length === 0) return null;

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3, 10); // Show top 10

  // Helper to safely get index 0, 1, 2 even if array is smaller
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  return (
    <div className="shop-leaderboard-container">
      <h2 className="shop-leaderboard-title">
        <Trophy size={32} className="text-yellow-400" />
        Top Skins Yêu Thích
        <Flame size={32} className="text-orange-500" />
      </h2>

      <div className="shop-leaderboard-grid">
        {second && (
          <div className="shop-leaderboard-top-card shop-rank-2">
            <div className="shop-leaderboard-rank-badge">2</div>
            <img src={second.imageUrl} alt={second.nameVi} className="shop-leaderboard-top-image" />
            <div className="shop-leaderboard-top-name">{second.nameVi}</div>
            <div className="shop-leaderboard-top-sales">
              <ShoppingCart size={14} /> {second.purchasedCount} lượt mua
            </div>
          </div>
        )}

        {first && (
          <div className="shop-leaderboard-top-card shop-rank-1">
            <div className="shop-leaderboard-rank-badge">1</div>
            <img src={first.imageUrl} alt={first.nameVi} className="shop-leaderboard-top-image" />
            <div className="shop-leaderboard-top-name">{first.nameVi}</div>
            <div className="shop-leaderboard-top-sales">
              <ShoppingCart size={14} /> {first.purchasedCount} lượt mua
            </div>
          </div>
        )}

        {third && (
          <div className="shop-leaderboard-top-card shop-rank-3">
            <div className="shop-leaderboard-rank-badge">3</div>
            <img src={third.imageUrl} alt={third.nameVi} className="shop-leaderboard-top-image" />
            <div className="shop-leaderboard-top-name">{third.nameVi}</div>
            <div className="shop-leaderboard-top-sales">
              <ShoppingCart size={14} /> {third.purchasedCount} lượt mua
            </div>
          </div>
        )}
      </div>

      {others.length > 0 && (
        <div className="shop-leaderboard-other-list">
          {others.map((skin, index) => (
            <div key={skin.id} className="shop-leaderboard-other-item">
              <span className="shop-leaderboard-rank-number">{index + 4}</span>
              <img src={skin.imageUrl} alt={skin.nameVi} className="shop-leaderboard-mini-img" />
              <div className="shop-leaderboard-other-info">
                <span className="shop-leaderboard-other-name">{skin.nameVi}</span>
                <span className="shop-leaderboard-other-sales">
                   {skin.purchasedCount} mua
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkinLeaderboard;
