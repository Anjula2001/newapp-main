import { useState } from 'react';
import './GameModeSelection.css';

function GameModeSelection({ selectedDifficulty, onBackToHome, onSelectMode }) {
  const [selectedMode, setSelectedMode] = useState('single');
  const [selectedColor, setSelectedColor] = useState('white');

  const gameModes = [
    {
      id: 'single',
      name: 'Single Player',
      subtitle: 'vs Stockfish 17',
      description: 'Play against the world\'s strongest chess engine with drag-and-drop moves',
      features: [
        `AI Strength: ${getDifficultyLabel(selectedDifficulty)}`,
        'Drag & Drop Interface',
        'Real-time Analysis',
        'Game Statistics'
      ],
      icon: '🤖',
      color: 'linear-gradient(45deg, #667eea, #764ba2)'
    },
    {
      id: 'multiplayer',
      name: 'Multiplayer',
      subtitle: 'Real-time Chess',
      description: 'Play with manual move input for both players using algebraic notation',
      features: [
        'Manual Move Input',
        'Algebraic Notation',
        'Two Player Local',
        'Position Analysis'
      ],
      icon: '👥',
      color: 'linear-gradient(45deg, #ff6b6b, #ffa500)'
    }
  ];

  function getDifficultyLabel(difficulty) {
    const labels = {
      'beginner': '1000 ELO',
      'intermediate': '1400 ELO', 
      'advanced': '1800 ELO',
      'master': '2200 ELO',
      'grandmaster': '3500+ ELO'
    };
    return labels[difficulty] || '1400 ELO';
  }

  const handleStartGame = () => {
    onSelectMode(selectedMode, selectedColor);
  };

  return (
    <div className="game-mode-selection">
      <div className="mode-header">
        <button className="back-button" onClick={onBackToHome}>
          ← Back to Home
        </button>
        <div className="mode-title">
          <h1>Choose Game Mode</h1>
        </div>
        <div className="spacer"></div>
      </div>

      <div className="mode-content">
        <div className="mode-selector">
          {gameModes.map((mode) => (
            <div
              key={mode.id}
              className={`mode-card ${selectedMode === mode.id ? 'selected' : ''}`}
              onClick={() => setSelectedMode(mode.id)}
            >
              <div className="mode-icon" style={{ background: mode.color }}>
                <span>{mode.icon}</span>
              </div>
              
              <div className="mode-info">
                <h3>{mode.name}</h3>
                <p className="mode-subtitle">{mode.subtitle}</p>
                <p className="mode-description">{mode.description}</p>
                
                <div className="mode-features">
                  {mode.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <span className="feature-dot">•</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mode-selector-radio">
                <div className={`radio ${selectedMode === mode.id ? 'checked' : ''}`}>
                  {selectedMode === mode.id && <div className="radio-dot"></div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="color-selection">
          <h3>Choose Your Color</h3>
          <div className="color-selector">
            <div
              className={`color-option ${selectedColor === 'white' ? 'selected' : ''}`}
              onClick={() => setSelectedColor('white')}
            >
              <div className="color-piece">♔</div>
              <div className="color-info">
                <h4>White</h4>
                <p>{selectedMode === 'single' ? 'You play as White' : 'White starts first'}</p>
              </div>
            </div>
            <div
              className={`color-option ${selectedColor === 'black' ? 'selected' : ''}`}
              onClick={() => setSelectedColor('black')}
            >
              <div className="color-piece">♚</div>
              <div className="color-info">
                <h4>Black</h4>
                <p>{selectedMode === 'single' ? 'You play as Black' : 'Black plays second'}</p>
              </div>
            </div>
            <div
              className={`color-option ${selectedColor === 'random' ? 'selected' : ''}`}
              onClick={() => setSelectedColor('random')}
            >
              <div className="color-piece">♔♚</div>
              <div className="color-info">
                <h4>Random</h4>
                <p>{selectedMode === 'single' ? 'Random color assignment' : 'Random starting player'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mode-actions">
          <button className="start-game-button" onClick={handleStartGame}>
            <span className="play-icon">▶</span>
            Start {gameModes.find(m => m.id === selectedMode)?.name}
          </button>
          
          <div className="mode-preview">
            {selectedMode === 'single' && (
              <div className="preview-info">
                <h4>🎯 Single Player Features</h4>
                <ul>
                  <li>Play against professional-strength Stockfish 17</li>
                  <li>Intuitive drag-and-drop piece movement</li>
                  <li>Real-time engine analysis and thinking display</li>
                  <li>Automatic move validation and game state tracking</li>
                </ul>
              </div>
            )}
            
            {selectedMode === 'multiplayer' && (
              <div className="preview-info">
                <h4>👥 Multiplayer Features</h4>
                <ul>
                  <li>Enter moves using standard algebraic notation (e.g., e2-e4)</li>
                  <li>Perfect for studying positions or playing with friends</li>
                  <li>Manual control over both white and black pieces</li>
                  <li>Ideal for analysis and chess education</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameModeSelection;
