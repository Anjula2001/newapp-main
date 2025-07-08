import { useEffect, useRef, useState } from 'react';

export const useStockfish = (difficulty = 'grandmaster') => {
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const workerRef = useRef(null);

  // Difficulty settings for real Stockfish 17
  const difficultySettings = {
    beginner: { depth: 5, eloLimit: true, eloRating: 1000, thinkTime: 500 },
    intermediate: { depth: 8, eloLimit: true, eloRating: 1400, thinkTime: 1000 },
    advanced: { depth: 12, eloLimit: true, eloRating: 1800, thinkTime: 2000 },
    master: { depth: 16, eloLimit: true, eloRating: 2200, thinkTime: 3000 },
    grandmaster: { depth: 20, eloLimit: false, eloRating: 3500, thinkTime: 5000 }
  };

  const currentSettings = difficultySettings[difficulty] || difficultySettings.grandmaster;

  useEffect(() => {
    console.log('Initializing Real Stockfish 17 engine...');
    // Initialize Real Stockfish worker
    workerRef.current = new Worker('/real-stockfish-worker.js');
    
    workerRef.current.onmessage = (event) => {
      const { type, data } = event.data;
      console.log('Main thread received:', type, data);
      
      switch (type) {
        case 'ready':
          setIsReady(true);
          console.log(`Real ${event.data.engine || 'Stockfish'} engine ready - Professional strength`);
          break;
          
        case 'bestmove':
          const moveMatch = data.match(/bestmove (\w+)/);
          if (moveMatch) {
            setBestMove(moveMatch[1]);
            setIsThinking(false);
            console.log(`Real Stockfish ${difficulty.toUpperCase()} played: ${moveMatch[1]} (depth: ${currentSettings.depth})`);
          }
          break;
          
        case 'info':
          // Parse evaluation info
          const scoreMatch = data.match(/score cp (-?\d+)/);
          const mateMatch = data.match(/score mate (-?\d+)/);
          const depthMatch = data.match(/depth (\d+)/);
          
          if (scoreMatch && depthMatch) {
            const centipawns = parseInt(scoreMatch[1]);
            const depth = parseInt(depthMatch[1]);
            setEvaluation({ 
              type: 'cp', 
              value: centipawns / 100, // Convert to pawns
              depth: depth 
            });
          } else if (mateMatch && depthMatch) {
            const mateIn = parseInt(mateMatch[1]);
            const depth = parseInt(depthMatch[1]);
            setEvaluation({ 
              type: 'mate', 
              value: mateIn,
              depth: depth 
            });
          }
          break;
          
        default:
          console.log('Unknown message type:', type);
      }
    };

    workerRef.current.onerror = (error) => {
      console.error('Stockfish worker error:', error);
      setIsReady(false);
    };

    // Initialize the worker
    workerRef.current.postMessage('init');

    // Configure difficulty when worker is ready
    const configureTimer = setTimeout(() => {
      if (workerRef.current) {
        console.log(`Configuring Stockfish for ${difficulty} level...`);
        workerRef.current.postMessage({
          type: 'configure',
          settings: {
            limitStrength: currentSettings.eloLimit,
            elo: currentSettings.eloRating
          }
        });
      }
    }, 2000);

    return () => {
      clearTimeout(configureTimer);
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [difficulty]);

  const getBestMove = (fen) => {
    if (workerRef.current && isReady) {
      setIsThinking(true);
      setBestMove(null);
      
      console.log(`Requesting move from Stockfish (${difficulty}, depth: ${currentSettings.depth})`);
      
      workerRef.current.postMessage({
        type: 'position',
        fen: fen,
        depth: currentSettings.depth,
        movetime: currentSettings.thinkTime,
        useTime: difficulty === 'beginner' // Use time limit for beginner
      });
    } else {
      console.warn('Stockfish not ready or worker not available');
    }
  };

  const stopThinking = () => {
    if (workerRef.current && isReady) {
      workerRef.current.postMessage({ type: 'stop' });
      setIsThinking(false);
    }
  };

  const resetAI = () => {
    setBestMove(null);
    setIsThinking(false);
    setEvaluation(null);
    
    // Reconfigure the engine
    if (workerRef.current && isReady) {
      workerRef.current.postMessage({
        type: 'configure',
        settings: {
          limitStrength: currentSettings.eloLimit,
          elo: currentSettings.eloRating
        }
      });
    }
  };

  const analyzePosition = (fen) => {
    if (workerRef.current && isReady) {
      workerRef.current.postMessage({
        type: 'analyze',
        fen: fen
      });
    }
  };

  return {
    isReady,
    bestMove,
    getBestMove,
    isThinking,
    evaluation,
    stopThinking,
    resetAI,
    analyzePosition,
    eloRating: currentSettings.eloRating,
    currentSettings
  };
};
