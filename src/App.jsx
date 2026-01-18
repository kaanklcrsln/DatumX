import { useState, useCallback } from 'react';
import { TransformationPanel, MapView, EducationalPanel } from './components';
import './App.css';

function App() {
  const [coordinate, setCoordinate] = useState(null);
  const [showEducation, setShowEducation] = useState(false);
  
  const handleCoordinateChange = useCallback((coord) => {
    setCoordinate(coord);
  }, []);
  
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <img src="/DatumX/logo.png" alt="DatumX Logo" className="logo-image" />


        </div>
        
        <nav className="header-nav">
          <button 
            className="nav-btn education-btn"
            onClick={() => setShowEducation(true)}
          >
            Education
          </button>
          <a 
            href="https://github.com/kaanklcrsln" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-btn github-btn"
          >
            GitHub
          </a>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="app-main">
        {/* Left Panel - Transformation */}
        <aside className="left-panel">
          <TransformationPanel onCoordinateChange={handleCoordinateChange} />
        </aside>
        
        {/* Right Panel - Map */}
        <section className="right-panel">
          <MapView coordinate={coordinate} />
        </section>
      </main>
      
      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span className="copyright">© 2026 DatumX - kaanklcrsln</span>
          <span className="footer-divider">|</span>
    
          <span className="disclaimer">
            Verify results for critical applications
          </span>
        </div>
      </footer>
      
      {/* Educational Panel Modal */}
      <EducationalPanel 
        isOpen={showEducation} 
        onClose={() => setShowEducation(false)} 
      />
    </div>
  );
}

export default App;
