// Ultra-simple Stockfish worker using CDN with better error handling
console.log('🔧 Simple Stockfish Worker starting...');

// Import Stockfish from CDN
importScripts('https://cdn.jsdelivr.net/npm/stockfish@16/stockfish.min.js');

console.log('📦 Stockfish script imported');

let stockfish;

// Initialize Stockfish
try {
  if (typeof Stockfish === 'function') {
    stockfish = Stockfish();
    console.log('✅ Stockfish instance created successfully');
  } else {
    console.error('❌ Stockfish is not a function');
    throw new Error('Stockfish not available');
  }
} catch (error) {
  console.error('❌ Failed to create Stockfish instance:', error);
  
  // Fallback: try different Stockfish versions
  const fallbackUrls = [
    'https://cdn.jsdelivr.net/npm/stockfish@15/stockfish.min.js',
    'https://cdn.jsdelivr.net/npm/stockfish@14/stockfish.min.js',
    'https://cdn.jsdelivr.net/npm/stockfish@11/stockfish.js'
  ];
  
  let tryFallback = (index) => {
    if (index >= fallbackUrls.length) {
      postMessage('error: All Stockfish versions failed to load');
      return;
    }
    
    try {
      importScripts(fallbackUrls[index]);
      if (typeof Stockfish === 'function') {
        stockfish = Stockfish();
        console.log(`✅ Fallback Stockfish ${index} loaded`);
      } else {
        tryFallback(index + 1);
      }
    } catch (e) {
      console.error(`❌ Fallback ${index} failed:`, e);
      tryFallback(index + 1);
    }
  };
  
  tryFallback(0);
}

// Handle messages from main thread
self.onmessage = function(e) {
  const command = e.data;
  console.log('📨 Worker received:', command);
  
  if (stockfish) {
    stockfish.postMessage(command);
  } else {
    console.error('❌ Stockfish not initialized, cannot process command:', command);
    postMessage('error: Stockfish not initialized');
  }
};

// Forward Stockfish output to main thread
if (stockfish) {
  stockfish.onmessage = function(event) {
    console.log('📤 Stockfish output:', event);
    postMessage(event);
  };
} else {
  console.error('❌ Cannot set up Stockfish message handler');
}

console.log('🚀 Simple Stockfish Worker ready');
