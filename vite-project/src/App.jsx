import { useState } from 'react'
import HomePage from './components/HomePage'
import GameModeSelection from './components/GameModeSelection'
import ChessGame from './components/ChessGame'
import MultiplayerChess from './components/MultiplayerChess'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'mode-selection', 'single-player', 'multiplayer'
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');

  const handlePlayGame = (difficulty) => {
    setSelectedDifficulty(difficulty);
    setCurrentView('mode-selection');
  };

  const handleSelectMode = (mode) => {
    if (mode === 'single') {
      setCurrentView('single-player');
    } else if (mode === 'multiplayer') {
      setCurrentView('multiplayer');
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleBackToModeSelection = () => {
    setCurrentView('mode-selection');
  };

  return (
    <div className="app">
      {currentView === 'home' && (
        <HomePage onPlayGame={handlePlayGame} />
      )}
      
      {currentView === 'mode-selection' && (
        <GameModeSelection 
          selectedDifficulty={selectedDifficulty}
          onBackToHome={handleBackToHome}
          onSelectMode={handleSelectMode}
        />
      )}
      
      {currentView === 'single-player' && (
        <ChessGame 
          difficulty={selectedDifficulty} 
          onBackToHome={handleBackToModeSelection} 
        />
      )}
      
      {currentView === 'multiplayer' && (
        <MultiplayerChess 
          onBackToHome={handleBackToModeSelection}
        />
      )}
    </div>
  );
}

export default App;
