// Working Stockfish Worker - Fixed Implementation
let stockfish;
let isInitialized = false;

// Initialize Stockfish engine
function initializeStockfish() {
  try {
    // Import Stockfish engine - try different versions
    try {
      importScripts('./stockfish.js');
      console.log('Loaded stockfish.js');
    } catch (e) {
      try {
        importScripts('./stockfish-official.js');
        console.log('Loaded stockfish-official.js');
      } catch (e2) {
        try {
          importScripts('./stockfish-real.js');
          console.log('Loaded stockfish-real.js');
        } catch (e3) {
          throw new Error('No Stockfish engine found');
        }
      }
    }
    
    // Initialize Stockfish
    if (typeof Stockfish !== 'undefined') {
      stockfish = Stockfish();
      console.log('Stockfish instance created');
    } else if (typeof wasmThreadedStockfish !== 'undefined') {
      stockfish = wasmThreadedStockfish();
      console.log('wasmThreadedStockfish instance created');
    } else {
      throw new Error('Stockfish constructor not found');
    }
    
    // Set up message handling
    stockfish.addMessageListener(function(line) {
      console.log('Stockfish output:', line);
      
      // Send different message types to main thread
      if (line.includes('readyok')) {
        self.postMessage({ type: 'ready', data: line });
        isInitialized = true;
        console.log('Stockfish is ready!');
      } else if (line.startsWith('bestmove')) {
        self.postMessage({ type: 'bestmove', data: line });
        console.log('Best move:', line);
      } else if (line.startsWith('info')) {
        self.postMessage({ type: 'info', data: line });
      } else {
        self.postMessage({ type: 'output', data: line });
      }
    });
    
    // Initialize UCI protocol
    console.log('Initializing UCI...');
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
  
  if (!isInitialized) {
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
        
        if (message.depth) {
          stockfish.postMessage(`go depth ${message.depth}`);
        } else if (message.movetime) {
          stockfish.postMessage(`go movetime ${message.movetime}`);
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
