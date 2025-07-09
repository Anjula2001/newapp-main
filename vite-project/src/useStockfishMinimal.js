// Minimal Stockfish Hook - Based on Working Test
import { useEffect, useRef, useState } from 'react';

export const useStockfishMinimal = (difficulty = 'intermediate') => {
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const stockfishRef = useRef(null);

  // Simple difficulty settings
  const difficultySettings = {
    beginner: { depth: 3 },
    easy: { depth: 5 },
    intermediate: { depth: 8 },
    hard: { depth: 12 },
    expert: { depth: 15 }
  };

  const currentSettings = difficultySettings[difficulty] || difficultySettings.intermediate;
  const eloRating = 1600; // Fixed rating for simplicity

  useEffect(() => {
    console.log('🚀 Initializing MINIMAL Stockfish...');
    
    // Create worker with inline worker code
    const workerCode = `
      console.log('Worker starting...');
      importScripts('https://cdn.jsdelivr.net/npm/stockfish@16/stockfish.min.js');
      
      let stockfish;
      try {
        stockfish = Stockfish();
        console.log('Stockfish created');
      } catch (e) {
        console.error('Failed to create Stockfish:', e);
      }
      
      self.onmessage = function(e) {
        console.log('Worker received:', e.data);
        if (stockfish) {
          stockfish.postMessage(e.data);
        }
      };
      
      if (stockfish) {
        stockfish.onmessage = function(event) {
          console.log('Stockfish says:', event);
          self.postMessage(event);
        };
      }
    `;
    
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      stockfishRef.current = new Worker(workerUrl);
      
      console.log('✅ Worker created with inline code');
      
      stockfishRef.current.onmessage = (event) => {
        const line = event.data;
        console.log('📨 From worker:', line);
        
        if (typeof line === 'string') {
          if (line.includes('uciok')) {
            console.log('✅ UCI OK received');
            stockfishRef.current.postMessage('isready');
          } else if (line.includes('readyok')) {
            setIsReady(true);
            console.log('✅ Stockfish ready!');
          } else if (line.startsWith('bestmove')) {
            const moveMatch = line.match(/bestmove (\w+)/);
            if (moveMatch && moveMatch[1] !== '(none)') {
              setBestMove(moveMatch[1]);
              setIsThinking(false);
              console.log('🎯 Best move:', moveMatch[1]);
            } else {
              setIsThinking(false);
            }
          }
        }
      };
      
      stockfishRef.current.onerror = (error) => {
        console.error('❌ Worker error:', error);
      };
      
      // Start UCI
      setTimeout(() => {
        if (stockfishRef.current) {
          console.log('📤 Sending UCI...');
          stockfishRef.current.postMessage('uci');
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to create minimal worker:', error);
    }

    return () => {
      if (stockfishRef.current) {
        stockfishRef.current.terminate();
      }
    };
  }, []);

  const getBestMove = (fenPosition) => {
    if (!stockfishRef.current || !isReady) {
      console.warn('⚠️ Stockfish not ready');
      return;
    }

    console.log('🎯 Getting best move...');
    setIsThinking(true);
    setBestMove(null);

    try {
      stockfishRef.current.postMessage('ucinewgame');
      stockfishRef.current.postMessage(`position fen ${fenPosition}`);
      stockfishRef.current.postMessage(`go depth ${currentSettings.depth}`);
    } catch (error) {
      console.error('❌ Error getting move:', error);
      setIsThinking(false);
    }
  };

  const resetAI = () => {
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
    workerSource: 'Inline Worker'
  };
};
