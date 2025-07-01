import React, { useState, useEffect } from 'react';
import { X, Coins, Gift } from 'lucide-react';
import './DailySpin.css';

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
          {/* Arcade Machine */}
          <div className={`arcade-machine ${isSpinning ? 'spinning' : ''} ${result ? 'celebrating' : ''}`}>
            {/* Machine Top */}
            <div className="machine-top">
              <div className="machine-lights">
                <div className="light light-1"></div>
                <div className="light light-2"></div>
                <div className="light light-3"></div>
                <div className="light light-4"></div>
              </div>
              <div className="machine-title">LUCKY SPIN</div>
            </div>

            {/* Machine Body */}
            <div className="machine-body">
              {/* Display Screen */}
              <div className="machine-screen">
                <div className="screen-inner">
                  {!result && !isSpinning && (
                    <div className="screen-text">
                      <div className="screen-title">🎰 PULL THE LEVER!</div>
                      <div className="screen-subtitle">Win 5-100 coins!</div>
                    </div>
                  )}
                  {isSpinning && (
                    <div className="screen-text spinning-text">
                      <div className="screen-title">🎲 SPINNING...</div>
                      <div className="spinning-dots">
                        <span>.</span><span>.</span><span>.</span>
                      </div>
                    </div>
                  )}
                  {result && (
                    <div className="screen-text result-text">
                      <div className="screen-title">🎉 WINNER!</div>
                      <div className="prize-coin">
                        <Coins className="coin-icon" />
                        <span className="coin-value">{result.prize}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Machine Controls */}
              <div className="machine-controls">
                <div className="control-panel">
                  <button
                    className={`spin-lever ${isSpinning ? 'pulling' : ''} ${hasSpunToday ? 'disabled' : ''}`}
                    onClick={handleSpin}
                    disabled={isSpinning || hasSpunToday}
                  >
                    <div className="lever-handle"></div>
                    <div className="lever-base"></div>
                  </button>
                  <div className="lever-label">
                    {hasSpunToday ? 'USED' : 'PULL'}
                  </div>
                </div>
              </div>

              {/* Coin Slot Output */}
              <div className="coin-slot">
                <div className="slot-opening"></div>
                {result && (
                  <div className="coin-output">
                    <div className="output-coin">
                      <Coins className="output-coin-icon" />
                      <span className="output-coin-value">{result.prize}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Machine Base */}
            <div className="machine-base">
              <div className="base-grill">
                <div className="grill-line"></div>
                <div className="grill-line"></div>
                <div className="grill-line"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {result && (
              <button className="claim-btn" onClick={onClose}>
                <Coins className="action-icon" />
                Nhận thưởng
              </button>
            )}
            
            {hasSpunToday && !result && (
              <button className="reset-btn" onClick={resetSpin}>
                Reset (Dev)
              </button>
            )}
          </div>
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
