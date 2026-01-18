import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to update map view when coordinates change
function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lon) {
      map.flyTo([center.lat, center.lon], map.getZoom(), {
        duration: 1
      });
    }
  }, [center, map]);
  
  return null;
}

// Coordinate display component
function CoordinateDisplay({ position }) {
  const map = useMap();
  const [coords, setCoords] = useState({ lat: 0, lon: 0 });
  const [zoom, setZoom] = useState(map.getZoom());
  
  useEffect(() => {
    const handleMove = () => {
      const center = map.getCenter();
      setCoords({ lat: center.lat, lon: center.lng });
      setZoom(map.getZoom());
    };
    
    map.on('move', handleMove);
    handleMove();
    
    return () => {
      map.off('move', handleMove);
    };
  }, [map]);
  
  return (
    <div className="coord-display">
      <span>Center: {coords.lat.toFixed(6)}°, {coords.lon.toFixed(6)}°</span>
      <span>Zoom: {zoom}</span>
    </div>
  );
}

// Mouse position display
function MousePositionDisplay() {
  const map = useMap();
  const [mouseCoords, setMouseCoords] = useState(null);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
    };
    
    const handleMouseOut = () => {
      setMouseCoords(null);
    };
    
    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);
    
    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseOut);
    };
  }, [map]);
  
  if (!mouseCoords) return null;
  
  return (
    <div className="mouse-position">
      <span>Mouse: {mouseCoords.lat.toFixed(6)}°, {mouseCoords.lon.toFixed(6)}°</span>
    </div>
  );
}

// Scale bar info
function ScaleInfo() {
  const map = useMap();
  const [scale, setScale] = useState('');
  
  useEffect(() => {
    const updateScale = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      // Approximate scale calculation
      const metersPerPixel = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom);
      const scale = Math.round(metersPerPixel * 96 * 39.3701); // 96 DPI, convert to 1:scale
      setScale(`1:${scale.toLocaleString()}`);
    };
    
    map.on('zoomend', updateScale);
    map.on('moveend', updateScale);
    updateScale();
    
    return () => {
      map.off('zoomend', updateScale);
      map.off('moveend', updateScale);
    };
  }, [map]);
  
  return (
    <div className="scale-info">
      <span>Scale: ~{scale}</span>
    </div>
  );
}

function MapView({ coordinate }) {
  const [position, setPosition] = useState([41.0082, 28.9784]); // Default: Istanbul
  
  useEffect(() => {
    if (coordinate && coordinate.lat && coordinate.lon) {
      setPosition([coordinate.lat, coordinate.lon]);
    }
  }, [coordinate]);
  
  return (
    <div className="map-container">
      <MapContainer
        center={position}
        zoom={10}
        className="leaflet-map"
        zoomControl={true}
      >
        <LayersControl position="topright">
          {/* Satellite Layer - Default */}
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          
          {/* OSM Layer */}
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          
          {/* Terrain Layer */}
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          
          {/* Hybrid - Satellite with Labels */}
          <LayersControl.BaseLayer name="Hybrid">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          
          {/* Optional overlay for labels */}
          <LayersControl.Overlay name="Labels">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.Overlay>
          
          {/* Graticule overlay */}
          <LayersControl.Overlay name="Grid">
            <TileLayer
              attribution=''
              url="https://tiles.stadiamaps.com/tiles/stamen_toner_lines/{z}/{x}/{y}{r}.png"
              opacity={0.3}
            />
          </LayersControl.Overlay>
        </LayersControl>
        
        {/* Map updater for coordinate changes */}
        <MapUpdater center={coordinate} />
        
        {/* Coordinate displays */}
        <CoordinateDisplay />
        <MousePositionDisplay />
        <ScaleInfo />
        
        {/* Marker for the transformed coordinate */}
        {coordinate && coordinate.lat && coordinate.lon && (
          <Marker position={[coordinate.lat, coordinate.lon]} icon={customIcon}>
            <Popup>
              <div className="marker-popup">
                <strong>Coordinate</strong>
                <p>Lat: {coordinate.lat.toFixed(8)}°</p>
                <p>Lon: {coordinate.lon.toFixed(8)}°</p>
                {coordinate.h !== undefined && (
                  <p>Height: {coordinate.h.toFixed(3)} m</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
      {/* Map Legend/Info */}
      <div className="map-info-panel">
        <div className="info-item">
          <span className="info-label">Datum:</span>
          <span className="info-value">WGS84</span>
        </div>
        <div className="info-item">
          <span className="info-label">CRS:</span>
          <span className="info-value">EPSG:4326</span>
        </div>
      </div>
    </div>
  );
}

export default MapView;
