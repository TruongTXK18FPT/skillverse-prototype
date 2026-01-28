import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Coins, Zap, Loader2, Trophy } from 'lucide-react';
import {
  GameSessionResponse,
  MiniGameDefinition,
  startGameSession,
  completeGameSession,
  getGame
} from '../../../services/gamificationService';
import './MeowlAdventure.css';

const GAME_KEY = 'meowl-adventure';

// Types for game entities
interface Enemy {
  id: string;
  x: number; // Horizontal position
  y: number; // Vertical position
  size: number;
  speed: number;
  type: 'normal' | 'fast' | 'tank';
  actionRequired?: 'slash-blue' | 'parry-blue' | 'slash-red' | 'parry-red'; // 4 note types
  hit: boolean;
  inRange: boolean; // Whether note is in action range
  lane: 1 | 2 | 3 | 4; // Which lane (D, F, J, K)
}

interface ActionEffect {
  id: string;
  type: 'slash-blue' | 'parry-blue' | 'slash-red' | 'parry-red';
  x: number;
  y: number;
  timestamp: number;
  lane: 1 | 2 | 3 | 4;
}

interface GameState {
  isRunning: boolean;
  lives: number;
  score: number;
  time: number;
  enemiesKilled: number;
  accuracy: number; // % of successful QTEs
  status: 'idle' | 'playing' | 'gameOver' | 'paused';
}

interface MeowlAdventureProps {
  onCoinsEarned?: (coins: number) => void;
  onClose?: () => void;
}

const MeowlAdventure: React.FC<MeowlAdventureProps> = ({ onCoinsEarned, onClose }) => {
  const navigate = useNavigate();
  const handleCloseGame = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/gamification');
    }
  };

  // API state
  const [gameSession, setGameSession] = useState<GameSessionResponse | null>(null);
  const [gameDefinition, setGameDefinition] = useState<MiniGameDefinition | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isRunning: false,
    lives: 3,
    score: 0,
    time: 60,
    enemiesKilled: 0,
    accuracy: 100,
    status: 'idle'
  });

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [gameResult, setGameResult] = useState<{ 
    score: number; 
    coinsEarned: number; 
    xpEarned: number;
    performance: string 
  } | null>(null);
  const [actionEffects, setActionEffects] = useState<ActionEffect[]>([]);

  // Refs for game loop
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enemyCounterRef = useRef(0);

  // Load game definition on mount
  useEffect(() => {
    const loadGameDefinition = async () => {
      try {
        const gameDef = await getGame(GAME_KEY);
        setGameDefinition(gameDef);
      } catch (error) {
        console.warn('Failed to load game definition, using offline mode:', error);
      }
    };
    loadGameDefinition();
  }, []);

  // Start game session with API
  const initializeGameSession = useCallback(async () => {
    if (isLoadingApi) return;
    
    setIsLoadingApi(true);
    setApiError(null);
    
    try {
      const session = await startGameSession({ gameKey: GAME_KEY });
      setGameSession(session);
      setGameStartTime(Date.now());
      console.log('Meowl Adventure session started:', session.sessionId);
    } catch (error: any) {
      console.warn('Failed to start game session:', error);
      setGameStartTime(Date.now());
      if (error?.response?.data?.message) {
        setApiError(error.response.data.message);
      }
    } finally {
      setIsLoadingApi(false);
    }
  }, [isLoadingApi]);

  // Initialize game
  const startGame = useCallback(async () => {
    await initializeGameSession();
    
    setGameState({
      isRunning: true,
      lives: 3,
      score: 0,
      time: 60,
      enemiesKilled: 0,
      accuracy: 100,
      status: 'playing'
    });
    setEnemies([]);
    setGameResult(null);
    enemyCounterRef.current = 0;
  }, []);

  // Generate a random note (Beat Saber style)
  const generateEnemy = useCallback((): Enemy => {
    const types: Array<'normal' | 'fast' | 'tank'> = ['normal', 'fast', 'tank'];
    const actions: Array<'slash-blue' | 'parry-blue' | 'slash-red' | 'parry-red'> = [
      'slash-blue',   // D key
      'parry-blue',   // F key
      'parry-red',    // J key
      'slash-red'     // K key
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];

    let speed = 10; // Base speed for notes
    let size = 80; // Note size
    if (randomType === 'fast') {
      speed = 15;
      size = 80;
    } else if (randomType === 'tank') {
      speed = 5;
      size = 80;
    }

    // Determine lane based on action (4 lanes for D, F, J, K)
    let lane: 1 | 2 | 3 | 4;
    if (randomAction === 'slash-blue') lane = 1; // D key - top lane
    else if (randomAction === 'parry-blue') lane = 2; // F key
    else if (randomAction === 'parry-red') lane = 3; // J key
    else lane = 4; // K key - bottom lane

    // Calculate Y position based on lane
    // Game window is 80vh, divide into 4 equal lanes
    const gameWindowHeight = window.innerHeight * 0.8;
    const laneHeight = gameWindowHeight * 0.7 / 4; // Use 70% of height for 4 lanes
    const startY = gameWindowHeight * 0.15; // Start at 15% from top
    const y = startY + (lane - 1) * laneHeight + laneHeight / 2 - size / 2;

    return {
      id: `enemy-${Date.now()}-${Math.random()}`,
      x: 800, // Start from right side of container
      y: y,
      size,
      speed,
      type: randomType,
      actionRequired: randomAction,
      hit: false,
      inRange: false,
      lane
    };
  }, []);

  // Handle note hits (D, F, J, K keys)
  const handleAction = useCallback((action: 'slash-blue' | 'parry-blue' | 'parry-red' | 'slash-red') => {
    if (gameState.status !== 'playing' || enemies.length === 0) return;

    // Find first note in range that needs this action (first come first serve)
    const targetEnemy = enemies
      .filter(e => e.inRange && !e.hit)
      .sort((a, b) => a.x - b.x)[0]; // Get closest note

    if (targetEnemy && targetEnemy.actionRequired === action) {
      // Successful hit
      let points = 0;
      if (action === 'parry-blue' || action === 'parry-red') points = 200;
      else if (action === 'slash-blue' || action === 'slash-red') points = 100;

      setGameState(prev => ({
        ...prev,
        score: prev.score + points,
        enemiesKilled: prev.enemiesKilled + 1
      }));

      // Add sword/player animation
      const swordElement = document.querySelector('.player-sword');
      if (swordElement) {
        if (action.includes('slash')) {
          swordElement.classList.add('slash');
          setTimeout(() => swordElement.classList.remove('slash'), 300);
        } else if (action.includes('parry')) {
          swordElement.classList.add('parry');
          setTimeout(() => swordElement.classList.remove('parry'), 300);
        }
      }

      // Add action effect at note position
      setActionEffects(prev => [...prev, {
        id: `effect-${Date.now()}`,
        type: action,
        x: targetEnemy.x,
        y: targetEnemy.y,
        timestamp: Date.now(),
        lane: targetEnemy.lane
      }]);

      // Remove note
      setEnemies(prev => prev.filter(e => e.id !== targetEnemy.id));

      // Check if should gain extra life (every 10 notes hit)
      setGameState(prev => {
        const newKilled = prev.enemiesKilled + 1;
        if (newKilled % 10 === 0) {
          return { ...prev, lives: Math.min(prev.lives + 1, 5) };
        }
        return prev;
      });
    }
  }, [gameState.status, enemies]);

  // Keyboard event listener for 4-finger rhythm game (D, F, J, K)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.status !== 'playing') return;

      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          handleAction('slash-blue'); // D key - blue slash
          break;
        case 'f':
          e.preventDefault();
          handleAction('parry-blue'); // F key - blue parry
          break;
        case 'j':
          e.preventDefault();
          handleAction('parry-red'); // J key - red parry
          break;
        case 'k':
          e.preventDefault();
          handleAction('slash-red'); // K key - red slash
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.status, handleAction]);

  // Game loop - move enemies
  useEffect(() => {
    if (gameState.status !== 'playing') {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setEnemies(prevEnemies => {
        const updated = prevEnemies
          .map(enemy => {
            const newX = enemy.x - enemy.speed;
            // Check if enemy is in action range (between 100-250px from left)
            const inRange = newX >= 250 && newX <= 400;

            return {
              ...enemy,
              x: newX,
              inRange
            };
          })
          .filter(enemy => {
            // Check if enemy reached player (x < 50)
            if (enemy.x < 50 && !enemy.hit) {
              setGameState(prev => ({
                ...prev,
                lives: prev.lives - 1
              }));
              return false; // Remove enemy
            }
            // Remove enemies that went too far off screen
            return enemy.x > -50;
          });

        return updated;
      });
    }, 50); // 20 FPS for smooth movement

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState.status]);

  // Spawn enemies periodically
  useEffect(() => {
    if (gameState.status !== 'playing') {
      if (spawnRef.current) clearInterval(spawnRef.current);
      return;
    }

    spawnRef.current = setInterval(() => {
      setEnemies(prev => [...prev, generateEnemy()]);
    }, 1500); // Spawn new enemy every 1.5 seconds

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [gameState.status, generateEnemy]);

  // Timer countdown
  useEffect(() => {
    if (gameState.status !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        const newTime = prev.time - 1;

        if (newTime <= 0) {
          return { ...prev, time: 0, status: 'gameOver', isRunning: false };
        }
        return { ...prev, time: newTime };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.status]);

  // Clean up action effects after animation
  useEffect(() => {
    if (actionEffects.length === 0) return;

    const cleanup = setTimeout(() => {
      const now = Date.now();
      setActionEffects(prev => prev.filter(effect => now - effect.timestamp < 500));
    }, 100);

    return () => clearTimeout(cleanup);
  }, [actionEffects]);

  // Check game over conditions
  useEffect(() => {
    // Game over: out of lives
    if (gameState.lives <= 0 && gameState.status === 'playing') {
      setGameState(prev => ({ ...prev, status: 'gameOver', isRunning: false }));
    }

    // Time up or game over - finalize with API
    if (gameState.status === 'gameOver' && !gameResult) {
      const finalizeGame = async () => {
        const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
        const playerWon = gameState.time <= 0 && gameState.lives > 0; // Survived the full time

        let performance = 'Tốt lắm!';
        if (gameState.score >= 5000) performance = 'Xuất sắc!';
        else if (gameState.score >= 3000) performance = 'Rất tốt!';
        else if (gameState.score >= 1000) performance = 'Tốt!';
        else if (gameState.score >= 500) performance = 'Ổn đấy!';
        else performance = 'Cố gắng hơn!';

        if (gameSession) {
          try {
            const result = await completeGameSession({
              sessionId: gameSession.sessionId,
              sessionStatus: playerWon ? 'COMPLETED' : 'FAILED',
              scoreAchieved: gameState.score,
              durationSeconds,
              sessionData: JSON.stringify({
                enemiesKilled: gameState.enemiesKilled,
                livesRemaining: gameState.lives,
                timeRemaining: gameState.time
              })
            });

            setGameResult({
              score: gameState.score,
              coinsEarned: result.coinsEarned || 0,
              xpEarned: result.xpEarned || 0,
              performance
            });

            onCoinsEarned?.(result.coinsEarned || 0);
            console.log('Meowl Adventure completed:', result);
          } catch (error) {
            console.warn('Failed to complete game session:', error);
            // Offline fallback
            const offlineCoins = Math.floor(gameState.score / 10) + (gameState.enemiesKilled * 5);
            setGameResult({
              score: gameState.score,
              coinsEarned: offlineCoins,
              xpEarned: 10,
              performance: performance + ' (Offline)'
            });
            onCoinsEarned?.(offlineCoins);
          }
        } else {
          // Pure offline mode
          const offlineCoins = Math.floor(gameState.score / 10) + (gameState.enemiesKilled * 5);
          setGameResult({
            score: gameState.score,
            coinsEarned: offlineCoins,
            xpEarned: 10,
            performance
          });
          onCoinsEarned?.(offlineCoins);
        }
      };

      finalizeGame();
    }
  }, [gameState.lives, gameState.status, gameState.score, gameState.enemiesKilled, gameResult, onCoinsEarned, gameSession, gameStartTime]);

  // Close game
  const closeGame = () => {
    setGameState({
      isRunning: false,
      lives: 3,
      score: 0,
      time: 60,
      enemiesKilled: 0,
      accuracy: 100,
      status: 'idle'
    });
    setEnemies([]);
    setGameResult(null);
    setGameSession(null);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    handleCloseGame();
  };

  return (
    <div className="meowladv-overlay">
      <div className="meowladv-modal">
        {/* Game Info Header */}
        {gameDefinition && gameState.status === 'idle' && (
          <div className="meowladv-game-info-header">
            <div className="meowladv-info-item">
              <Coins size={18} className="meowladv-coin-icon" />
              <span>{gameDefinition.baseCoinReward}-{gameDefinition.maxCoinReward} xu</span>
            </div>
            {gameDefinition.isPremiumOnly && (
              <div className="meowladv-premium-badge">
                <Zap size={14} />
                Premium
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoadingApi && (
          <div className="meowladv-loading">
            <Loader2 className="meowladv-spinner" size={32} />
            <span>Đang kết nối...</span>
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div className="meowladv-error">⚠️ {apiError}</div>
        )}

        {/* Game Start Screen */}
        {gameState.status === 'idle' && !gameResult && (
          <div className="meowladv-start-screen">
            <div className="meowladv-start-content">
              <h4>🎮 Rhythm Adventure - 4 Finger Mode</h4>
              <ul className="meowladv-rules-list">
                <li>❤️ Bạn có 3 mạng sống, cố gắng sinh tồn trong 60s</li>
                <li>🎹 Sử dụng 4 ngón tay: D, F, J, K để đánh nốt nhạc</li>
                <li>🔵 D = Slash Blue (+100), F = Parry Blue (+200)</li>
                <li>🔴 J = Parry Red (+200), K = Slash Red (+100)</li>
                <li>🎯 Mỗi 10 nốt nhạc hit = +1 mạng</li>
                <li>💥 Để nốt nhạc vượt qua = mất 1 mạng</li>
              </ul>
              <button className="meowladv-start-btn" onClick={startGame} disabled={isLoadingApi}>
                <Play className="meowladv-start-icon" />
                Bắt đầu trò chơi!
              </button>
            </div>
          </div>
        )}

        {/* Game Screen */}
        {gameState.status === 'playing' && (
          <div className="game-screen">
            {/* HUD */}
            <div className="game-hud">
              <div className="hud-item">
                <span className="hud-label">Mạng:</span>
                <span className="hud-value lives-indicator">
                  {'❤️'.repeat(gameState.lives)}
                </span>
              </div>
              <div className="hud-item">
                <span className="hud-label">Điểm:</span>
                <span className="hud-value">{gameState.score}</span>
              </div>
              <div className="hud-item">
                <span className="hud-label">Thời gian:</span>
                <span className="hud-value">{gameState.time}s</span>
              </div>
              <div className="hud-item">
                <span className="hud-label">Tiêu diệt:</span>
                <span className="hud-value">{gameState.enemiesKilled}</span>
              </div>
            </div>

            {/* Game Canvas Area */}
            <div className="game-canvas">
              {/* Action Range Indicator */}
              <div className="action-range-zone"></div>

              {/* Player character (left side) */}
              <div className="player-character">
                <img src="/game_asset/meowl_adventure/meowl_protagonist.png" alt="Player" className="player-sprite" />
                <img src="/game_asset/meowl_adventure/weapon_sword.png" alt="Sword" className="player-sword" />
              </div>

              {/* Action Effects */}
              <div className="effects-container">
                {actionEffects.map(effect => (
                  <div
                    key={effect.id}
                    className={`action-effect effect-${effect.type}`}
                    style={{
                      left: `${effect.x}px`,
                      top: `${effect.y}px`,
                    }}
                  >
                    {(effect.type === 'slash-blue' || effect.type === 'slash-red') && (
                      <img src="/game_asset/meowl_adventure/sword_slash_effect.png" alt="Slash" 
                           className={effect.type === 'slash-red' ? 'effect-red-tint' : ''} />
                    )}
                    {(effect.type === 'parry-blue' || effect.type === 'parry-red') && (
                      <img src="/game_asset/meowl_adventure/sword_parry_effect.png" alt="Parry"
                           className={effect.type === 'parry-red' ? 'effect-red-tint' : ''} />
                    )}
                  </div>
                ))}
              </div>

              {/* Notes (Beat Saber style) */}
              <div className="enemies-container">
                {enemies.map(enemy => {
                  // Determine note color based on action type
                  const isRed = enemy.actionRequired?.includes('red');
                  const isSlash = enemy.actionRequired?.includes('slash');
                  
                  return (
                    <div
                      key={enemy.id}
                      className={`note note-${isRed ? 'red' : 'blue'} ${enemy.inRange ? 'in-range' : ''} note-lane-${enemy.lane}`}
                      style={{
                        /* Position styles - left: horizontal position from right */
                        left: `${enemy.x}px`,
                        /* Position styles - top: vertical position from top */
                        top: `${enemy.y}px`,
                        /* Position styles - width & height */
                        width: `${enemy.size}px`,
                        height: `${enemy.size}px`,
                      }}
                    >
                      {/* Note icon based on type */}
                      <div className="note-icon">
                        {isSlash ? '⚔️' : '🛡️'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4-Finger Action Buttons */}
              <div className="qte-buttons qte-4finger">
                <button
                  className="qte-btn qte-slash-blue"
                  onClick={() => handleAction('slash-blue')}
                  title="Press D"
                >
                  <span className="qte-key">D</span>
                  <span className="qte-action">⚔️ Blue</span>
                  <span className="qte-score">+100</span>
                </button>
                <button
                  className="qte-btn qte-parry-blue"
                  onClick={() => handleAction('parry-blue')}
                  title="Press F"
                >
                  <span className="qte-key">F</span>
                  <span className="qte-action">🛡️ Blue</span>
                  <span className="qte-score">+200</span>
                </button>
                <button
                  className="qte-btn qte-parry-red"
                  onClick={() => handleAction('parry-red')}
                  title="Press J"
                >
                  <span className="qte-key">J</span>
                  <span className="qte-action">🛡️ Red</span>
                  <span className="qte-score">+200</span>
                </button>
                <button
                  className="qte-btn qte-slash-red"
                  onClick={() => handleAction('slash-red')}
                  title="Press K"
                >
                  <span className="qte-key">K</span>
                  <span className="qte-action">⚔️ Red</span>
                  <span className="qte-score">+100</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.status === 'gameOver' && gameResult && (
          <div className="meowladv-end-screen">
            <div className="meowladv-end-content">
              <div className="meowladv-end-icon">
                <Trophy size={48} />
              </div>
              <h4 className="meowladv-end-title">{gameResult.performance}</h4>
              
              {/* Result Stats */}
              <div className="meowladv-result-stats">
                <div className="meowladv-stat-item">
                  <span className="meowladv-stat-label">Điểm cuối cùng</span>
                  <span className="meowladv-stat-value">{gameResult.score}</span>
                </div>
              </div>

              {/* Rewards */}
              <div className="meowladv-rewards">
                <div className="meowladv-reward-item">
                  <Coins size={24} className="meowladv-reward-icon meowladv-coin-icon" />
                  <span className="meowladv-reward-value">+{gameResult.coinsEarned}</span>
                  <span className="meowladv-reward-label">Xu</span>
                </div>
                <div className="meowladv-reward-item">
                  <Zap size={24} className="meowladv-reward-icon meowladv-xp-icon" />
                  <span className="meowladv-reward-value">+{gameResult.xpEarned}</span>
                  <span className="meowladv-reward-label">XP</span>
                </div>
              </div>

              <div className="meowladv-end-buttons">
                <button className="meowladv-start-btn" onClick={startGame}>
                  <Play className="meowladv-btn-icon" />
                  Chơi lại
                </button>
                <button className="meowladv-exit-btn" onClick={closeGame}>
                  Thoát
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeowlAdventure;
