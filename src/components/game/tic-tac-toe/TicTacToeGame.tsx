import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import MeowlActor, { MeowlAction } from './MeowlActor';
import './TicTacToeGame.css';

type Player = 'X' | 'O';
type BoardState = (Player | null)[];

const WIN_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const TicTacToeGame: React.FC = () => {
    const navigate = useNavigate();
    const onClose = () => navigate('/gamification');

    const [userMoves, setUserMoves] = useState<number[]>([]);
    const [aiMoves, setAiMoves] = useState<number[]>([]);
    const [isUserTurn, setIsUserTurn] = useState(true);
    const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

    // States animation
    const [meowlAction, setMeowlAction] = useState<MeowlAction>('think');
    const [isThinking, setIsThinking] = useState(false);
    const [meowlStyle, setMeowlStyle] = useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
    const meowlHomeRef = useRef<HTMLDivElement>(null);

    // --- SCROLL LOCK ---
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // --- LOGIC GAME ---
    const getBoard = (uMoves: number[], aMoves: number[]): BoardState => {
        const board = Array(9).fill(null);
        uMoves.forEach(m => board[m] = 'X');
        aMoves.forEach(m => board[m] = 'O');
        return board;
    };
    const board = getBoard(userMoves, aiMoves);

    const checkWin = (currentBoard: BoardState): Player | null => {
        for (const combo of WIN_COMBINATIONS) {
            const [a, b, c] = combo;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a];
            }
        }
        return null;
    };

    // --- GAME LOOP FIX ---

    // Effect Trigger chuyển lượt
    useEffect(() => {
        const win = checkWin(board);
        if (win) {
            setWinner(win);
            setMeowlAction(win === 'X' ? 'lose' : 'win');
            setIsThinking(false);
            return;
        }

        if (!isUserTurn && !winner && !isThinking) {
            setIsThinking(true);
        }
    }, [userMoves, aiMoves, isUserTurn, winner, isThinking]);

    // Logic thực thi chuỗi hành động AI
    useEffect(() => {
        if (isThinking) {
            // Giai đoạn 1: IDLE THINKING (2s để người chơi kịp nhìn thấy)
            setMeowlAction('think');

            const timer = setTimeout(() => {
                startMoveSequence();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isThinking]);

    // Hàm điều phối chuỗi hành động di chuyển
    const startMoveSequence = () => {
        // Giai đoạn 2: NHẶT QUÂN CỜ (1.3s - Đủ thời gian cho 16 frames @ 80ms)
        setMeowlAction('pickup');

        setTimeout(() => {
            executeWalkAndPlace();
        }, 1300);
    };

    const executeWalkAndPlace = () => {
        const bestMove = getBestMove(userMoves, aiMoves);

        // Tính toán tọa độ
        const targetCell = cellRefs.current[bestMove];
        const homeEl = meowlHomeRef.current;

        if (targetCell && homeEl) {
            const cellRect = targetCell.getBoundingClientRect();
            const homeRect = homeEl.getBoundingClientRect();

            // Tính offset
            // Trừ 60px Y để Meowl đứng "trên" ô cờ
            const deltaX = cellRect.left - homeRect.left + (cellRect.width / 2) - (homeRect.width / 2);
            const deltaY = cellRect.top - homeRect.top + (cellRect.height / 2) - (homeRect.height / 2) - 60;

            // Giai đoạn 3: ĐI BỘ (1s)
            setMeowlAction('walk');
            setMeowlStyle({
                // Quan trọng: CSS trong MeowlActor.css phải bỏ transition transform đi thì dòng này mới chạy mượt
                transform: `translate(${deltaX}px, ${deltaY}px)`,
                transition: 'transform 1s linear'
            });

            setTimeout(() => {
                // Giai đoạn 4: ĐẶT QUÂN
                setMeowlAction('place');

                // Chờ 900ms (cho khớp lúc tay đập xuống đất ở frame 10-12) rồi mới hiện O
                setTimeout(() => {
                    // Giai đoạn 5: LOGIC GAME UPDATE & BIẾN MẤT
                    applyAiMove(bestMove);

                    // Check win condition locally to prevent animation conflict
                    const nextAiMoves = [...aiMoves];
                    if (nextAiMoves.length >= 3) nextAiMoves.shift();
                    nextAiMoves.push(bestMove);
                    const tempBoard = getBoard(userMoves, nextAiMoves);
                    const isWin = checkWin(tempBoard);

                    if (isWin) {
                        // If AI wins, do NOT teleport back. Let the useEffect handle the win animation.
                        // Just clear thinking state so the game knows turn is over.
                        setIsThinking(false);
                        return;
                    }

                    // Teleport biến mất
                    setMeowlStyle(prev => ({
                        ...prev,
                        opacity: 0,
                        transform: `${prev.transform} scale(0) rotate(360deg)`,
                        transition: 'transform 0.5s ease-in, opacity 0.5s ease-in'
                    }));

                    setTimeout(() => {
                        // Reset vị trí về nhà (trong tàng hình)
                        // Random return action: think, smug, or panic
                        const returnActions: MeowlAction[] = ['think', 'smug', 'panic'];
                        const randomAction = returnActions[Math.floor(Math.random() * returnActions.length)];
                        setMeowlAction(randomAction);
                        
                        setMeowlStyle({
                            opacity: 0,
                            transform: 'translate(0,0) scale(0)',
                            transition: 'none'
                        });

                        // Hiện lại ở nhà
                        requestAnimationFrame(() => {
                            setMeowlStyle({
                                opacity: 1,
                                transform: 'translate(0,0) scale(1)',
                                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease-out'
                            });
                            setIsThinking(false);
                        });
                    }, 500);

                }, 900); // Tăng lên 900ms để khớp animation đập
            }, 1000); // Chờ đi bộ 1s
        } else {
            // Fallback
            applyAiMove(bestMove);
            setIsThinking(false);
        }
    };

    const handleCellClick = (index: number) => {
        if (!isUserTurn || winner || board[index]) return;

        const newMoves = [...userMoves];
        if (newMoves.length >= 3) newMoves.shift();
        newMoves.push(index);

        setUserMoves(newMoves);
        setIsUserTurn(false);
        setMeowlAction('think'); // Meowl chờ đợi
    };

    const applyAiMove = (move: number) => {
        const newAiMoves = [...aiMoves];
        if (newAiMoves.length >= 3) newAiMoves.shift();
        newAiMoves.push(move);
        setAiMoves(newAiMoves);
        setIsUserTurn(true);
    };

    // --- MINIMAX LOGIC ---
    const getBestMove = (uMoves: number[], aMoves: number[]): number => {
        const b = getBoard(uMoves, aMoves);
        const available = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !b[i]);

        // Nước đi đầu tiên random cho tự nhiên
        if (aMoves.length === 0 && available.length > 0) {
            // Ưu tiên giữa bàn cờ nếu trống
            if (!b[4]) return 4;
            return available[Math.floor(Math.random() * available.length)];
        }

        let bestScore = -Infinity;
        let move = available[0];

        for (const m of available) {
            const nextAiMoves = [...aMoves];
            if (nextAiMoves.length >= 3) nextAiMoves.shift();
            nextAiMoves.push(m);

            const score = minimax(uMoves, nextAiMoves, 0, false);
            if (score > bestScore) {
                bestScore = score;
                move = m;
            }
        }
        return move;
    };

    const minimax = (uMoves: number[], aMoves: number[], depth: number, isMaximizing: boolean): number => {
        const b = getBoard(uMoves, aMoves);
        const win = checkWin(b);
        if (win === 'O') return 10 - depth;
        if (win === 'X') return depth - 10;
        if (depth >= 2) return 0; // Giới hạn độ sâu để tránh lag (Meowl cũng phải có lúc ngu)

        const available = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !b[i]);
        if (available.length === 0) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (const m of available) {
                const nextAiMoves = [...aMoves];
                if (nextAiMoves.length >= 3) nextAiMoves.shift();
                nextAiMoves.push(m);
                const score = minimax(uMoves, nextAiMoves, depth + 1, false);
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (const m of available) {
                const nextUserMoves = [...uMoves];
                if (nextUserMoves.length >= 3) nextUserMoves.shift();
                nextUserMoves.push(m);
                const score = minimax(nextUserMoves, aMoves, depth + 1, true);
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;
        }
    };

    const resetGame = () => {
        setUserMoves([]);
        setAiMoves([]);
        setWinner(null);
        setIsUserTurn(true);
        setMeowlAction('think');
        setMeowlStyle({});
        setIsThinking(false);
    };

    return (
        <div className="ttt-modal-overlay">
            <div className="ttt-modal-content">
                <button className="ttt-close-btn" onClick={onClose}><X size={24} /></button>

                <div className="ttt-game-container" ref={containerRef}>
                    <div className="ttt-meowl-section" ref={meowlHomeRef}>
                        {/* Meowl Actor */}
                        <MeowlActor action={meowlAction} style={meowlStyle} />
                    </div>

                    <div className="ttt-board-section">
                        <div className={`ttt-status ${winner ? (winner === 'X' ? 'win' : 'lose') : ''}`}>
                            {winner ? (winner === 'X' ? 'BẠN THẮNG!' : 'MEOWL THẮNG!') : (isUserTurn ? 'LƯỢT CỦA BẠN (X)' : 'MEOWL ĐANG NGHĨ...')}
                        </div>

                        <div className="ttt-board">
                            {Array(9).fill(null).map((_, i) => {
                                // Logic Infinity: Highlight quân sắp chết
                                const isUserDying = userMoves.length === 3 && userMoves[0] === i;
                                const isAiDying = aiMoves.length === 3 && aiMoves[0] === i;

                                return (
                                    <div
                                        key={i}
                                        ref={el => cellRefs.current[i] = el}
                                        className={`ttt-cell ${board[i] ? board[i]?.toLowerCase() : ''} ${(isUserDying || isAiDying) ? 'dying' : ''} ${!isUserTurn ? 'disabled' : ''}`}
                                        onClick={() => handleCellClick(i)}
                                    >
                                        {board[i]}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="ttt-rules">Luật chơi: Tối đa 3 nước. Nước thứ 4 xóa nước đầu tiên!</div>
                        <button className="ttt-btn" onClick={resetGame}>Chơi lại</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicTacToeGame;