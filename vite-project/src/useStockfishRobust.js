// Most Robust Stockfish Implementation - Local + CDN Fallback
import { useEffect, useRef, useState } from 'react';

export const useStockfishRobust = (difficulty = 'intermediate') => {
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [workerSource, setWorkerSource] = useState('');
  const stockfishRef = useRef(null);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

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
    console.log('🚀 Initializing Robust Stockfish engine...');
    
    const workerSources = [
      // Try local files first
      '/ultra-simple-stockfish-worker.js',
      '/working-stockfish-worker.js',
      '/simple-stockfish-worker.js',
      '/stockfish-real.worker.js',
      '/stockfish.worker.js',
      // Fallback to CDN
      'https://cdn.jsdelivr.net/npm/stockfish@16/stockfish.min.js',
      'https://cdn.jsdelivr.net/npm/stockfish@15/stockfish.min.js',
      'https://cdn.jsdelivr.net/npm/stockfish@14/stockfish.min.js',
      'https://cdn.jsdelivr.net/npm/stockfish@11/stockfish.js'
    ];
    
    const initializeStockfish = async (sourceIndex = 0) => {
      if (sourceIndex >= workerSources.length) {
        console.error('❌ All Stockfish sources failed');
        return;
      }

      const source = workerSources[sourceIndex];
      console.log(`📦 Trying Stockfish worker source ${sourceIndex + 1}/${workerSources.length}: ${source}`);
      setWorkerSource(source);
      
      try {
        stockfishRef.current = new Worker(source);
        
        let uciOkReceived = false;
        let readyOkReceived = false;
        let hasReceivedAnyMessage = false;
        
        // Set a timeout to detect if worker is non-responsive
        const timeoutId = setTimeout(() => {
          if (!hasReceivedAnyMessage) {
            console.log(`⏰ Worker timeout for ${source}, trying next source...`);
            if (stockfishRef.current) {
              stockfishRef.current.terminate();
            }
            initializeStockfish(sourceIndex + 1);
          }
        }, 5000);
        
        stockfishRef.current.onmessage = (event) => {
          hasReceivedAnyMessage = true;
          clearTimeout(timeoutId);
          
          const line = event.data;
          console.log('📨 Stockfish output:', line);
          
          if (line.includes('uciok')) {
            uciOkReceived = true;
            console.log('✅ UCI protocol confirmed');
            // Send isready after receiving uciok
            if (stockfishRef.current) {
              stockfishRef.current.postMessage('isready');
            }
          } else if (line.includes('readyok')) {
            readyOkReceived = true;
            if (uciOkReceived) {
              setIsReady(true);
              console.log(`✅ Stockfish fully ready using source: ${source}`);
            }
          } else if (line.startsWith('bestmove')) {
            const moveMatch = line.match(/bestmove (\w+)/);
            if (moveMatch && moveMatch[1] !== '(none)') {
              setBestMove(moveMatch[1]);
              setIsThinking(false);
              console.log('🎯 Best move received:', moveMatch[1]);
            } else {
              console.log('⚠️ No valid move found:', line);
              setIsThinking(false);
            }
          } else if (line.includes('info depth')) {
            // Minimal logging for search info
            if (line.includes('depth 1') || line.includes('pv')) {
              console.log('🧠 Thinking...');
            }
          }
        };
        
        stockfishRef.current.onerror = (error) => {
          console.error(`❌ Stockfish worker error with ${source}:`, error);
          clearTimeout(timeoutId);
          
          // Try next source
          if (sourceIndex + 1 < workerSources.length) {
            console.log(`🔄 Trying next source...`);
            initializeStockfish(sourceIndex + 1);
          } else {
            console.error('❌ All sources failed');
          }
        };
        
        // Initialize UCI protocol
        console.log('📤 Sending UCI command...');
        stockfishRef.current.postMessage('uci');
        
      } catch (error) {
        console.error(`❌ Failed to create worker with ${source}:`, error);
        clearTimeout(timeoutId);
        
        // Try next source
        if (sourceIndex + 1 < workerSources.length) {
          console.log(`🔄 Trying next source...`);
          initializeStockfish(sourceIndex + 1);
        }
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
    workerSource
  };
};
