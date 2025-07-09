// Stockfish Hook using the Working Worker
import { useEffect, useRef, useState } from 'react';

export const useStockfishWorking = (difficulty = 'intermediate') => {
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const stockfishRef = useRef(null);

  // Difficulty settings
  const difficultySettings = {
    beginner: { depth: 3, time: 1000, elo: 800 },
    easy: { depth: 5, time: 2000, elo: 1200 },
    intermediate: { depth: 8, time: 3000, elo: 1600 },
    hard: { depth: 12, time: 5000, elo: 2000 },
    expert: { depth: 15, time: 8000, elo: 2400 }
  };

  const currentSettings = difficultySettings[difficulty] || difficultySettings.intermediate;
  const eloRating = currentSettings.elo;

  useEffect(() => {
    console.log('🚀 Initializing Stockfish with working worker...');
    
    const initializeStockfish = () => {
      try {
        console.log('📦 Creating worker from working-stockfish-worker.js...');
        stockfishRef.current = new Worker('/working-stockfish-worker.js');
        
        stockfishRef.current.onmessage = (event) => {
          const message = event.data;
          console.log('📨 Worker message:', message);
          
          // Handle different message types from the working worker
          if (message.type === 'ready' || (typeof message === 'string' && message.includes('readyok'))) {
            setIsReady(true);
            console.log('✅ Stockfish ready!');
          } else if (message.type === 'bestmove' || (typeof message === 'string' && message.startsWith('bestmove'))) {
            const line = message.data || message;
            const moveMatch = line.match(/bestmove (\w+)/);
            if (moveMatch && moveMatch[1] !== '(none)') {
              setBestMove(moveMatch[1]);
              setIsThinking(false);
              console.log('🎯 Best move received:', moveMatch[1]);
            } else {
              console.log('⚠️ No valid move found:', line);
              setIsThinking(false);
            }
          } else if (message.type === 'info' || (typeof message === 'string' && message.includes('info depth'))) {
            // Thinking info
            console.log('🧠 Stockfish thinking...');
          } else if (typeof message === 'string') {
            // Handle direct string messages
            if (message.includes('uciok')) {
              console.log('✅ UCI protocol confirmed');
              // Send isready after uciok
              if (stockfishRef.current) {
                stockfishRef.current.postMessage('isready');
              }
            } else if (message.includes('readyok')) {
              setIsReady(true);
              console.log('✅ Stockfish ready!');
            } else if (message.startsWith('bestmove')) {
              const moveMatch = message.match(/bestmove (\w+)/);
              if (moveMatch && moveMatch[1] !== '(none)') {
                setBestMove(moveMatch[1]);
                setIsThinking(false);
                console.log('🎯 Best move received:', moveMatch[1]);
              } else {
                console.log('⚠️ No valid move found:', message);
                setIsThinking(false);
              }
            }
          }
        };
        
        stockfishRef.current.onerror = (error) => {
          console.error('❌ Stockfish worker error:', error);
          setIsReady(false);
        };
        
        // Initialize UCI protocol
        console.log('📤 Sending UCI command...');
        stockfishRef.current.postMessage('uci');
        
      } catch (error) {
        console.error('❌ Failed to create Stockfish worker:', error);
      }
    };
    
    initializeStockfish();

    return () => {
      if (stockfishRef.current) {
        console.log('🔄 Terminating Stockfish worker');
        stockfishRef.current.terminate();
      }
    };
  }, []);

  const getBestMove = (fenPosition, moves = []) => {
    if (!stockfishRef.current || !isReady) {
      console.warn('⚠️ Stockfish not ready, cannot get best move');
      return;
    }

    console.log('🎯 Requesting best move for position:', fenPosition);
    setIsThinking(true);
    setBestMove(null);

    try {
      // Set up position
      stockfishRef.current.postMessage('ucinewgame');
      
      if (moves.length > 0) {
        stockfishRef.current.postMessage(`position startpos moves ${moves.join(' ')}`);
      } else {
        stockfishRef.current.postMessage(`position fen ${fenPosition}`);
      }
      
      // Configure difficulty
      stockfishRef.current.postMessage(`setoption name Skill Level value ${Math.min(20, Math.max(0, Math.floor(currentSettings.elo / 120)))}`);
      
      // Search for best move
      stockfishRef.current.postMessage(`go depth ${currentSettings.depth} movetime ${currentSettings.time}`);
    } catch (error) {
      console.error('❌ Error getting best move:', error);
      setIsThinking(false);
    }
  };

  const resetAI = () => {
    if (stockfishRef.current && isReady) {
      console.log('🔄 Resetting Stockfish');
      stockfishRef.current.postMessage('ucinewgame');
    }
    setBestMove(null);
    setIsThinking(false);
  };

  return {
    isReady,
    bestMove,
    setBestMove,
    getBestMove,
    isThinking,
    eloRating,
    currentSettings,
    resetAI,
    workerSource: '/working-stockfish-worker.js'
  };
};
