import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Coins, Gift } from 'lucide-react';
import '../../styles/DailySpin.css';

interface DailySpinProps {
  isOpen: boolean;
  onClose: () => void;
  onWin: (prize: number) => void;
}

interface SpinResult {
  prize: number;
  segment: number;
}

const DailySpin: React.FC<DailySpinProps> = ({ isOpen, onClose, onWin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Prize segments (clockwise from top)
  const prizes = [100, 25, 50, 10, 75, 5, 20, 15,30];
  const segmentAngle = 360 / prizes.length;

  useEffect(() => {
    // Check if user has already spun today
    const lastSpin = localStorage.getItem('lastDailySpin');
    const today = new Date().toDateString();
    
    if (lastSpin === today) {
      setHasSpunToday(true);
    }
  }, []);

  const handleSpin = () => {
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setResult(null);

    // Generate random rotation (minimum 3 full rotations)
    const minRotation = 3 * 360;
    const randomRotation = minRotation + Math.random() * 360;
    const finalRotation = rotation + randomRotation;
    
    setRotation(finalRotation);

    // Calculate which segment we landed on
    setTimeout(() => {
      const normalizedRotation = finalRotation % 360;
      const segmentIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) / segmentAngle) % prizes.length;
      const prize = prizes[segmentIndex];
      
      setResult({ prize, segment: segmentIndex });
      setIsSpinning(false);
      setHasSpunToday(true);
      
      // Save spin date
      localStorage.setItem('lastDailySpin', new Date().toDateString());
      
      // Trigger win callback
      onWin(prize);
    }, 3000);
  };

  const resetSpin = () => {
    setRotation(0);
    setResult(null);
    setIsSpinning(false);
    setHasSpunToday(false);
    localStorage.removeItem('lastDailySpin');
  };

  if (!isOpen) return null;

  return (
    <div className="daily-spin-overlay">
      <div className="daily-spin-modal">
        <div className="modal-header">
          <div className="header-info">
            <Gift className="header-icon" />
            <div>
              <h2>🎰 Vòng Quay May Mắn</h2>
              <p>Quay để nhận xu miễn phí mỗi ngày!</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="rules-btn"
              onClick={() => setShowRules(!showRules)}
            >
              Quy tắc
            </button>
            <button className="close-btn" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        {showRules && (
          <div className="rules-section">
            <h3>📋 Quy Tắc Vòng Quay</h3>
            <ul>
              <li>🎯 Mỗi người chỉ được quay 1 lần mỗi ngày</li>
              <li>🎁 Phần thưởng từ 5 đến 100 xu</li>
              <li>⏰ Quyền quay sẽ được làm mới vào 00:00 hàng ngày</li>
              <li>🎪 Vòng quay sẽ xoay ít nhất 3 vòng trước khi dừng</li>
              <li>💰 Xu thưởng sẽ được cộng ngay vào tài khoản</li>
            </ul>
          </div>
        )}

        <div className="spin-container">
          <div className="wheel-wrapper">
            {/* Wheel Pointer */}
            <div className="wheel-pointer">▼</div>
            
            {/* Spinning Wheel */}
            <div 
              className={`wheel ${isSpinning ? 'spinning' : ''}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {prizes.map((prize, index) => (
                <div
                  key={index}
                  className={`wheel-segment segment-${index}`}
                  style={{
                    transform: `rotate(${index * segmentAngle}deg)`,
                    background: `conic-gradient(from ${index * segmentAngle}deg, 
                      ${index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} 0deg, 
                      ${index % 2 === 0 ? '#1d4ed8' : '#7c3aed'} ${segmentAngle}deg)`
                  }}
                >
                  <div className="segment-content">
                    <Coins className="coin-icon" />
                    <span className="prize-amount">{prize}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spin Button */}
          <div className="spin-controls">
            <button
              className={`spin-btn ${isSpinning ? 'spinning' : ''} ${hasSpunToday ? 'disabled' : ''}`}
              onClick={handleSpin}
              disabled={isSpinning || hasSpunToday}
            >
              {isSpinning ? (
                <>
                  <RotateCcw className="spin-icon rotating" />
                  Đang quay...
                </>
              ) : hasSpunToday ? (
                <>
                  <Gift className="spin-icon" />
                  Đã quay hôm nay
                </>
              ) : (
                <>
                  <RotateCcw className="spin-icon" />
                  Quay ngay!
                </>
              )}
            </button>

            {hasSpunToday && (
              <button className="reset-btn" onClick={resetSpin}>
                Reset (Dev)
              </button>
            )}
          </div>

          {/* Result Display */}
          {result && (
            <div className="result-display">
              <div className="result-content">
                <div className="result-icon">🎉</div>
                <h3>Chúc mừng!</h3>
                <p>Bạn đã nhận được</p>
                <div className="prize-display">
                  <Coins className="prize-icon" />
                  <span className="prize-value">{result.prize} xu</span>
                </div>
                <button className="claim-btn" onClick={onClose}>
                  Nhận thưởng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Next Spin Timer */}
        {hasSpunToday && !result && (
          <div className="next-spin-info">
            <p>⏰ Quay tiếp theo: Ngày mai lúc 00:00</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySpin;
