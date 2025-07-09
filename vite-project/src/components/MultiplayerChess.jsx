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

function MultiplayerChess({ playerColor, onBackToHome }) {
  const [game, setGame] = useState(new Chess());
  const [pieces, setPieces] = useState({});
  const [status, setStatus] = useState('');
  const [moveInput, setMoveInput] = useState('');
  const [moveHistory, setMoveHistory] = useState([]);
  const [actualPlayerColor, setActualPlayerColor] = useState('white');
  
  // Initialize game stats from localStorage or default values
  const [gameStats, setGameStats] = useState(() => {
    const savedStats = localStorage.getItem('multiplayerGameStats');
    if (savedStats) {
      try {
        return JSON.parse(savedStats);
      } catch (error) {
        console.error('Error parsing saved multiplayer stats:', error);
      }
    }
    return {
      whiteWins: 0,
      blackWins: 0,
      draws: 0,
      totalGames: 0
    };
  });
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  // Determine actual player color based on selection
  useEffect(() => {
    if (playerColor === 'random') {
      setActualPlayerColor(Math.random() > 0.5 ? 'white' : 'black');
    } else {
      setActualPlayerColor(playerColor);
    }
  }, [playerColor]);

  // Convert chess.js board state to our pieces format
  const updateBoardState = (gameInstance = game) => {
    const newPieces = {};
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = String.fromCharCode('a'.charCodeAt(0) + j) + (8 - i);
        const piece = gameInstance.get(square);
        if (piece) {
          const pieceCode = (piece.color === 'w' ? 'w' : 'b') + piece.type.toUpperCase();
          newPieces[square] = pieceCode;
        }
      }
    }
    setPieces(newPieces);
    updateGameStatus(gameInstance);
  };

  // Update game status
  const updateGameStatus = (gameInstance = game) => {
    let statusText = '';
    
    if (gameInstance.isGameOver()) {
      if (gameInstance.isCheckmate()) {
        const winner = gameInstance.turn() === 'w' ? 'Black' : 'White';
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
      } else if (gameInstance.isDraw()) {
        if (gameInstance.isStalemate()) {
          statusText = '🤝 Draw by stalemate';
        } else if (gameInstance.isThreefoldRepetition()) {
          statusText = '🤝 Draw by repetition';
        } else if (gameInstance.isInsufficientMaterial()) {
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
    } else if (gameInstance.isCheck()) {
      statusText = `⚠️ ${gameInstance.turn() === 'w' ? 'White' : 'Black'} is in check`;
    } else {
      statusText = `${gameInstance.turn() === 'w' ? 'White' : 'Black'} to move`;
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

  // Drag and drop functions for bottom player only
  const handleDragStart = (e, square) => {
    const piece = pieces[square];
    const playerColorCode = actualPlayerColor === 'white' ? 'w' : 'b';
    // Only allow bottom player's pieces to be dragged when it's their turn
    if (!piece || piece[0] !== playerColorCode || game.turn() !== playerColorCode) {
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
    
    const opponentColorCode = actualPlayerColor === 'white' ? 'b' : 'w';
    // Only allow text input for opponent's moves (top player)
    if (game.turn() !== opponentColorCode) {
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

  const handleNewGameClick = () => {
    // If it's a new game (no moves made), start directly
    if (moveHistory.length === 0) {
      startNewGame();
    } else {
      // Show confirmation dialog if game is in progress
      setShowNewGameConfirm(true);
    }
  };

  const confirmNewGame = () => {
    setShowNewGameConfirm(false);
    startNewGame();
  };

  const cancelNewGame = () => {
    setShowNewGameConfirm(false);
  };

  const startNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setMoveInput('');
    updateBoardState(newGame);
  };

  useEffect(() => {
    // Initialize the board
    const newGame = new Chess();
    setGame(newGame);
    updateBoardState(newGame);
  }, []);

  // Save game stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('multiplayerGameStats', JSON.stringify(gameStats));
  }, [gameStats]);

  const resetGameStats = () => {
    const defaultStats = {
      whiteWins: 0,
      blackWins: 0,
      draws: 0,
      totalGames: 0
    };
    setGameStats(defaultStats);
    localStorage.setItem('multiplayerGameStats', JSON.stringify(defaultStats));
  };

  const renderBoard = () => {
    const squares = [];
    const boardFlipped = actualPlayerColor === 'black';
    
    // Add file labels (a-h)
    for (let i = 0; i < 8; i++) {
      const fileIndex = boardFlipped ? 7 - i : i;
      squares.push(
        <div
          key={`file-${i}`}
          className="board-label file-label"
          style={{ left: `${i * 70 + 35}px` }}
        >
          {String.fromCharCode('a'.charCodeAt(0) + fileIndex)}
        </div>
      );
    }

    // Add rank labels (1-8)
    for (let i = 0; i < 8; i++) {
      const rankNumber = boardFlipped ? i + 1 : 8 - i;
      squares.push(
        <div
          key={`rank-${i}`}
          className="board-label rank-label"
          style={{ top: `${i * 70 + 35}px` }}
        >
          {rankNumber}
        </div>
      );
    }

    // Add chess squares
    for (let i = 0; i < 64; i++) {
      const file = i % 8;
      const rank = Math.floor(i / 8);
      const light = (file + rank) % 2 === 0;
      
      // Flip the board when player is black
      const actualFile = boardFlipped ? 7 - file : file;
      const actualRank = boardFlipped ? rank + 1 : 8 - rank;
      const squareName = String.fromCharCode('a'.charCodeAt(0) + actualFile) + actualRank;
      
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
              className={`piece ${piece[0] === (actualPlayerColor === 'white' ? 'w' : 'b') && game.turn() === (actualPlayerColor === 'white' ? 'w' : 'b') ? 'draggable' : ''}`}
              draggable={piece[0] === (actualPlayerColor === 'white' ? 'w' : 'b') && game.turn() === (actualPlayerColor === 'white' ? 'w' : 'b')}
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
        <button className="new-game-button" onClick={handleNewGameClick}>
          New Game
        </button>
      </div>

      <div className="game-container">
        <div className="game-info-panel">
          <div className="game-stats">
            <div className="stats-header">
              <h3>Game Statistics</h3>
              <button 
                className="reset-stats-btn" 
                onClick={resetGameStats}
                title="Reset all game statistics"
              >
                🔄 Reset
              </button>
            </div>
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
              <div className="stat-item">
                <span className="stat-value">{gameStats.totalGames}</span>
                <span className="stat-label">Total Games</span>
              </div>
            </div>
          </div>

          <div className="move-input-section">
            <h3>
              {game.turn() === (actualPlayerColor === 'white' ? 'w' : 'b') 
                ? `${actualPlayerColor === 'white' ? 'White' : 'Black'}: Use Drag & Drop` 
                : `${actualPlayerColor === 'white' ? 'Black' : 'White'}: Enter Move`}
            </h3>
            <div className="drag-instructions">
              {game.turn() === (actualPlayerColor === 'white' ? 'w' : 'b') ? (
                <div>
                  <p>🖱️ Your turn! Drag and drop your pieces to move</p>
                  <p>Click and drag any of your pieces to see valid moves</p>
                </div>
              ) : (
                <div>
                  <p>⌨️ Opponent's turn - enter their move using text input</p>
                  <p>Use algebraic notation or from-to format</p>
                </div>
              )}
            </div>
            {game.turn() === (actualPlayerColor === 'white' ? 'b' : 'w') ? (
              <form onSubmit={handleMoveSubmit}>
                <input
                  type="text"
                  value={moveInput}
                  onChange={(e) => setMoveInput(e.target.value)}
                  placeholder="Enter opponent's move (e.g., e5, Nf6, e7-e5)"
                  className="move-input"
                  disabled={game.isGameOver()}
                />
                <button type="submit" disabled={game.isGameOver() || !moveInput.trim()}>
                  Make Move
                </button>
              </form>
            ) : (
              <div className="drag-only-message">
                <p>Use drag and drop to make your move</p>
              </div>
            )}
            
            <div className="input-help">
              <h4>Move Input Methods:</h4>
              <ul>
                <li><strong>Bottom Player:</strong> Drag & Drop only</li>
                <li><strong>Top Player:</strong> Text Input only</li>
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
            <div className="board-wrapper">
              <div className="row-labels">
                {(actualPlayerColor === 'black' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map(num => (
                  <div key={num} className="row-label">{num}</div>
                ))}
              </div>
              <div className="board">
                {renderBoard()}
              </div>
            </div>
            <div className="column-labels">
              {(actualPlayerColor === 'black' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map(letter => (
                <div key={letter} className="column-label">{letter}</div>
              ))}
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
              <strong>Mode:</strong> Hybrid (Bottom: Drag & Drop, Top: Text Input)
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

      {/* New Game Confirmation Modal */}
      {showNewGameConfirm && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-content">
              <h3>Start New Game?</h3>
              <p>Are you sure you want to start a new game? The current game will be lost.</p>
              <div className="modal-buttons">
                <button className="confirm-btn" onClick={confirmNewGame}>
                  Yes, Start New Game
                </button>
                <button className="cancel-btn" onClick={cancelNewGame}>
                  No, Continue Current Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiplayerChess;
