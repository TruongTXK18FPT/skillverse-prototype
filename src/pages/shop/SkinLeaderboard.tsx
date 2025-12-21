import React, { useEffect, useState } from 'react';
import { ShoppingCart, Crown, Star } from 'lucide-react';
import { skinService, MeowlSkinResponse } from '../../services/skinService';
import './MeowlShopV2.css';

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

  if (loading) return null;
  if (leaderboard.length === 0) return null;

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const runnersUp = leaderboard.slice(3, 10);

  return (
    <div className="shop-v2-podium-section">
      <h2 className="shop-v2-podium-title">
        <Crown size={32} color="#f59e0b" />
        HALL OF FAME
        <Star size={32} color="#f59e0b" />
      </h2>

      <div className="shop-v2-podium-grid">
        {/* Rank 2 */}
        {second && (
          <div className="shop-v2-podium-column shop-v2-rank-2-col">
            <div className="shop-v2-podium-badge">2</div>
            <div className="shop-v2-podium-card shop-v2-rank-2">
              <div className="shop-v2-podium-image-container">
                <img src={second.imageUrl} alt={second.nameVi} className="shop-v2-podium-image" />
              </div>
              <div className="shop-v2-podium-info">
                <div className="shop-v2-podium-name">{second.nameVi}</div>
                <div className="shop-v2-podium-sales">
                  <ShoppingCart size={14} /> {second.purchasedCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rank 1 */}
        {first && (
          <div className="shop-v2-podium-column shop-v2-rank-1-col">
            <div className="shop-v2-podium-badge">
              <Crown size={40} />
            </div>
            <div className="shop-v2-podium-card shop-v2-rank-1">
              <div className="shop-v2-podium-image-container">
                <img src={first.imageUrl} alt={first.nameVi} className="shop-v2-podium-image" />
              </div>
              <div className="shop-v2-podium-info">
                <div className="shop-v2-podium-name">{first.nameVi}</div>
                <div className="shop-v2-podium-sales">
                  <ShoppingCart size={16} /> {first.purchasedCount} SOLD
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rank 3 */}
        {third && (
          <div className="shop-v2-podium-column shop-v2-rank-3-col">
            <div className="shop-v2-podium-badge">3</div>
            <div className="shop-v2-podium-card shop-v2-rank-3">
              <div className="shop-v2-podium-image-container">
                <img src={third.imageUrl} alt={third.nameVi} className="shop-v2-podium-image" />
              </div>
              <div className="shop-v2-podium-info">
                <div className="shop-v2-podium-name">{third.nameVi}</div>
                <div className="shop-v2-podium-sales">
                  <ShoppingCart size={14} /> {third.purchasedCount}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top 4-10 List */}
      {runnersUp.length > 0 && (
        <div className="shop-v2-runners-up">
          <h3 className="shop-v2-runners-title">RISING STARS</h3>
          <div className="shop-v2-runners-grid">
            {runnersUp.map((skin, index) => (
              <div key={skin.skinCode} className="shop-v2-runner-card">
                <div className="shop-v2-runner-rank">#{index + 4}</div>
                <img src={skin.imageUrl} alt={skin.nameVi} className="shop-v2-runner-img" />
                <div className="shop-v2-runner-info">
                  <div className="shop-v2-runner-name">{skin.nameVi}</div>
                  <div className="shop-v2-runner-sales">
                    <ShoppingCart size={12} /> {skin.purchasedCount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkinLeaderboard;
