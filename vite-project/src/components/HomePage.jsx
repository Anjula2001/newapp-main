import { useState } from 'react';
import './HomePage.css';

function HomePage({ onPlayGame }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('intermediate');

  const difficulties = [
    { 
      id: 'beginner', 
      name: 'Beginner', 
      elo: '1000 ELO',
      description: 'Perfect for learning chess basics',
      icon: '🌱'
    },
    { 
      id: 'intermediate', 
      name: 'Intermediate', 
      elo: '1400 ELO',
      description: 'Good challenge for club players',
      icon: '⚡'
    },
    { 
      id: 'advanced', 
      name: 'Advanced', 
      elo: '1800 ELO',
      description: 'Strong amateur level',
      icon: '🔥'
    },
    { 
      id: 'master', 
      name: 'Master', 
      elo: '2200 ELO',
      description: 'Expert tournament level',
      icon: '👑'
    },
    { 
      id: 'grandmaster', 
      name: 'Grandmaster', 
      elo: '3500+ ELO',
      description: 'Professional world-class strength',
      icon: '🏆'
    }
  ];

  const handlePlayGame = () => {
    onPlayGame(selectedDifficulty);
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-section">
            <div className="chess-pieces">
              <span className="piece king">♔</span>
              <span className="piece queen">♕</span>
              <span className="piece rook">♖</span>
            </div>
            <h1 className="main-title">
              <span className="chess-text">Chess</span>
              <span className="wiz-text">Wiz</span>
            </h1>
            <p className="subtitle">Master the game of kings with Stockfish 17</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Professional Engine</h3>
              <p>Powered by Stockfish 17, the world's strongest chess engine</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Adaptive Difficulty</h3>
              <p>5 skill levels from beginner (1000 ELO) to grandmaster (3500+ ELO)</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Response</h3>
              <p>Fast, accurate moves with professional-grade analysis</p>
            </div>
          </div>

          <div className="game-setup">
            <h2>Choose Your Challenge</h2>
            <div className="difficulty-selector">
              {difficulties.map((diff) => (
                <div
                  key={diff.id}
                  className={`difficulty-card ${selectedDifficulty === diff.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDifficulty(diff.id)}
                >
                  <div className="difficulty-icon">{diff.icon}</div>
                  <div className="difficulty-info">
                    <h4>{diff.name}</h4>
                    <div className="difficulty-elo">{diff.elo}</div>
                    <p>{diff.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="play-button" onClick={handlePlayGame}>
              <span className="play-icon">▶</span>
              Start Game
            </button>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">17</div>
            <div className="stat-label">Stockfish Version</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">3500+</div>
            <div className="stat-label">Max ELO Rating</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">5</div>
            <div className="stat-label">Difficulty Levels</div>
          </div>
        </div>
      </div>

      <div className="footer">
        <p>Experience chess at its finest • No sound, pure strategy</p>
      </div>
    </div>
  );
}

export default HomePage;
