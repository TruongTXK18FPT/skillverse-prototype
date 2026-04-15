import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy } from 'lucide-react';
import MeowlActor, { MeowlAction } from './MeowlActor';
import './TicTacToeGame.css';

type Player = 'X' | 'O';
type BoardState = (Player | null)[];

const WIN_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

interface TicTacToeGameProps {
    onCoinsEarned?: (coins: number) => void;
    onClose?: () => void;
    mode?: 'modal' | 'embedded';
    className?: string;
}

const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ onClose, mode = 'modal', className }) => {
    const isEmbedded = mode === 'embedded';

    const handleClose = () => {
        if (onClose) {
            onClose();
            return;
        }

        if (window.history.length > 1) {
            window.history.back();
        }
    };

    // Game state
    const [userMoves, setUserMoves] = useState<number[]>([]);
    const [aiMoves, setAiMoves] = useState<number[]>([]);
    const [isUserTurn, setIsUserTurn] = useState(true);
    const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

    // States animation
    const [meowlAction, setMeowlAction] = useState<MeowlAction>('think');
    const [isThinking, setIsThinking] = useState(false);
    const [meowlStyle, setMeowlStyle] = useState<React.CSSProperties>({});

    const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
    const meowlHomeRef = useRef<HTMLDivElement>(null);

    // --- SCROLL LOCK ---
    useEffect(() => {
        if (isEmbedded) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isEmbedded]);

    // --- LOGIC GAME ---
    const getBoard = (uMoves: number[], aMoves: number[]): BoardState => {
        const board = Array(9).fill(null);
        uMoves.forEach((m) => (board[m] = 'X'));
        aMoves.forEach((m) => (board[m] = 'O'));
        return board;
    };

    const board = getBoard(userMoves, aiMoves);

    const checkWin = (currentBoard: BoardState): Player | null => {
        for (const combo of WIN_COMBINATIONS) {
            const [a, b, c] = combo;
            if (
                currentBoard[a] &&
                currentBoard[a] === currentBoard[b] &&
                currentBoard[a] === currentBoard[c]
            ) {
                return currentBoard[a];
            }
        }
        return null;
    };

    // Effect trigger chuyển lượt
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
            setMeowlAction('think');

            const timer = setTimeout(() => {
                startMoveSequence();
            }, 2000);

            return () => clearTimeout(timer);
        }

        return undefined;
    }, [isThinking]);

    // Hàm điều phối chuỗi hành động di chuyển
    const startMoveSequence = () => {
        setMeowlAction('pickup');

        setTimeout(() => {
            executeWalkAndPlace();
        }, 1300);
    };

    const executeWalkAndPlace = () => {
        const bestMove = getBestMove(userMoves, aiMoves);

        const targetCell = cellRefs.current[bestMove];
        const homeEl = meowlHomeRef.current;

        if (targetCell && homeEl) {
            const cellRect = targetCell.getBoundingClientRect();
            const homeRect = homeEl.getBoundingClientRect();

            const deltaX =
                cellRect.left -
                homeRect.left +
                cellRect.width / 2 -
                homeRect.width / 2;
            const deltaY =
                cellRect.top -
                homeRect.top +
                cellRect.height / 2 -
                homeRect.height / 2 -
                60;

            setMeowlAction('walk');
            setMeowlStyle({
                transform: `translate(${deltaX}px, ${deltaY}px)`,
                transition: 'transform 1s linear',
            });

            setTimeout(() => {
                setMeowlAction('place');

                setTimeout(() => {
                    applyAiMove(bestMove);

                    const nextAiMoves = [...aiMoves];
                    if (nextAiMoves.length >= 3) nextAiMoves.shift();
                    nextAiMoves.push(bestMove);
                    const tempBoard = getBoard(userMoves, nextAiMoves);
                    const isWin = checkWin(tempBoard);

                    if (isWin) {
                        setIsThinking(false);
                        return;
                    }

                    setMeowlStyle((prev) => ({
                        ...prev,
                        opacity: 0,
                        transform: `${prev.transform} scale(0) rotate(360deg)`,
                        transition: 'transform 0.5s ease-in, opacity 0.5s ease-in',
                    }));

                    setTimeout(() => {
                        const returnActions: MeowlAction[] = ['think', 'smug', 'panic'];
                        const randomAction =
                            returnActions[Math.floor(Math.random() * returnActions.length)];
                        setMeowlAction(randomAction);

                        setMeowlStyle({
                            opacity: 0,
                            transform: 'translate(0,0) scale(0)',
                            transition: 'none',
                        });

                        requestAnimationFrame(() => {
                            setMeowlStyle({
                                opacity: 1,
                                transform: 'translate(0,0) scale(1)',
                                transition:
                                    'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease-out',
                            });
                            setIsThinking(false);
                        });
                    }, 500);
                }, 900);
            }, 1000);
        } else {
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
        setMeowlAction('think');
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
        const available = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !b[i]);

        if (aMoves.length === 0 && available.length > 0) {
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

    const minimax = (
        uMoves: number[],
        aMoves: number[],
        depth: number,
        isMaximizing: boolean,
    ): number => {
        const b = getBoard(uMoves, aMoves);
        const win = checkWin(b);
        if (win === 'O') return 10 - depth;
        if (win === 'X') return depth - 10;
        if (depth >= 2) return 0;

        const available = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !b[i]);
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
        }

        let bestScore = Infinity;
        for (const m of available) {
            const nextUserMoves = [...uMoves];
            if (nextUserMoves.length >= 3) nextUserMoves.shift();
            nextUserMoves.push(m);
            const score = minimax(nextUserMoves, aMoves, depth + 1, true);
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
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

    const modalContentClassName = [
        'ttt-modal-content',
        isEmbedded ? 'ttt-modal-content--embedded' : '',
        className || '',
    ]
        .filter(Boolean)
        .join(' ');

    const gameContainerClassName = [
        'ttt-game-container',
        isEmbedded ? 'ttt-game-container--embedded' : '',
    ]
        .filter(Boolean)
        .join(' ');

    const gameContent = (
        <div className={modalContentClassName}>
            {!isEmbedded && (
                <button className="ttt-close-btn" onClick={handleClose}>
                    <X size={24} />
                </button>
            )}

            <div className={gameContainerClassName}>
                <div className="ttt-meowl-section" ref={meowlHomeRef}>
                    <MeowlActor
                        action={meowlAction}
                        style={meowlStyle}
                        size={isEmbedded ? 120 : 150}
                    />
                </div>

                <div className="ttt-board-section">
                    <div className={`ttt-status ${winner ? (winner === 'X' ? 'win' : 'lose') : ''}`}>
                        {winner
                            ? winner === 'X'
                                ? '🎉 BẠN THẮNG!'
                                : '😸 MEOWL THẮNG!'
                            : isUserTurn
                              ? 'LƯỢT CỦA BẠN (X)'
                              : 'MEOWL ĐANG NGHĨ...'}
                    </div>

                    {winner && (
                        <div className="ttt-result-overlay">
                            <div className="ttt-result-card">
                                <div className="ttt-result-icon">
                                    {winner === 'X' ? <Trophy size={48} /> : '😸'}
                                </div>
                                <h3 className="ttt-result-title">
                                    {winner === 'X' ? 'Chiến thắng!' : 'Meowl thắng rồi!'}
                                </h3>
                                <button className="ttt-btn ttt-play-again-btn" onClick={resetGame}>
                                    🔄 Chơi lại
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="ttt-board">
                        {Array(9)
                            .fill(null)
                            .map((_, i) => {
                                const isUserDying = userMoves.length === 3 && userMoves[0] === i;
                                const isAiDying = aiMoves.length === 3 && aiMoves[0] === i;

                                return (
                                    <div
                                        key={i}
                                        ref={(el) => {
                                            cellRefs.current[i] = el;
                                        }}
                                        className={`ttt-cell ${board[i] ? board[i]?.toLowerCase() : ''} ${(isUserDying || isAiDying) ? 'dying' : ''} ${!isUserTurn ? 'disabled' : ''}`}
                                        onClick={() => handleCellClick(i)}
                                    >
                                        {board[i]}
                                    </div>
                                );
                            })}
                    </div>
                    <div className="ttt-rules">Luật chơi: Tối đa 3 nước. Nước thứ 4 xóa nước đầu tiên!</div>

                    {!winner && (
                        <button className="ttt-btn" onClick={resetGame}>
                            Chơi lại
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (isEmbedded) {
        return <div className="ttt-embedded-wrapper">{gameContent}</div>;
    }

    return <div className="ttt-modal-overlay">{gameContent}</div>;
};

export default TicTacToeGame;
