// Direct Stockfish Implementation - No Worker (for testing)
import { useEffect, useRef, useState } from 'react';

export const useStockfishDirect = (difficulty = 'intermediate') => {
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
    console.log('🚀 Initializing Direct Stockfish (no worker)...');
    
    const initializeStockfish = async () => {
      try {
        // Load Stockfish directly from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/stockfish@16/stockfish.min.js';
        
        script.onload = () => {
          console.log('📦 Stockfish script loaded');
          
          if (window.Stockfish && typeof window.Stockfish === 'function') {
            try {
              stockfishRef.current = window.Stockfish();
              console.log('✅ Stockfish instance created');
              
              stockfishRef.current.onmessage = (event) => {
                console.log('📨 Stockfish output:', event);
                
                if (event.includes('uciok')) {
                  console.log('✅ UCI protocol confirmed');
                  // Send isready after uciok
                  if (stockfishRef.current) {
                    stockfishRef.current.postMessage('isready');
                  }
                } else if (event.includes('readyok')) {
                  setIsReady(true);
                  console.log('✅ Stockfish fully ready!');
                } else if (event.startsWith('bestmove')) {
                  const moveMatch = event.match(/bestmove (\w+)/);
                  if (moveMatch && moveMatch[1] !== '(none)') {
                    setBestMove(moveMatch[1]);
                    setIsThinking(false);
                    console.log('🎯 Best move received:', moveMatch[1]);
                  } else {
                    console.log('⚠️ No valid move found:', event);
                    setIsThinking(false);
                  }
                }
              };
              
              // Initialize UCI
              stockfishRef.current.postMessage('uci');
              
            } catch (error) {
              console.error('❌ Failed to create Stockfish instance:', error);
            }
          } else {
            console.error('❌ Stockfish not available after script load');
          }
        };
        
        script.onerror = (error) => {
          console.error('❌ Failed to load Stockfish script:', error);
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('❌ Failed to initialize direct Stockfish:', error);
      }
    };
    
    // Only initialize if we haven't already loaded Stockfish
    if (!window.Stockfish) {
      initializeStockfish();
    } else {
      // Already loaded, just create instance
      try {
        stockfishRef.current = window.Stockfish();
        console.log('✅ Using existing Stockfish');
        stockfishRef.current.postMessage('uci');
      } catch (error) {
        console.error('❌ Error using existing Stockfish:', error);
      }
    }

    return () => {
      // No cleanup needed for direct approach
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
    workerSource: 'Direct (no worker)'
  };
};
