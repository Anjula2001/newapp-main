// Real Stockfish Worker - CDN Implementation
let stockfish;
let isInitialized = false;

// Initialize Stockfish engine from CDN or local files
function initializeStockfish() {
  try {
    // Try local Stockfish first
    try {
      stockfish = new Worker('./stockfish.js');
      console.log('Using local Stockfish');
    } catch (localError) {
      // Fallback to CDN
      console.log('Local Stockfish not found, using CDN');
      stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish@11/stockfish.js');
    }
    
    // Set up message handling from Stockfish
    stockfish.onmessage = function(e) {
      const line = e.data;
      console.log('Stockfish output:', line);
      
      // Send different message types to main thread
      if (line.includes('readyok')) {
        self.postMessage({ type: 'ready', data: line, engine: 'Stockfish 17' });
        isInitialized = true;
      } else if (line.startsWith('bestmove')) {
        self.postMessage({ type: 'bestmove', data: line });
      } else if (line.startsWith('info')) {
        self.postMessage({ type: 'info', data: line });
      } else {
        self.postMessage({ type: 'output', data: line });
      }
    };
    
    stockfish.onerror = function(error) {
      console.error('Stockfish worker error:', error);
      self.postMessage({ type: 'error', data: error.message });
    };
    
    // Initialize UCI protocol
    stockfish.postMessage('uci');
    stockfish.postMessage('isready');
    
  } catch (error) {
    console.error('Failed to initialize Stockfish:', error);
    self.postMessage({ type: 'error', data: error.message });
  }
}

// Handle messages from main thread
self.onmessage = function(e) {
  const message = e.data;
  
  if (message === 'init') {
    initializeStockfish();
    return;
  }
  
  if (!isInitialized || !stockfish) {
    console.warn('Stockfish not initialized yet');
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
        stockfish.postMessage('ucinewgame');
        stockfish.postMessage(`position fen ${message.fen}`);
        
        if (message.useTime && message.movetime) {
          stockfish.postMessage(`go movetime ${message.movetime}`);
        } else if (message.depth) {
          stockfish.postMessage(`go depth ${message.depth}`);
        } else {
          stockfish.postMessage('go depth 10');
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
