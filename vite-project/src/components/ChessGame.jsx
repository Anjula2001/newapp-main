import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { useStockfish } from '../useStockfish'
import './ChessGame.css'
import wP from '../images/wP.png'
import wR from '../images/wR.png'
import wN from '../images/wN.png'
import wB from '../images/wB.png'
import wQ from '../images/wQ.png'
import wK from '../images/wK.png'
import bP from '../images/bP.png'
import bR from '../images/bR.png'
import bN from '../images/bN.png'
import bB from '../images/bB.png'
import bQ from '../images/bQ.png'
import bK from '../images/bK.png'

// Create a mapping of piece codes to images
const pieceImages = {
  wp: wP, wr: wR, wn: wN, wb: wB, wq: wQ, wk: wK,
  bp: bP, br: bR, bn: bN, bb: bB, bq: bQ, bk: bK,
};

function ChessGame({ difficulty, onBackToHome }) {
  const [game, setGame] = useState(new Chess());
  const [pieces, setPieces] = useState({});
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [lastMoveFrom, setLastMoveFrom] = useState(null);
  const [lastMoveTo, setLastMoveTo] = useState(null);
  const [status, setStatus] = useState('');
  const [gameStats, setGameStats] = useState({
    playerWins: 0,
    aiWins: 0,
    draws: 0,
    totalGames: 0
  });

  const { isReady, bestMove, getBestMove, isThinking, eloRating, currentSettings, resetAI } = useStockfish(difficulty);

  // Convert chess.js board state to our pieces format
  const updateBoardState = () => {
    const newPieces = {};
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = String.fromCharCode('a'.charCodeAt(0) + j) + (8 - i);
        const piece = game.get(square);
        if (piece) {
          const pieceCode = (piece.color === 'w' ? 'w' : 'b') + piece.type.toUpperCase();
          newPieces[square] = pieceCode;
        }
      }
    }
    setPieces(newPieces);
    updateGameStatus();
  };

  // Update game status
  const updateGameStatus = () => {
    let statusText = '';
    
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        statusText = `🎉 Checkmate! ${winner} wins!`;
        
        // Update stats
        if (winner === 'White') {
          setGameStats(prev => ({
            ...prev,
            playerWins: prev.playerWins + 1,
            totalGames: prev.totalGames + 1
          }));
        } else {
          setGameStats(prev => ({
            ...prev,
            aiWins: prev.aiWins + 1,
            totalGames: prev.totalGames + 1
          }));
        }
      } else if (game.isDraw()) {
        if (game.isStalemate()) {
          statusText = '🤝 Draw by stalemate';
        } else if (game.isThreefoldRepetition()) {
          statusText = '🤝 Draw by repetition';
        } else if (game.isInsufficientMaterial()) {
          statusText = '🤝 Draw by insufficient material';
        } else {
          statusText = '🤝 Draw';
        }
        setGameStats(prev => ({
          ...prev,
          draws: prev.draws + 1,
          totalGames: prev.totalGames + 1
        }));
      }
    } else if (game.isCheck()) {
      statusText = `⚠️ ${game.turn() === 'w' ? 'White' : 'Black'} is in check`;
    } else {
      statusText = `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
    }
    
    setStatus(statusText);
  };

  const handleDragStart = (e, square) => {
    const piece = pieces[square];
    // Only allow dragging of white pieces on white's turn
    if (piece && piece[0] === 'w' && game.turn() === 'w') {
      setDraggedPiece(piece);
      setDraggedFrom(square);
      e.dataTransfer.setData('text/plain', square);
      e.target.style.opacity = '0.5';
    } else {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toSquare) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData('text/plain');
    if (fromSquare && pieces[fromSquare] && pieces[fromSquare][0] === 'w' && game.turn() === 'w') {
      makeMove(fromSquare, toSquare);
    }
    setDraggedPiece(null);
    setDraggedFrom(null);
  };

  const makeMove = (from, to) => {
    try {
      const move = game.move({
        from: from,
        to: to,
        promotion: 'q' // Always promote to queen for simplicity
      });

      if (move) {
        setLastMoveFrom(from);
        setLastMoveTo(to);
        const newGame = new Chess(game.fen());
        setGame(newGame);
        updateBoardState();

        // Trigger AI move after player's move
        if (game.turn() === 'b' && !game.isGameOver() && isReady) {
          setTimeout(() => {
            getBestMove(game.fen());
          }, 300);
        }
      }
    } catch (error) {
      console.log('Invalid move!');
    }
  };

  // Handle AI move
  useEffect(() => {
    if (bestMove && game.turn() === 'b' && !game.isGameOver()) {
      try {
        const move = game.move(bestMove);
        if (move) {
          setLastMoveFrom(move.from);
          setLastMoveTo(move.to);
          const newGame = new Chess(game.fen());
          setGame(newGame);
          updateBoardState();
        }
      } catch (error) {
        console.error('Invalid AI move:', bestMove);
      }
    }
  }, [bestMove]);

  // Initialize AI when ready
  useEffect(() => {
    if (isReady) {
      console.log(`Stockfish ${difficulty} ready with ${eloRating} ELO`);
    }
  }, [isReady, difficulty, eloRating]);

  useEffect(() => {
    // Initialize the board
    const newGame = new Chess();
    setGame(newGame);
    updateBoardState();
  }, []);

  const startNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setLastMoveFrom(null);
    setLastMoveTo(null);
    updateBoardState();
    resetAI();
  };

  const renderBoard = () => {
    const squares = [];
    
    // Add file labels (a-h)
    for (let i = 0; i < 8; i++) {
      squares.push(
        <div
          key={`file-${i}`}
          className="board-label file-label"
          style={{ left: `${i * 70 + 35}px` }}
        >
          {String.fromCharCode('a'.charCodeAt(0) + i)}
        </div>
      );
    }

    // Add rank labels (1-8)
    for (let i = 0; i < 8; i++) {
      squares.push(
        <div
          key={`rank-${i}`}
          className="board-label rank-label"
          style={{ top: `${i * 70 + 35}px` }}
        >
          {8 - i}
        </div>
      );
    }

    // Add chess squares
    for (let i = 0; i < 64; i++) {
      const file = i % 8;
      const rank = Math.floor(i / 8);
      const light = (file + rank) % 2 === 0;
      const squareName = String.fromCharCode('a'.charCodeAt(0) + file) + (8 - rank);
      const piece = pieces[squareName];
      const isInCheck = game.isCheck() && piece?.toLowerCase().endsWith('k') && piece[0] === game.turn();
      
      squares.push(
        <div 
          key={i}
          className={`square ${light ? 'light' : 'dark'} ${
            squareName === lastMoveFrom || squareName === lastMoveTo ? 'highlighted' : ''
          } ${isInCheck ? 'check' : ''}`}
          data-index={i}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, squareName)}
        >
          {piece && (
            <div 
              className="piece"
              draggable={piece[0] === 'w' && game.turn() === 'w'}
              onDragStart={(e) => handleDragStart(e, squareName)}
              onDragEnd={handleDragEnd}
            >
              <img src={pieceImages[piece.toLowerCase()]} alt={piece} />
            </div>
          )}
        </div>
      );
    }
    return squares;
  };

  return (
    <div className="chess-game">
      <div className="game-header">
        <button className="back-button" onClick={onBackToHome}>
          ← Back to Home
        </button>
        <div className="game-title">
          <h1><span className="chess">Chess</span><span className="wiz">Wiz</span></h1>
        </div>
        <button className="new-game-button" onClick={startNewGame}>
          New Game
        </button>
      </div>

      <div className="game-container">
        <div className="game-info-panel">
          <div className="game-stats">
            <h3>Game Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{gameStats.playerWins}</span>
                <span className="stat-label">Your Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{gameStats.aiWins}</span>
                <span className="stat-label">AI Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{gameStats.draws}</span>
                <span className="stat-label">Draws</span>
              </div>
            </div>
          </div>

          {/* Enhanced Engine Status */}
          <div className="engine-info">
            {!isReady && <div className="engine-status loading">Loading Real Stockfish 17...</div>}
            {isReady && !isThinking && (
              <div className="engine-status ready">
                Stockfish 17 Ready • {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} • {eloRating} ELO
              </div>
            )}
            {isThinking && (
              <div className="engine-status thinking">
                Stockfish 17 Calculating... • Depth {currentSettings?.depth || 6} • {eloRating} ELO
              </div>
            )}
          </div>
        </div>

        <div className="board-section">
          <div className="board-container">
            <div className="board" id="board">
              {renderBoard()}
            </div>
            <div className="game-status">{status}</div>
          </div>
        </div>

        <div className="move-info-panel">
          <div className="move-history">
            <h3>Game Info</h3>
            <div className="current-position">
              <strong>Turn:</strong> {game.turn() === 'w' ? 'White (You)' : 'Black (AI)'}
            </div>
            <div className="move-count">
              <strong>Move:</strong> {Math.ceil(game.history().length / 2)}
            </div>
            <div className="difficulty-info">
              <strong>Difficulty:</strong> {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </div>
            <div className="elo-info">
              <strong>AI Strength:</strong> {eloRating} ELO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChessGame;
