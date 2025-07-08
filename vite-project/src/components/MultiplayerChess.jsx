import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import './MultiplayerChess.css'
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

function MultiplayerChess({ onBackToHome }) {
  const [game, setGame] = useState(new Chess());
  const [pieces, setPieces] = useState({});
  const [status, setStatus] = useState('');
  const [moveInput, setMoveInput] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStats, setGameStats] = useState({
    whiteWins: 0,
    blackWins: 0,
    draws: 0,
    totalGames: 0
  });
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

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
            whiteWins: prev.whiteWins + 1,
            totalGames: prev.totalGames + 1
          }));
        } else {
          setGameStats(prev => ({
            ...prev,
            blackWins: prev.blackWins + 1,
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

  const makeMove = (moveStr) => {
    try {
      // Support different move formats
      let moveAttempt;
      
      // Try standard algebraic notation first (e.g., "e4", "Nf3", "O-O")
      try {
        moveAttempt = game.move(moveStr);
      } catch {
        // Try with from-to notation (e.g., "e2-e4", "g1-f3")
        const fromToMatch = moveStr.match(/^([a-h][1-8])-([a-h][1-8])([qrbnQRBN]?)$/);
        if (fromToMatch) {
          const [, from, to, promotion] = fromToMatch;
          moveAttempt = game.move({
            from: from,
            to: to,
            promotion: promotion?.toLowerCase() || 'q'
          });
        } else {
          throw new Error('Invalid move format');
        }
      }

      if (moveAttempt) {
        const newGame = new Chess(game.fen());
        setGame(newGame);
        updateBoardState();
        
        // Add to move history
        setMoveHistory(prev => [
          ...prev,
          {
            moveNumber: Math.ceil(game.history().length / 2),
            move: moveAttempt.san,
            color: moveAttempt.color,
            from: moveAttempt.from,
            to: moveAttempt.to
          }
        ]);
        
        setMoveInput('');
        return true;
      }
    } catch (error) {
      console.log('Invalid move:', moveStr, error.message);
      return false;
    }
    return false;
  };

  // Drag and drop functions for white pieces
  const handleDragStart = (e, square) => {
    const piece = pieces[square];
    // Only allow white pieces to be dragged and only on white's turn
    if (!piece || piece[0] !== 'w' || game.turn() !== 'w') {
      e.preventDefault();
      return;
    }
    
    setDraggedPiece({ square, piece });
    // Get valid moves for this piece
    const moves = game.moves({ square, verbose: true });
    setValidMoves(moves.map(move => move.to));
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', square);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSquare) => {
    e.preventDefault();
    
    if (!draggedPiece) return;
    
    const { square: fromSquare } = draggedPiece;
    
    try {
      // Attempt the move
      const moveAttempt = game.move({
        from: fromSquare,
        to: targetSquare,
        promotion: 'q' // Default to queen for pawn promotion
      });
      
      if (moveAttempt) {
        const newGame = new Chess(game.fen());
        setGame(newGame);
        updateBoardState();
        
        // Add to move history
        setMoveHistory(prev => [
          ...prev,
          {
            moveNumber: Math.ceil(game.history().length / 2),
            move: moveAttempt.san,
            color: moveAttempt.color,
            from: moveAttempt.from,
            to: moveAttempt.to
          }
        ]);
      }
    } catch (error) {
      console.log('Invalid drag move:', error.message);
    }
    
    // Clean up drag state
    setDraggedPiece(null);
    setValidMoves([]);
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
    setValidMoves([]);
  };

  const handleMoveSubmit = (e) => {
    e.preventDefault();
    const move = moveInput.trim();
    
    // Only allow black to make moves via input
    if (game.turn() !== 'b') {
      return;
    }
    
    if (move) {
      const success = makeMove(move);
      if (!success) {
        // Show error feedback
        const inputElement = e.target.querySelector('input');
        inputElement.style.borderColor = '#ff6b6b';
        setTimeout(() => {
          inputElement.style.borderColor = '';
        }, 1000);
      }
    }
  };

  const startNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setMoveInput('');
    updateBoardState();
  };

  useEffect(() => {
    // Initialize the board
    const newGame = new Chess();
    setGame(newGame);
    updateBoardState();
  }, []);

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
      const isValidMove = validMoves.includes(squareName);
      const isDraggedFrom = draggedPiece?.square === squareName;
      
      squares.push(
        <div 
          key={i}
          className={`square ${light ? 'light' : 'dark'} ${isInCheck ? 'check' : ''} ${isValidMove ? 'valid-move' : ''} ${isDraggedFrom ? 'dragged-from' : ''}`}
          data-square={squareName}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, squareName)}
        >
          {piece && (
            <div 
              className={`piece ${piece[0] === 'w' && game.turn() === 'w' ? 'draggable' : ''}`}
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

  const recentMoves = moveHistory.slice(-8);

  return (
    <div className="multiplayer-chess">
      <div className="game-header">
        <button className="back-button" onClick={onBackToHome}>
          ← Back to Home
        </button>
        <div className="game-title">
          <h1><span className="chess">Chess</span><span className="wiz">Wiz</span> <span className="mode">Hybrid Mode</span></h1>
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
                <span className="stat-value">{gameStats.whiteWins}</span>
                <span className="stat-label">White Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{gameStats.blackWins}</span>
                <span className="stat-label">Black Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{gameStats.draws}</span>
                <span className="stat-label">Draws</span>
              </div>
            </div>
          </div>

          <div className="move-input-section">
            <h3>
              {game.turn() === 'w' ? 'White: Use Drag & Drop' : 'Black: Enter Move'}
            </h3>
            {game.turn() === 'w' ? (
              <div className="drag-instructions">
                <p>🖱️ Drag and drop white pieces to make your move</p>
                <p>Click and drag any white piece to see valid moves</p>
              </div>
            ) : (
              <form onSubmit={handleMoveSubmit}>
                <input
                  type="text"
                  value={moveInput}
                  onChange={(e) => setMoveInput(e.target.value)}
                  placeholder="e.g., e5, Nf6, e7-e5"
                  className="move-input"
                  disabled={game.isGameOver()}
                />
                <button type="submit" disabled={game.isGameOver() || !moveInput.trim()}>
                  Make Move
                </button>
              </form>
            )}
            
            <div className="input-help">
              <h4>Move Formats (Black only):</h4>
              <ul>
                <li><strong>Standard:</strong> e5, Nf6, Qxd4</li>
                <li><strong>From-To:</strong> e7-e5, g8-f6</li>
                <li><strong>Castling:</strong> O-O, O-O-O</li>
                <li><strong>Promotion:</strong> e1=Q, a2-b1Q</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="board-section">
          <div className="board-container">
            <div className="board">
              {renderBoard()}
            </div>
            <div className="game-status">{status}</div>
          </div>
        </div>

        <div className="move-history-panel">
          <div className="move-history">
            <h3>Recent Moves</h3>
            <div className="moves-list">
              {recentMoves.length === 0 ? (
                <div className="no-moves">No moves yet</div>
              ) : (
                recentMoves.map((move, index) => (
                  <div key={index} className={`move-item ${move.color}`}>
                    <span className="move-number">
                      {move.color === 'w' ? `${move.moveNumber}.` : ''}
                    </span>
                    <span className="move-notation">{move.move}</span>
                    <span className="move-squares">{move.from}-{move.to}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="game-info">
            <h3>Game Info</h3>
            <div className="current-position">
              <strong>Turn:</strong> {game.turn() === 'w' ? 'White' : 'Black'}
            </div>
            <div className="move-count">
              <strong>Move:</strong> {Math.ceil(game.history().length / 2) || 1}
            </div>
            <div className="game-mode">
              <strong>Mode:</strong> Hybrid (White: Drag & Drop, Black: Input)
            </div>
            <div className="fen-position">
              <strong>FEN:</strong> 
              <input 
                type="text" 
                value={game.fen()} 
                readOnly 
                className="fen-input"
                title="Current position in FEN notation"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiplayerChess;
