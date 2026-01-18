import { useState, useCallback, useMemo } from 'react';
import { DATUMS } from '../utils/datums';
import { ELLIPSOIDS } from '../utils/ellipsoids';
import { PROJECTIONS, getUTMZone } from '../utils/projections';
import {
  transformDatum,
  geographicToGeocentric,
  geocentricToGeographic,
  projectCoordinates,
  unprojectCoordinates,
  transformCRS,
  getUTMEPSG,
  decimalToDMS,
  dmsToDecimal,
  formatDMS,
  proj4
} from '../utils/transformations';
import './TransformationPanel.css';

// Coordinate type options
const COORD_TYPES = {
  GEOGRAPHIC: 'geographic',
  PROJECTED: 'projected',
  GEOCENTRIC: 'geocentric'
};

// Projection options
const PROJECTION_OPTIONS = [
  { value: 'UTM', label: 'UTM (Universal Transverse Mercator)' },
  { value: 'WebMercator', label: 'Web Mercator (EPSG:3857)' },
  { value: 'TM30', label: 'TM 30°E (ED50)' },
  { value: 'TM33', label: 'TM 33°E (ED50)' },
  { value: 'TM36', label: 'TM 36°E (ED50)' },
  { value: 'TM39', label: 'TM 39°E (ED50)' },
  { value: 'TM42', label: 'TM 42°E (ED50)' },
  { value: 'TM45', label: 'TM 45°E (ED50)' },
  { value: 'TUREF_TM30', label: 'TUREF TM 30°E' },
  { value: 'TUREF_TM33', label: 'TUREF TM 33°E' },
  { value: 'TUREF_TM36', label: 'TUREF TM 36°E' },
  { value: 'TUREF_TM39', label: 'TUREF TM 39°E' },
  { value: 'TUREF_TM42', label: 'TUREF TM 42°E' },
  { value: 'TUREF_TM45', label: 'TUREF TM 45°E' },
];

function TransformationPanel({ onCoordinateChange }) {
  // Source coordinate state
  const [sourceType, setSourceType] = useState(COORD_TYPES.GEOGRAPHIC);
  const [sourceDatum, setSourceDatum] = useState('WGS84');
  const [sourceProjection, setSourceProjection] = useState('UTM');
  const [sourceUTMZone, setSourceUTMZone] = useState(36);
  const [sourceHemisphere, setSourceHemisphere] = useState('N');
  
  // Target coordinate state
  const [targetType, setTargetType] = useState(COORD_TYPES.PROJECTED);
  const [targetDatum, setTargetDatum] = useState('WGS84');
  const [targetProjection, setTargetProjection] = useState('UTM');
  const [targetUTMZone, setTargetUTMZone] = useState(36);
  const [targetHemisphere, setTargetHemisphere] = useState('N');
  
  // Input coordinates
  const [inputCoords, setInputCoords] = useState({
    lat: 41.0082,
    lon: 28.9784,
    h: 0,
    x: 0,
    y: 0,
    z: 0,
    easting: 500000,
    northing: 4500000
  });
  
  // Output coordinates
  const [outputCoords, setOutputCoords] = useState(null);
  
  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchOutput, setBatchOutput] = useState('');
  
  // DMS input mode
  const [useDMS, setUseDMS] = useState(false);
  const [dmsInput, setDmsInput] = useState({
    latDeg: 41, latMin: 0, latSec: 29.52, latDir: 'N',
    lonDeg: 28, lonMin: 58, lonSec: 42.24, lonDir: 'E'
  });
  
  // Error state
  const [error, setError] = useState(null);
  
  // Handle input change
  const handleInputChange = (field, value) => {
    setInputCoords(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };
  
  // Handle DMS input change
  const handleDMSChange = (field, value) => {
    setDmsInput(prev => ({
      ...prev,
      [field]: field.includes('Dir') ? value : (parseFloat(value) || 0)
    }));
  };
  
  // Convert DMS to decimal
  const convertDMSToDecimal = useCallback(() => {
    const lat = dmsToDecimal(
      dmsInput.latDeg,
      dmsInput.latMin,
      dmsInput.latSec,
      dmsInput.latDir
    );
    const lon = dmsToDecimal(
      dmsInput.lonDeg,
      dmsInput.lonMin,
      dmsInput.lonSec,
      dmsInput.lonDir
    );
    setInputCoords(prev => ({ ...prev, lat, lon }));
  }, [dmsInput]);
  
  // Get projection CRS string
  const getProjectionCRS = useCallback((projection, utmZone, hemisphere, datum) => {
    if (projection === 'UTM') {
      return getUTMEPSG(utmZone, hemisphere === 'N');
    } else if (projection === 'WebMercator') {
      return 'EPSG:3857';
    } else if (projection.startsWith('TM') || projection.startsWith('TUREF')) {
      // Use ED50 TM projections
      if (projection.startsWith('TUREF')) {
        return projection;
      }
      return `ED50_${projection}`;
    }
    return 'EPSG:4326';
  }, []);
  
  // Main transformation function
  const performTransformation = useCallback(() => {
    try {
      setError(null);
      let sourceLatLon = null;
      let result = {};
      
      // Step 1: Convert source to geographic WGS84 (internal reference)
      if (sourceType === COORD_TYPES.GEOGRAPHIC) {
        // If using DMS, convert first
        if (useDMS) {
          convertDMSToDecimal();
        }
        
        const lat = inputCoords.lat;
        const lon = inputCoords.lon;
        const h = inputCoords.h;
        
        // If source datum is not WGS84, transform
        if (sourceDatum !== 'WGS84') {
          const transformed = transformDatum(
            { lat, lon, h },
            sourceDatum,
            'WGS84',
            'geographic'
          );
          sourceLatLon = { lat: transformed.lat, lon: transformed.lon, h: transformed.h };
        } else {
          sourceLatLon = { lat, lon, h };
        }
        
      } else if (sourceType === COORD_TYPES.GEOCENTRIC) {
        // Convert ECEF to geographic
        const ellipsoid = ELLIPSOIDS[DATUMS[sourceDatum].ellipsoid];
        const geo = geocentricToGeographic(inputCoords.x, inputCoords.y, inputCoords.z, ellipsoid);
        
        // Transform to WGS84 if needed
        if (sourceDatum !== 'WGS84') {
          const transformed = transformDatum(geo, sourceDatum, 'WGS84', 'geographic');
          sourceLatLon = transformed;
        } else {
          sourceLatLon = geo;
        }
        
      } else if (sourceType === COORD_TYPES.PROJECTED) {
        // Unproject to geographic
        const sourceCRS = getProjectionCRS(sourceProjection, sourceUTMZone, sourceHemisphere, sourceDatum);
        const unprojected = unprojectCoordinates(inputCoords.easting, inputCoords.northing, sourceCRS);
        
        // Handle datum transformation
        // Note: proj4 definitions may already include datum info
        sourceLatLon = { lat: unprojected.lat, lon: unprojected.lon, h: inputCoords.h || 0 };
      }
      
      // Step 2: Convert to target coordinate system
      if (targetType === COORD_TYPES.GEOGRAPHIC) {
        // Transform datum if needed
        if (targetDatum !== 'WGS84') {
          result = transformDatum(sourceLatLon, 'WGS84', targetDatum, 'geographic');
        } else {
          result = { ...sourceLatLon };
        }
        
        // Add DMS format
        result.latDMS = formatDMS(decimalToDMS(result.lat, true));
        result.lonDMS = formatDMS(decimalToDMS(result.lon, false));
        
      } else if (targetType === COORD_TYPES.GEOCENTRIC) {
        // Transform datum first if needed
        let geoForECEF = sourceLatLon;
        if (targetDatum !== 'WGS84') {
          geoForECEF = transformDatum(sourceLatLon, 'WGS84', targetDatum, 'geographic');
        }
        
        // Convert to ECEF
        const ellipsoid = ELLIPSOIDS[DATUMS[targetDatum].ellipsoid];
        const ecef = geographicToGeocentric(geoForECEF.lat, geoForECEF.lon, geoForECEF.h || 0, ellipsoid);
        result = ecef;
        
      } else if (targetType === COORD_TYPES.PROJECTED) {
        const targetCRS = getProjectionCRS(targetProjection, targetUTMZone, targetHemisphere, targetDatum);
        const projected = projectCoordinates(sourceLatLon.lat, sourceLatLon.lon, targetCRS);
        result = {
          easting: projected.easting,
          northing: projected.northing,
          zone: targetProjection === 'UTM' ? targetUTMZone : null,
          hemisphere: targetProjection === 'UTM' ? targetHemisphere : null
        };
      }
      
      setOutputCoords(result);
      
      // Notify parent of coordinate change for map update
      if (onCoordinateChange && sourceLatLon) {
        onCoordinateChange(sourceLatLon);
      }
      
    } catch (err) {
      setError(err.message);
      setOutputCoords(null);
    }
  }, [
    sourceType, sourceDatum, sourceProjection, sourceUTMZone, sourceHemisphere,
    targetType, targetDatum, targetProjection, targetUTMZone, targetHemisphere,
    inputCoords, useDMS, dmsInput, convertDMSToDecimal, getProjectionCRS, onCoordinateChange
  ]);
  
  // Batch transformation
  const performBatchTransformation = useCallback(() => {
    try {
      setError(null);
      const lines = batchInput.trim().split('\n');
      const results = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split(/[,\s\t]+/).map(p => parseFloat(p.trim()));
        
        if (sourceType === COORD_TYPES.GEOGRAPHIC && parts.length >= 2) {
          const [lat, lon, h = 0] = parts;
          let sourceLatLon = { lat, lon, h };
          
          if (sourceDatum !== 'WGS84') {
            sourceLatLon = transformDatum(sourceLatLon, sourceDatum, 'WGS84', 'geographic');
          }
          
          if (targetType === COORD_TYPES.GEOGRAPHIC) {
            let result = sourceDatum !== targetDatum 
              ? transformDatum(sourceLatLon, 'WGS84', targetDatum, 'geographic')
              : sourceLatLon;
            results.push(`${result.lat.toFixed(8)}, ${result.lon.toFixed(8)}, ${result.h.toFixed(3)}`);
          } else if (targetType === COORD_TYPES.PROJECTED) {
            const targetCRS = getProjectionCRS(targetProjection, targetUTMZone, targetHemisphere, targetDatum);
            const projected = projectCoordinates(sourceLatLon.lat, sourceLatLon.lon, targetCRS);
            results.push(`${projected.easting.toFixed(3)}, ${projected.northing.toFixed(3)}`);
          } else if (targetType === COORD_TYPES.GEOCENTRIC) {
            const ellipsoid = ELLIPSOIDS[DATUMS[targetDatum].ellipsoid];
            const ecef = geographicToGeocentric(sourceLatLon.lat, sourceLatLon.lon, sourceLatLon.h, ellipsoid);
            results.push(`${ecef.x.toFixed(3)}, ${ecef.y.toFixed(3)}, ${ecef.z.toFixed(3)}`);
          }
          
        } else if (sourceType === COORD_TYPES.PROJECTED && parts.length >= 2) {
          const [easting, northing] = parts;
          const sourceCRS = getProjectionCRS(sourceProjection, sourceUTMZone, sourceHemisphere, sourceDatum);
          const unprojected = unprojectCoordinates(easting, northing, sourceCRS);
          
          if (targetType === COORD_TYPES.GEOGRAPHIC) {
            results.push(`${unprojected.lat.toFixed(8)}, ${unprojected.lon.toFixed(8)}`);
          } else if (targetType === COORD_TYPES.PROJECTED) {
            const targetCRS = getProjectionCRS(targetProjection, targetUTMZone, targetHemisphere, targetDatum);
            const projected = projectCoordinates(unprojected.lat, unprojected.lon, targetCRS);
            results.push(`${projected.easting.toFixed(3)}, ${projected.northing.toFixed(3)}`);
          }
        }
      }
      
      setBatchOutput(results.join('\n'));
    } catch (err) {
      setError(`Batch error: ${err.message}`);
    }
  }, [batchInput, sourceType, sourceDatum, sourceProjection, sourceUTMZone, sourceHemisphere,
      targetType, targetDatum, targetProjection, targetUTMZone, targetHemisphere, getProjectionCRS]);
  
  // Auto-detect UTM zone from longitude
  const autoDetectUTMZone = useCallback(() => {
    if (sourceType === COORD_TYPES.GEOGRAPHIC) {
      const zone = getUTMZone(inputCoords.lon);
      setTargetUTMZone(zone);
    }
  }, [sourceType, inputCoords.lon]);
  
  // Swap source and target
  const swapSourceTarget = useCallback(() => {
    // Swap types
    setSourceType(targetType);
    setTargetType(sourceType);
    
    // Swap datums
    setSourceDatum(targetDatum);
    setTargetDatum(sourceDatum);
    
    // Swap projections
    setSourceProjection(targetProjection);
    setTargetProjection(sourceProjection);
    
    // Swap UTM zones
    setSourceUTMZone(targetUTMZone);
    setTargetUTMZone(sourceUTMZone);
    
    setSourceHemisphere(targetHemisphere);
    setTargetHemisphere(sourceHemisphere);
  }, [sourceType, targetType, sourceDatum, targetDatum, sourceProjection, targetProjection,
      sourceUTMZone, targetUTMZone, sourceHemisphere, targetHemisphere]);
  
  return (
    <div className="transformation-panel">
      <div className="panel-header">
        <h2>Coordinate Transformation</h2>
      </div>
      
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button 
          className={!batchMode ? 'active' : ''} 
          onClick={() => setBatchMode(false)}
        >
          Single
        </button>
        <button 
          className={batchMode ? 'active' : ''} 
          onClick={() => setBatchMode(true)}
        >
          Batch
        </button>
      </div>
      
      {!batchMode ? (
        <>
          {/* Source Section */}
          <div className="coord-section source-section">
            <h3>Source</h3>
            
            <div className="form-group">
              <label>Coordinate Type</label>
              <select 
                value={sourceType} 
                onChange={(e) => setSourceType(e.target.value)}
              >
                <option value={COORD_TYPES.GEOGRAPHIC}>Geographic (Lat, Lon, h)</option>
                <option value={COORD_TYPES.PROJECTED}>Projected (E, N)</option>
                <option value={COORD_TYPES.GEOCENTRIC}>Geocentric (X, Y, Z)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Datum</label>
              <select 
                value={sourceDatum} 
                onChange={(e) => setSourceDatum(e.target.value)}
              >
                {Object.entries(DATUMS).map(([key, datum]) => (
                  <option key={key} value={key}>{datum.name} - {datum.fullName}</option>
                ))}
              </select>
            </div>
            
            {sourceType === COORD_TYPES.PROJECTED && (
              <>
                <div className="form-group">
                  <label>Projeksiyon</label>
                  <select 
                    value={sourceProjection} 
                    onChange={(e) => setSourceProjection(e.target.value)}
                  >
                    {PROJECTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                {sourceProjection === 'UTM' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Zone</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="60" 
                        value={sourceUTMZone}
                        onChange={(e) => setSourceUTMZone(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Hemisphere</label>
                      <select 
                        value={sourceHemisphere}
                        onChange={(e) => setSourceHemisphere(e.target.value)}
                      >
                        <option value="N">North</option>
                        <option value="S">South</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Input Fields */}
            <div className="input-fields">
              {sourceType === COORD_TYPES.GEOGRAPHIC && (
                <>
                  <div className="form-group dms-toggle">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={useDMS} 
                        onChange={(e) => setUseDMS(e.target.checked)}
                      />
                      DMS Format
                    </label>
                  </div>
                  
                  {!useDMS ? (
                    <>
                      <div className="form-group">
                        <label>Latitude (deg)</label>
                        <input 
                          type="number" 
                          step="0.00000001"
                          value={inputCoords.lat}
                          onChange={(e) => handleInputChange('lat', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Longitude (deg)</label>
                        <input 
                          type="number" 
                          step="0.00000001"
                          value={inputCoords.lon}
                          onChange={(e) => handleInputChange('lon', e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="dms-input">
                        <label>Latitude</label>
                        <div className="dms-row">
                          <input type="number" value={dmsInput.latDeg} onChange={(e) => handleDMSChange('latDeg', e.target.value)} />°
                          <input type="number" value={dmsInput.latMin} onChange={(e) => handleDMSChange('latMin', e.target.value)} />'
                          <input type="number" step="0.0001" value={dmsInput.latSec} onChange={(e) => handleDMSChange('latSec', e.target.value)} />"
                          <select value={dmsInput.latDir} onChange={(e) => handleDMSChange('latDir', e.target.value)}>
                            <option value="N">N</option>
                            <option value="S">S</option>
                          </select>
                        </div>
                      </div>
                      <div className="dms-input">
                        <label>Longitude</label>
                        <div className="dms-row">
                          <input type="number" value={dmsInput.lonDeg} onChange={(e) => handleDMSChange('lonDeg', e.target.value)} />°
                          <input type="number" value={dmsInput.lonMin} onChange={(e) => handleDMSChange('lonMin', e.target.value)} />'
                          <input type="number" step="0.0001" value={dmsInput.lonSec} onChange={(e) => handleDMSChange('lonSec', e.target.value)} />"
                          <select value={dmsInput.lonDir} onChange={(e) => handleDMSChange('lonDir', e.target.value)}>
                            <option value="E">E</option>
                            <option value="W">W</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label>Height (m)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={inputCoords.h}
                      onChange={(e) => handleInputChange('h', e.target.value)}
                    />
                  </div>
                </>
              )}
              
              {sourceType === COORD_TYPES.PROJECTED && (
                <>
                  <div className="form-group">
                    <label>Easting (m)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={inputCoords.easting}
                      onChange={(e) => handleInputChange('easting', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Northing (m)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={inputCoords.northing}
                      onChange={(e) => handleInputChange('northing', e.target.value)}
                    />
                  </div>
                </>
              )}
              
              {sourceType === COORD_TYPES.GEOCENTRIC && (
                <>
                  <div className="form-group">
                    <label>X (m)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={inputCoords.x}
                      onChange={(e) => handleInputChange('x', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Y (m)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={inputCoords.y}
                      onChange={(e) => handleInputChange('y', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Z (m)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={inputCoords.z}
                      onChange={(e) => handleInputChange('z', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Swap Button */}
          <div className="swap-container">
            <button className="swap-button" onClick={swapSourceTarget} title="Swap source and target">
              ⇅
            </button>
          </div>
          
          {/* Target Section */}
          <div className="coord-section target-section">
            <h3>Target</h3>
            
            <div className="form-group">
              <label>Coordinate Type</label>
              <select 
                value={targetType} 
                onChange={(e) => setTargetType(e.target.value)}
              >
                <option value={COORD_TYPES.GEOGRAPHIC}>Geographic (Lat, Lon, h)</option>
                <option value={COORD_TYPES.PROJECTED}>Projected (E, N)</option>
                <option value={COORD_TYPES.GEOCENTRIC}>Geocentric (X, Y, Z)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Datum</label>
              <select 
                value={targetDatum} 
                onChange={(e) => setTargetDatum(e.target.value)}
              >
                {Object.entries(DATUMS).map(([key, datum]) => (
                  <option key={key} value={key}>{datum.name} - {datum.fullName}</option>
                ))}
              </select>
            </div>
            
            {targetType === COORD_TYPES.PROJECTED && (
              <>
                <div className="form-group">
                  <label>Projeksiyon</label>
                  <select 
                    value={targetProjection} 
                    onChange={(e) => setTargetProjection(e.target.value)}
                  >
                    {PROJECTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                {targetProjection === 'UTM' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Zone</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="60" 
                        value={targetUTMZone}
                        onChange={(e) => setTargetUTMZone(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Hemisphere</label>
                      <select 
                        value={targetHemisphere}
                        onChange={(e) => setTargetHemisphere(e.target.value)}
                      >
                        <option value="N">North</option>
                        <option value="S">South</option>
                      </select>
                    </div>
                    <button 
                      className="auto-zone-btn" 
                      onClick={autoDetectUTMZone}
                      title="Auto-detect UTM zone"
                    >
                      Auto
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Transform Button */}
          <button className="transform-button" onClick={performTransformation}>
            Transform
          </button>
          
          {/* Error Display */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {/* Output Display */}
          {outputCoords && (
            <div className="output-section">
              <h3>Result</h3>
              <div className="output-values">
                {targetType === COORD_TYPES.GEOGRAPHIC && (
                  <>
                    <div className="output-row">
                      <span className="label">Latitude:</span>
                      <span className="value">{outputCoords.lat?.toFixed(8)}°</span>
                    </div>
                    <div className="output-row">
                      <span className="label">Longitude:</span>
                      <span className="value">{outputCoords.lon?.toFixed(8)}°</span>
                    </div>
                    <div className="output-row">
                      <span className="label">Latitude (DMS):</span>
                      <span className="value">{outputCoords.latDMS}</span>
                    </div>
                    <div className="output-row">
                      <span className="label">Longitude (DMS):</span>
                      <span className="value">{outputCoords.lonDMS}</span>
                    </div>
                    <div className="output-row">
                      <span className="label">Height:</span>
                      <span className="value">{outputCoords.h?.toFixed(3)} m</span>
                    </div>
                  </>
                )}
                
                {targetType === COORD_TYPES.PROJECTED && (
                  <>
                    <div className="output-row">
                      <span className="label">Easting (E):</span>
                      <span className="value">{outputCoords.easting?.toFixed(3)} m</span>
                    </div>
                    <div className="output-row">
                      <span className="label">Northing (N):</span>
                      <span className="value">{outputCoords.northing?.toFixed(3)} m</span>
                    </div>
                    {outputCoords.zone && (
                      <div className="output-row">
                        <span className="label">UTM Zone:</span>
                        <span className="value">{outputCoords.zone}{outputCoords.hemisphere}</span>
                      </div>
                    )}
                  </>
                )}
                
                {targetType === COORD_TYPES.GEOCENTRIC && (
                  <>
                    <div className="output-row">
                      <span className="label">X:</span>
                      <span className="value">{outputCoords.x?.toFixed(3)} m</span>
                    </div>
                    <div className="output-row">
                      <span className="label">Y:</span>
                      <span className="value">{outputCoords.y?.toFixed(3)} m</span>
                    </div>
                    <div className="output-row">
                      <span className="label">Z:</span>
                      <span className="value">{outputCoords.z?.toFixed(3)} m</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Batch Mode */
        <div className="batch-section">
          <div className="batch-info">
            <p>Enter one coordinate per line (comma or space separated)</p>
            <p className="batch-format">
              {sourceType === COORD_TYPES.GEOGRAPHIC && 'Format: lat, lon [, h]'}
              {sourceType === COORD_TYPES.PROJECTED && 'Format: easting, northing'}
              {sourceType === COORD_TYPES.GEOCENTRIC && 'Format: x, y, z'}
            </p>
          </div>
          
          {/* Batch source/target settings same as single mode */}
          <div className="batch-settings">
            <div className="form-row">
              <div className="form-group">
                <label>Source Type</label>
                <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                  <option value={COORD_TYPES.GEOGRAPHIC}>Geographic</option>
                  <option value={COORD_TYPES.PROJECTED}>Projected</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Type</label>
                <select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                  <option value={COORD_TYPES.GEOGRAPHIC}>Geographic</option>
                  <option value={COORD_TYPES.PROJECTED}>Projected</option>
                </select>
              </div>
            </div>
            
            {(sourceType === COORD_TYPES.PROJECTED || targetType === COORD_TYPES.PROJECTED) && (
              <div className="form-row">
                {sourceType === COORD_TYPES.PROJECTED && (
                  <div className="form-group">
                    <label>Source Projection</label>
                    <select value={sourceProjection} onChange={(e) => setSourceProjection(e.target.value)}>
                      {PROJECTION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {targetType === COORD_TYPES.PROJECTED && (
                  <div className="form-group">
                    <label>Target Projection</label>
                    <select value={targetProjection} onChange={(e) => setTargetProjection(e.target.value)}>
                      {PROJECTION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="batch-input-area">
            <label>Input</label>
            <textarea 
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder="41.0082, 28.9784&#10;39.9334, 32.8597&#10;38.4237, 27.1428"
              rows={8}
            />
          </div>
          
          <button className="transform-button" onClick={performBatchTransformation}>
            Batch Transform
          </button>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="batch-output-area">
            <label>Output</label>
            <textarea 
              value={batchOutput}
              readOnly
              rows={8}
            />
            <button 
              className="copy-button"
              onClick={() => navigator.clipboard.writeText(batchOutput)}
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransformationPanel;
