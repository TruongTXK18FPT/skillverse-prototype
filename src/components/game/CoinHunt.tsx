import React, { useState, useEffect } from 'react';
import { X, Coins, Target, Zap, Trophy } from 'lucide-react';
import './CoinHunt.css';

interface CoinHuntProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinsEarned: (coins: number) => void;
}

interface Coin {
  id: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
  animating: boolean;
}

const CoinHunt: React.FC<CoinHuntProps> = ({ isOpen, onClose, onCoinsEarned }) => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [gameTime, setGameTime] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [gameResult, setGameResult] = useState<{ coins: number; performance: string } | null>(null);

  const coinValues = [5, 10, 15, 20, 25];

  const generateRandomCoin = (): Coin => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * 80 + 10, // 10% to 90% of container width
      y: Math.random() * 80 + 10, // 10% to 90% of container height
      value: coinValues[Math.floor(Math.random() * coinValues.length)],
      collected: false,
      animating: false
    };
  };

  const startGame = () => {
    setGameActive(true);
    setTotalCollected(0);
    setGameTime(30);
    setGameResult(null);
    setCoins([generateRandomCoin(), generateRandomCoin()]);
  };

  const collectCoin = (coinId: string) => {
    setCoins(prevCoins => 
      prevCoins.map(coin => 
        coin.id === coinId 
          ? { ...coin, collected: true, animating: true }
          : coin
      )
    );

    const collectedCoin = coins.find(coin => coin.id === coinId);
    if (collectedCoin) {
      setTotalCollected(prev => prev + collectedCoin.value);
      
      // Remove collected coin after animation and spawn new one
      setTimeout(() => {
        setCoins(prevCoins => {
          const filtered = prevCoins.filter(coin => coin.id !== coinId);
          // Add new coin if game is still active
          if (gameActive && gameTime > 0) {
            return [...filtered, generateRandomCoin()];
          }
          return filtered;
        });
      }, 600);
    }
  };

  const endGame = () => {
    setGameActive(false);
    
    let performance = 'Tốt lắm!';
    if (totalCollected >= 200) performance = 'Xuất sắc!';
    else if (totalCollected >= 150) performance = 'Rất tốt!';
    else if (totalCollected >= 100) performance = 'Tốt!';
    else if (totalCollected >= 50) performance = 'Ổn đấy!';
    else performance = 'Cố gắng hơn!';

    setGameResult({ coins: totalCollected, performance });
    onCoinsEarned(totalCollected);
  };

  // Game timer
  useEffect(() => {
    if (gameActive && gameTime > 0) {
      const timer = setTimeout(() => {
        setGameTime(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameActive && gameTime === 0) {
      endGame();
    }
  }, [gameActive, gameTime, endGame]);

  // Spawn coins periodically
  useEffect(() => {
    if (gameActive && gameTime > 0) {
      const spawnTimer = setInterval(() => {
        if (coins.length < 4) { // Max 4 coins at once
          setCoins(prev => [...prev, generateRandomCoin()]);
        }
      }, 2000);
      return () => clearInterval(spawnTimer);
    }
  }, [gameActive, gameTime, coins.length, generateRandomCoin]);

  const closeGame = () => {
    setGameActive(false);
    setGameResult(null);
    setCoins([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="coin-hunt-overlay">
      <div className="coin-hunt-modal">
        <div className="coin-hunt-header">
          <div className="header-left">
            <h3>🪙 Săn Xu Thần Tốc</h3>
            <p>Thu thập xu nhanh nhất có thể!</p>
          </div>
          <button className="rules-btn" onClick={closeGame}>
            <X />
          </button>
        </div>

        {!gameActive && !gameResult && (
          <div className="game-start">
            <div className="start-content">
              <div className="game-icon">
                <Target size={64} />
              </div>
              <h4>Quy tắc trò chơi</h4>
              <ul className="rules-list">
                <li>🎯 Nhấp vào xu để thu thập</li>
                <li>⏰ Bạn có 30 giây</li>
                <li>🪙 Mỗi xu có giá trị khác nhau (5-25)</li>
                <li>⚡ Xu mới sẽ xuất hiện liên tục</li>
                <li>🏆 Thu thập càng nhiều càng tốt!</li>
              </ul>
              <button className="start-btn" onClick={startGame}>
                <Zap className="start-icon" />
                Bắt đầu săn xu!
              </button>
            </div>
          </div>
        )}

        {gameActive && (
          <div className="game-arena">
            <div className="game-stats">
              <div className="stat">
                <Coins className="stat-icon" />
                <span>{totalCollected} xu</span>
              </div>
              <div className="stat timer">
                <div className="timer-circle">
                  <span>{gameTime}</span>
                </div>
              </div>
              <div className="stat">
                <Target className="stat-icon" />
                <span>{coins.length} xu</span>
              </div>
            </div>

            <div className="hunt-area">
              {coins.map(coin => (
                <div
                  key={coin.id}
                  className={`floating-coin ${coin.collected ? 'collected' : ''} ${coin.animating ? 'animating' : ''}`}
                  style={{
                    left: `${coin.x}%`,
                    top: `${coin.y}%`
                  }}
                  onClick={() => !coin.collected && collectCoin(coin.id)}
                >
                  <div className="coin-inner">
                    <Coins className="coin-icon" />
                    <span className="coin-value">+{coin.value}</span>
                  </div>
                </div>
              ))}
              
              {coins.length === 0 && (
                <div className="waiting-message">
                  <Zap className="waiting-icon" />
                  <span>Đang tạo xu mới...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {gameResult && (
          <div className="game-result">
            <div className="result-header">
              <div className="result-icon">
                <Trophy size={48} />
              </div>
              <h4>{gameResult.performance}</h4>
              <p>Bạn đã hoàn thành trò chơi!</p>
            </div>

            <div className="result-stats">
              <div className="big-stat">
                <div className="big-stat-icon">
                  <Coins />
                </div>
                <div className="big-stat-value">+{gameResult.coins}</div>
                <div className="big-stat-label">Xu kiếm được</div>
              </div>

              <div className="performance-stats">
                <div className="perf-stat">
                  <span className="perf-label">Tốc độ thu thập:</span>
                  <span className="perf-value">{(gameResult.coins / 30).toFixed(1)} xu/giây</span>
                </div>
                <div className="perf-stat">
                  <span className="perf-label">Hiệu suất:</span>
                  <span className="perf-value">{gameResult.performance}</span>
                </div>
              </div>
            </div>

            <div className="result-actions">
              <button className="play-again-btn" onClick={startGame}>
                <Zap className="action-icon" />
                Chơi lại
              </button>
              <button className="claim-btn" onClick={closeGame}>
                <Trophy className="action-icon" />
                Nhận thưởng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinHunt;
