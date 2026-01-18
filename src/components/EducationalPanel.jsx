import { useState } from 'react';
import { EDUCATIONAL_CONTENT, getAllTopics } from '../utils/education';
import './EducationalPanel.css';

function EducationalPanel({ isOpen, onClose }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [expandedSection, setExpandedSection] = useState('coordinateSystems');
  
  const topics = getAllTopics();
  
  const getContent = (topicKey) => {
    const keys = topicKey.split('.');
    let content = EDUCATIONAL_CONTENT;
    
    for (const key of keys) {
      content = content[key];
    }
    
    return content;
  };
  
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const renderContent = (content) => {
    if (!content) return null;
    
    return (
      <div className="content-display">
        {content.shortDescription && (
          <p className="short-desc">{content.shortDescription}</p>
        )}
        
        {content.fullDescription && (
          <div className="full-desc">
            <h4>Description</h4>
            <pre>{content.fullDescription}</pre>
          </div>
        )}
        
        {content.formula && (
          <div className="formula-box">
            <h4>Formula</h4>
            <pre>{content.formula}</pre>
          </div>
        )}
        
        {content.usage && (
          <div className="usage-box">
            <h4>Usage</h4>
            <p>{content.usage}</p>
          </div>
        )}
        
        {content.warning && (
          <div className="warning-box">
            <pre>{content.warning}</pre>
          </div>
        )}
        
        {content.distortions && (
          <div className="distortions-box">
            <h4>Distortions</h4>
            <pre>{content.distortions}</pre>
          </div>
        )}
        
        {content.comparison && (
          <div className="comparison-box">
            <h4>Comparison</h4>
            <pre>{content.comparison}</pre>
          </div>
        )}
        
        {content.conventions && (
          <div className="conventions-box">
            <h4>Conventions</h4>
            <pre>{content.conventions}</pre>
          </div>
        )}
        
        {content.transformation && (
          <div className="transformation-box">
            <h4>Transformation</h4>
            <pre>{content.transformation}</pre>
          </div>
        )}
        
        {content.geoid && (
          <div className="geoid-box">
            <h4>Geoid</h4>
            <pre>{content.geoid}</pre>
          </div>
        )}
        
        {content.practical && (
          <div className="practical-box">
            <h4>Practical Info</h4>
            <pre>{content.practical}</pre>
          </div>
        )}
        
        {content.epochFormula && (
          <div className="formula-box">
            <h4>Epoch Formula</h4>
            <pre>{content.epochFormula}</pre>
          </div>
        )}
        
        {content.zoneCalculation && (
          <div className="formula-box">
            <h4>Zone Calculation</h4>
            <pre>{content.zoneCalculation}</pre>
          </div>
        )}
        
        {content.distortion && (
          <div className="distortion-box">
            <h4>Distortion</h4>
            <pre>{content.distortion}</pre>
          </div>
        )}
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="educational-overlay">
      <div className="educational-panel">
      <div className="edu-header">
        <h2>Educational Mode</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>        <div className="edu-content">
          <div className="topic-sidebar">
            {/* Coordinate Systems */}
            <div className="topic-section">
              <div 
                className={`section-header ${expandedSection === 'coordinateSystems' ? 'expanded' : ''}`}
                onClick={() => toggleSection('coordinateSystems')}
              >
                <span>Coordinate Systems</span>
                <span className="toggle-icon">{expandedSection === 'coordinateSystems' ? '−' : '+'}</span>
              </div>
              {expandedSection === 'coordinateSystems' && (
                <div className="section-topics">
                  <button 
                    className={selectedTopic === 'coordinateSystems.geographic' ? 'active' : ''}
                    onClick={() => setSelectedTopic('coordinateSystems.geographic')}
                  >
                    Geographic (GCS)
                  </button>
                  <button 
                    className={selectedTopic === 'coordinateSystems.geocentric' ? 'active' : ''}
                    onClick={() => setSelectedTopic('coordinateSystems.geocentric')}
                  >
                    Geocentric (ECEF)
                  </button>
                  <button 
                    className={selectedTopic === 'coordinateSystems.projected' ? 'active' : ''}
                    onClick={() => setSelectedTopic('coordinateSystems.projected')}
                  >
                    Projected (PCS)
                  </button>
                </div>
              )}
            </div>
            
            {/* Ellipsoid */}
            <div className="topic-section">
              <div 
                className={`section-header ${selectedTopic === 'ellipsoid' ? 'active' : ''}`}
                onClick={() => setSelectedTopic('ellipsoid')}
              >
                <span>Reference Ellipsoid</span>
              </div>
            </div>
            
            {/* Datum */}
            <div className="topic-section">
              <div 
                className={`section-header ${selectedTopic === 'datum' ? 'active' : ''}`}
                onClick={() => setSelectedTopic('datum')}
              >
                <span>Geodetic Datum</span>
              </div>
            </div>
            
            {/* Helmert */}
            <div className="topic-section">
              <div 
                className={`section-header ${selectedTopic === 'helmert' ? 'active' : ''}`}
                onClick={() => setSelectedTopic('helmert')}
              >
                <span>Helmert Transformation</span>
              </div>
            </div>
            
            {/* Heights */}
            <div className="topic-section">
              <div 
                className={`section-header ${selectedTopic === 'heights' ? 'active' : ''}`}
                onClick={() => setSelectedTopic('heights')}
              >
                <span>Height Systems</span>
              </div>
            </div>
            
            {/* UTM */}
            <div className="topic-section">
              <div 
                className={`section-header ${selectedTopic === 'utm' ? 'active' : ''}`}
                onClick={() => setSelectedTopic('utm')}
              >
                <span>UTM Projection</span>
              </div>
            </div>
            
            {/* Time Dependency */}
            <div className="topic-section">
              <div 
                className={`section-header ${selectedTopic === 'timeDependency' ? 'active' : ''}`}
                onClick={() => setSelectedTopic('timeDependency')}
              >
                <span>Time-Dependent Coordinates</span>
              </div>
            </div>
          </div>
          
          <div className="topic-content">
            {selectedTopic ? (
              <>
                <h3>{getContent(selectedTopic)?.title}</h3>
                {renderContent(getContent(selectedTopic))}
              </>
            ) : (
              <div className="no-topic-selected">
                <div className="welcome-icon"></div>
                <h3>Welcome</h3>
                <p>
                  Select a topic from the menu on the left to learn about 
                  coordinate systems and transformations.
                </p>
                
                <div className="quick-tips">
                  <h4>Quick Tips</h4>
                  <ul>
                    <li>
                      <strong>Datum mismatch</strong> can create errors of tens of meters!
                    </li>
                    <li>
                      GNSS gives <strong>ellipsoidal height (h)</strong>, not sea level.
                    </li>
                    <li>
                      Calculate UTM zone number with <strong>(lon + 180) / 6 + 1</strong>.
                    </li>
                    <li>
                      Modern coordinates are <strong>time-dependent</strong> (tectonic motion).
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EducationalPanel;
