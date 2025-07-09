// Minimal Working Stockfish Implementation
import { useEffect, useRef, useState } from 'react';

export const useStockfishSimple = (difficulty = 'intermediate') => {
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    console.log('🚀 Initializing simple Stockfish...');
    
    // Create Stockfish worker directly
    try {
      workerRef.current = new Worker('https://cdn.jsdelivr.net/npm/stockfish@11/stockfish.js');
      
      workerRef.current.onmessage = (event) => {
        const line = event.data;
        console.log('📨 Stockfish:', line);
        
        if (line.includes('readyok')) {
          setIsReady(true);
          console.log('✅ Stockfish ready!');
        } else if (line.startsWith('bestmove')) {
          const moveMatch = line.match(/bestmove (\w+)/);
          if (moveMatch) {
            setBestMove(moveMatch[1]);
            setIsThinking(false);
            console.log('🎯 Best move:', moveMatch[1]);
          }
        }
      };
      
      workerRef.current.onerror = (error) => {
        console.error('❌ Stockfish error:', error);
      };
      
      // Initialize
      workerRef.current.postMessage('uci');
      workerRef.current.postMessage('isready');
      
    } catch (error) {
      console.error('❌ Failed to create Stockfish:', error);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const getBestMove = (fen) => {
    if (workerRef.current && isReady) {
      setIsThinking(true);
      setBestMove(null);
      
      console.log('🧠 Requesting move for:', fen);
      
      workerRef.current.postMessage('ucinewgame');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage('go depth 8');
    } else {
      console.warn('⚠️ Stockfish not ready');
    }
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
    setBestMove, // Export setBestMove for manual clearing
    eloRating: 2000,
    currentSettings: { depth: 8 }
  };
};
