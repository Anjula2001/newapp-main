// Basic Stockfish Hook - Minimal Implementation
import { useEffect, useRef, useState } from 'react';

export const useStockfishBasic = (difficulty = 'intermediate') => {
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const stockfishRef = useRef(null);

  useEffect(() => {
    console.log('🚀 Creating basic Stockfish worker...');
    
    const createStockfish = () => {
      try {
        // Use the most basic approach
        stockfishRef.current = new Worker('https://cdn.jsdelivr.net/npm/stockfish@11/stockfish.js');
        console.log('✅ Worker created successfully');
        
        stockfishRef.current.onmessage = function(event) {
          const message = event.data;
          console.log('📨 Stockfish message:', message);
          
          if (message.includes('readyok')) {
            console.log('🎉 Stockfish is ready!');
            setIsReady(true);
          }
          
          if (message.startsWith('bestmove')) {
            console.log('🎯 Got best move:', message);
            const parts = message.split(' ');
            if (parts[1] && parts[1] !== '(none)') {
              setBestMove(parts[1]);
              setIsThinking(false);
            }
          }
        };
        
        stockfishRef.current.onerror = function(error) {
          console.error('❌ Stockfish error:', error);
        };
        
        // Send initialization commands immediately
        console.log('📤 Sending uci...');
        stockfishRef.current.postMessage('uci');
        
        console.log('📤 Sending isready...');
        stockfishRef.current.postMessage('isready');
        
      } catch (error) {
        console.error('❌ Failed to create Stockfish:', error);
      }
    };
    
    createStockfish();

    return () => {
      if (stockfishRef.current) {
        stockfishRef.current.terminate();
      }
    };
  }, []);

  const getBestMove = (fen) => {
    console.log('🧠 Getting best move for:', fen);
    
    if (!stockfishRef.current) {
      console.error('❌ No Stockfish worker');
      return;
    }
    
    if (!isReady) {
      console.error('❌ Stockfish not ready');
      return;
    }
    
    setIsThinking(true);
    setBestMove(null);
    
    // Send commands
    stockfishRef.current.postMessage('ucinewgame');
    stockfishRef.current.postMessage(`position fen ${fen}`);
    stockfishRef.current.postMessage('go depth 8');
  };

  const resetAI = () => {
    setBestMove(null);
    setIsThinking(false);
  };

  return {
    isReady,
    bestMove,
    getBestMove,
    isThinking,
    resetAI,
    setBestMove,
    eloRating: 1400,
    currentSettings: { depth: 8 }
  };
};
