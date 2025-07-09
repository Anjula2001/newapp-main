// Robust Stockfish Implementation - CDN Only
import { useEffect, useRef, useState } from 'react';

export const useStockfishDirect = (difficulty = 'intermediate') => {
  const [isReady, setIsReady] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const stockfishRef = useRef(null);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  useEffect(() => {
    console.log('🚀 Initializing Stockfish engine...');
    
    const initializeStockfish = () => {
      try {
        console.log('📦 Creating Stockfish worker from CDN...');
        
        // Use the most reliable Stockfish version
        stockfishRef.current = new Worker('https://cdn.jsdelivr.net/npm/stockfish@11/stockfish.js');
        
        let uciOkReceived = false;
        let readyOkReceived = false;
        
        stockfishRef.current.onmessage = (event) => {
          const line = event.data;
          console.log('📨 Stockfish output:', line);
          
          if (line.includes('uciok')) {
            uciOkReceived = true;
            console.log('✅ UCI protocol confirmed');
          } else if (line.includes('readyok')) {
            readyOkReceived = true;
            if (uciOkReceived) {
              setIsReady(true);
              console.log('✅ Stockfish fully ready!');
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
            // Don't log every info line to reduce console spam
            if (line.includes('depth 1') || line.includes('pv')) {
              console.log('🧠 Stockfish thinking:', line.substring(0, 50) + '...');
            }
          }
        };
        
        stockfishRef.current.onerror = (error) => {
          console.error('❌ Stockfish worker error:', error);
          setIsReady(false);
          
          // Retry initialization if this is the first few attempts
          if (initializationAttempts < 3) {
            console.log(`🔄 Retrying Stockfish initialization (attempt ${initializationAttempts + 1})`);
            setInitializationAttempts(prev => prev + 1);
            setTimeout(() => {
              stockfishRef.current = null;
              initializeStockfish();
            }, 2000);
          }
        };
        
        // Initialize UCI protocol
        console.log('📤 Sending UCI commands...');
        stockfishRef.current.postMessage('uci');
        
        // Wait for uciok before sending isready
        setTimeout(() => {
          if (stockfishRef.current) {
            stockfishRef.current.postMessage('isready');
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Failed to create Stockfish worker:', error);
        
        if (initializationAttempts < 3) {
          console.log(`🔄 Retrying Stockfish initialization (attempt ${initializationAttempts + 1})`);
          setInitializationAttempts(prev => prev + 1);
          setTimeout(initializeStockfish, 2000);
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

  const getBestMove = (fen) => {
    console.log('🧠 getBestMove called');
    console.log('🧠 FEN:', fen);
    console.log('🧠 Stockfish ready:', isReady);
    console.log('🧠 Worker exists:', !!stockfishRef.current);
    
    if (stockfishRef.current && isReady) {
      setIsThinking(true);
      setBestMove(null);
      
      console.log('📤 Sending position to Stockfish...');
      
      try {
        // Send commands with delays to ensure they're processed in order
        stockfishRef.current.postMessage('ucinewgame');
        
        setTimeout(() => {
          if (stockfishRef.current) {
            stockfishRef.current.postMessage(`position fen ${fen}`);
            
            setTimeout(() => {
              if (stockfishRef.current) {
                const depth = getDifficultyDepth(difficulty);
                stockfishRef.current.postMessage(`go depth ${depth}`);
                console.log(`📤 Requested move at depth ${depth}`);
              }
            }, 100);
          }
        }, 100);
        
      } catch (error) {
        console.error('❌ Error sending commands to Stockfish:', error);
        setIsThinking(false);
      }
    } else {
      console.warn('⚠️ Cannot get best move:');
      console.warn('   Worker exists:', !!stockfishRef.current);
      console.warn('   Stockfish ready:', isReady);
    }
  };

  const getDifficultyDepth = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 5;
      case 'intermediate': return 8;
      case 'advanced': return 12;
      case 'master': return 15;
      case 'grandmaster': return 18;
      default: return 8;
    }
  };

  const resetAI = () => {
    setBestMove(null);
    setIsThinking(false);
    console.log('🔄 Stockfish reset');
  };

  return {
    isReady,
    bestMove,
    getBestMove,
    isThinking,
    resetAI,
    setBestMove,
    eloRating: getDifficultyElo(difficulty),
    currentSettings: { depth: getDifficultyDepth(difficulty) }
  };
};

const getDifficultyElo = (difficulty) => {
  switch (difficulty) {
    case 'beginner': return 1000;
    case 'intermediate': return 1400;
    case 'advanced': return 1800;
    case 'master': return 2200;
    case 'grandmaster': return 2600;
    default: return 1400;
  }
};
