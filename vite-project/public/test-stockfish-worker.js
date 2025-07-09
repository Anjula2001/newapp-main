// Test Stockfish without SharedArrayBuffer
console.log('Test worker starting...');

try {
  // Create a simple Stockfish instance
  const stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish@10/stockfish.js');
  
  stockfish.onmessage = function(e) {
    console.log('Test Stockfish:', e.data);
    
    // Forward messages to main thread
    self.postMessage({
      type: 'stockfish-output',
      data: e.data
    });
    
    if (e.data.includes('readyok')) {
      self.postMessage({
        type: 'ready',
        data: 'Stockfish ready'
      });
    }
    
    if (e.data.startsWith('bestmove')) {
      self.postMessage({
        type: 'bestmove',
        data: e.data
      });
    }
  };
  
  stockfish.onerror = function(error) {
    console.error('Test Stockfish error:', error);
    self.postMessage({
      type: 'error',
      data: error.message
    });
  };
  
  // Listen for messages from main thread
  self.onmessage = function(e) {
    console.log('Test worker received:', e.data);
    
    if (e.data === 'init') {
      console.log('Initializing test Stockfish...');
      stockfish.postMessage('uci');
      stockfish.postMessage('isready');
    } else if (typeof e.data === 'string') {
      stockfish.postMessage(e.data);
    } else if (e.data.type === 'move') {
      stockfish.postMessage('ucinewgame');
      stockfish.postMessage(`position fen ${e.data.fen}`);
      stockfish.postMessage('go depth 5');
    }
  };
  
} catch (error) {
  console.error('Failed to create test Stockfish:', error);
  self.postMessage({
    type: 'error',
    data: 'Failed to create Stockfish: ' + error.message
  });
}
