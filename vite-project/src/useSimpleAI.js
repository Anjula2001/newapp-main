// Fallback Simple Chess AI (when Stockfish fails)
import { useEffect, useState, useCallback } from 'react';
import { Chess } from 'chess.js';

// Simple chess AI using basic evaluation
const evaluatePosition = (game) => {
  const pieces = {
    p: 1, r: 5, n: 3, b: 3, q: 9, k: 0
  };
  
  let score = 0;
  const board = game.board();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = pieces[piece.type] || 0;
        score += piece.color === 'w' ? value : -value;
      }
    }
  }
  
  return score;
};

const getRandomMove = (game) => {
  const moves = game.moves();
  return moves[Math.floor(Math.random() * moves.length)];
};

const getBestMoveSimple = (game, depth = 2) => {
  const moves = game.moves();
  if (moves.length === 0) return null;
  
  let bestMove = moves[0];
  let bestScore = -Infinity;
  
  for (const move of moves.slice(0, Math.min(moves.length, 10))) { // Limit moves for performance
    const gameCopy = new Chess(game.fen());
    gameCopy.move(move);
    
    let score = evaluatePosition(gameCopy);
    
    if (depth > 1 && moves.length < 20) { // Only go deeper if not too many moves
      const opponentMoves = gameCopy.moves().slice(0, 5); // Limit opponent moves
      let worstOpponentScore = Infinity;
      
      for (const opponentMove of opponentMoves) {
        const opponentGameCopy = new Chess(gameCopy.fen());
        opponentGameCopy.move(opponentMove);
        const opponentScore = evaluatePosition(opponentGameCopy);
        worstOpponentScore = Math.min(worstOpponentScore, opponentScore);
      }
      
      score = worstOpponentScore;
    }
    
    // Add some randomness for more natural play
    score += (Math.random() - 0.5) * 0.1;
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
};

export const useSimpleAI = (difficulty = 'intermediate') => {
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    // Simple AI is always ready
    setTimeout(() => {
      setIsReady(true);
      console.log('✅ Simple AI ready');
    }, 500);
  }, []);

  const getBestMove = useCallback((fen) => {
    console.log('🧠 Simple AI calculating move for:', fen);
    
    if (!isReady) {
      console.warn('⚠️ Simple AI not ready');
      return;
    }
    
    setIsThinking(true);
    setBestMove(null);
    
    // Simulate thinking time
    setTimeout(() => {
      try {
        const game = new Chess(fen);
        
        let move;
        const difficultySettings = {
          beginner: () => getRandomMove(game),
          intermediate: () => Math.random() > 0.3 ? getBestMoveSimple(game, 1) : getRandomMove(game),
          advanced: () => getBestMoveSimple(game, 2),
          master: () => getBestMoveSimple(game, 2),
          grandmaster: () => getBestMoveSimple(game, 2)
        };
        
        move = difficultySettings[difficulty] ? difficultySettings[difficulty]() : getBestMoveSimple(game, 1);
        
        if (move) {
          setBestMove(move);
          console.log('🎯 Simple AI move:', move);
        } else {
          console.warn('⚠️ No move found');
        }
        
        setIsThinking(false);
      } catch (error) {
        console.error('❌ Simple AI error:', error);
        setIsThinking(false);
      }
    }, 500 + Math.random() * 1500); // Random thinking time
  }, [isReady, difficulty]);

  const resetAI = () => {
    setBestMove(null);
    setIsThinking(false);
    console.log('🔄 Simple AI reset');
  };

  return {
    isReady,
    bestMove,
    getBestMove,
    isThinking,
    resetAI,
    setBestMove,
    eloRating: difficulty === 'beginner' ? 800 : difficulty === 'intermediate' ? 1200 : 1600,
    currentSettings: { depth: 2 }
  };
};
