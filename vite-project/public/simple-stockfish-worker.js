// Simple CDN-based Stockfish Worker
let stockfish;
let isReady = false;

console.log('Worker starting...');

// Handle messages from main thread
self.onmessage = function(e) {
  const message = e.data;
  console.log('Worker received:', message);
  
  if (message === 'init') {
    initializeStockfish();
    return;
  }
  
  if (!isReady || !stockfish) {
    console.warn('Stockfish not ready yet');
    self.postMessage({ type: 'error', data: 'Stockfish not ready' });
    return;
  }
  
  if (typeof message === 'string') {
    // Direct UCI command
    console.log('Sending to Stockfish:', message);
    stockfish.postMessage(message);
  } else if (typeof message === 'object') {
    // Structured command
    switch (message.type) {
      case 'position':
        console.log('Setting position:', message.fen);
        stockfish.postMessage('ucinewgame');
        stockfish.postMessage(`position fen ${message.fen}`);
        
        if (message.useTime && message.movetime) {
          stockfish.postMessage(`go movetime ${message.movetime}`);
        } else if (message.depth) {
          stockfish.postMessage(`go depth ${message.depth}`);
        } else {
          stockfish.postMessage('go depth 8');
        }
        break;
        
      case 'stop':
        stockfish.postMessage('stop');
        break;
        
      case 'configure':
        if (message.settings) {
          if (message.settings.limitStrength && message.settings.elo) {
            stockfish.postMessage(`setoption name UCI_LimitStrength value true`);
            stockfish.postMessage(`setoption name UCI_Elo value ${message.settings.elo}`);
          } else {
            stockfish.postMessage(`setoption name UCI_LimitStrength value false`);
          }
        }
        break;
        
      case 'analyze':
        stockfish.postMessage('ucinewgame');
        stockfish.postMessage(`position fen ${message.fen}`);
        stockfish.postMessage('go infinite');
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }
};

function initializeStockfish() {
  try {
    console.log('Creating Stockfish worker from CDN...');
    // Use latest Stockfish version that's known to work
    stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish@11/stockfish.js');
    
    stockfish.onmessage = function(e) {
      const line = e.data;
      console.log('Stockfish says:', line);
      
      // Send different message types to main thread
      if (line.includes('readyok')) {
        isReady = true;
        self.postMessage({ type: 'ready', data: line, engine: 'Stockfish 11' });
        console.log('✅ Stockfish is ready!');
      } else if (line.startsWith('bestmove')) {
        self.postMessage({ type: 'bestmove', data: line });
        console.log('📤 Best move sent:', line);
      } else if (line.startsWith('info')) {
        self.postMessage({ type: 'info', data: line });
      } else if (line.includes('uciok')) {
        console.log('✅ UCI protocol confirmed');
        self.postMessage({ type: 'output', data: line });
      } else {
        self.postMessage({ type: 'output', data: line });
      }
    };
    
    stockfish.onerror = function(error) {
      console.error('Stockfish error:', error);
      self.postMessage({ type: 'error', data: error.message });
    };
    
    // Initialize UCI protocol
    console.log('Initializing UCI protocol...');
    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
    
  } catch (error) {
    console.error('Failed to create Stockfish worker:', error);
    self.postMessage({ type: 'error', data: error.message });
  }
}
