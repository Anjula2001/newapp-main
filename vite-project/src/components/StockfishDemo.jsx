import React, { useState, useEffect, useRef } from 'react';

const StockfishDemo = () => {
  const [stockfishOutput, setStockfishOutput] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [fenPosition, setFenPosition] = useState("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2");
  const [bestMove, setBestMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const stockfishRef = useRef(null);

  const addToOutput = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setStockfishOutput(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    // Initialize Stockfish worker
    try {
      // Try different Stockfish sources
      stockfishRef.current = new Worker('/working-stockfish-worker.js');
      addToOutput('📦 Loading Stockfish worker...');
    } catch (error) {
      addToOutput('❌ Failed to load worker: ' + error.message);
      return;
    }

    // Setup message listener
    stockfishRef.current.onmessage = function (e) {
      const { type, data } = e.data;
      
      switch (type) {
        case 'ready':
          setIsReady(true);
          addToOutput('✅ Stockfish is ready!');
          break;
          
        case 'bestmove':
          const moveMatch = data.match(/bestmove (\w+)/);
          if (moveMatch) {
            setBestMove(moveMatch[1]);
            setIsThinking(false);
            addToOutput(`🎯 Best move: ${moveMatch[1]}`);
          }
          break;
          
        case 'info':
          // Parse evaluation info
          const scoreMatch = data.match(/score cp (-?\d+)/);
          const depthMatch = data.match(/depth (\d+)/);
          if (scoreMatch && depthMatch) {
            const centipawns = parseInt(scoreMatch[1]);
            const depth = parseInt(depthMatch[1]);
            addToOutput(`📊 Depth ${depth}: ${(centipawns/100).toFixed(2)} pawns`);
          }
          break;
          
        case 'output':
          addToOutput('🧠 Stockfish: ' + data);
          break;
          
        case 'error':
          addToOutput('❌ Error: ' + data);
          break;
          
        default:
          addToOutput('🧠 Stockfish: ' + data);
      }
    };

    stockfishRef.current.onerror = (error) => {
      addToOutput('❌ Worker error: ' + error.message);
    };

    // Initialize the worker
    stockfishRef.current.postMessage('init');

    return () => {
      if (stockfishRef.current) {
        stockfishRef.current.terminate();
      }
    };
  }, []);

  const setPosition = () => {
    if (!isReady) {
      addToOutput('⚠️ Stockfish not ready yet!');
      return;
    }
    
    addToOutput(`🎯 Setting position: ${fenPosition}`);
    stockfishRef.current.postMessage(`position fen ${fenPosition}`);
  };

  const getBestMove = () => {
    if (!isReady) {
      addToOutput('⚠️ Stockfish not ready yet!');
      return;
    }
    
    setIsThinking(true);
    setBestMove(null);
    addToOutput('🤔 Asking Stockfish to think (depth 10)...');
    
    // Send position and request move
    stockfishRef.current.postMessage(`position fen ${fenPosition}`);
    stockfishRef.current.postMessage('go depth 10');
  };

  const clearOutput = () => {
    setStockfishOutput([]);
  };

  const sendDirectCommand = () => {
    if (!isReady) return;
    
    // Example of sending direct UCI commands like in your example
    addToOutput('📤 Sending UCI commands...');
    stockfishRef.current.postMessage('uci');
    stockfishRef.current.postMessage('isready');
    stockfishRef.current.postMessage('ucinewgame');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Stockfish Input/Output Demo (React)</h2>
      <p>This demonstrates Stockfish.js integration following your example pattern</p>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>FEN Position: </label>
          <input
            type="text"
            value={fenPosition}
            onChange={(e) => setFenPosition(e.target.value)}
            style={{ width: '400px', padding: '5px', marginLeft: '10px' }}
          />
        </div>
        
        <div>
          <button 
            onClick={setPosition}
            disabled={!isReady}
            style={{ margin: '5px', padding: '10px 15px' }}
          >
            Set Position
          </button>
          <button 
            onClick={getBestMove}
            disabled={!isReady || isThinking}
            style={{ margin: '5px', padding: '10px 15px' }}
          >
            {isThinking ? 'Thinking...' : 'Get Best Move'}
          </button>
          <button 
            onClick={sendDirectCommand}
            disabled={!isReady}
            style={{ margin: '5px', padding: '10px 15px' }}
          >
            Send UCI Commands
          </button>
          <button 
            onClick={clearOutput}
            style={{ margin: '5px', padding: '10px 15px' }}
          >
            Clear Console
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong>Status: </strong>
        <span style={{ color: isReady ? 'green' : 'red' }}>
          {isReady ? '✅ Ready' : '⏳ Loading...'}
        </span>
        {bestMove && (
          <span style={{ marginLeft: '20px' }}>
            <strong>Best Move: </strong>
            <span style={{ color: 'blue', fontFamily: 'monospace' }}>{bestMove}</span>
          </span>
        )}
      </div>

      <div 
        style={{
          background: '#1e1e1e',
          color: '#00ff00',
          padding: '20px',
          borderRadius: '5px',
          height: '400px',
          overflowY: 'auto',
          fontFamily: 'Courier New, monospace',
          fontSize: '14px'
        }}
      >
        {stockfishOutput.length === 0 ? (
          <div>🧠 Stockfish Console - Ready to start...</div>
        ) : (
          stockfishOutput.map((line, index) => (
            <div key={index}>{line}</div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>What to Expect:</h3>
        <p>After clicking "Get Best Move", you should see messages like:</p>
        <ul>
          <li>🧠 Stockfish: info depth 1 score cp 22 pv g1f3</li>
          <li>🧠 Stockfish: info depth 2 score cp 34 pv g1f3 b8c6</li>
          <li>🎯 Best move: g1f3</li>
        </ul>
      </div>
    </div>
  );
};

export default StockfishDemo;
