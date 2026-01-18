/**
 * Projection Definitions
 * 
 * Map projections transform coordinates from the curved Earth surface
 * to a flat plane. Each projection preserves certain properties:
 * - Conformal: Preserves angles (shapes locally)
 * - Equal-area: Preserves area
 * - Equidistant: Preserves distances along certain lines
 * 
 * No projection can preserve all properties simultaneously.
 */

export const PROJECTIONS = {
  // UTM Zones
  UTM: {
    name: 'UTM',
    fullName: 'Universal Transverse Mercator',
    type: 'Transverse Mercator',
    property: 'Conformal',
    description: 'Worldwide projection system divided into 60 zones (6° wide each). Best for medium-scale mapping.',
    usage: 'Military, topographic mapping, engineering surveys',
    parameters: {
      centralMeridian: 'Zone dependent (-177° to 177°)',
      scaleFactor: 0.9996,
      falseEasting: 500000,
      falseNorthingNorth: 0,
      falseNorthingSouth: 10000000
    },
    distortion: {
      scale: '0.04% at zone center, up to 0.16% at zone edges',
      area: 'Minimal within zone',
      angle: 'Preserved (conformal)'
    },
    zones: generateUTMZones()
  },

  // Turkey TM Projections
  TM30: {
    name: 'TM30',
    fullName: 'Transverse Mercator 30°E',
    type: 'Transverse Mercator',
    property: 'Conformal',
    description: 'Turkish national projection with central meridian at 30°E.',
    usage: 'Turkish cadastral and topographic maps (legacy)',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs',
    parameters: {
      centralMeridian: 30,
      scaleFactor: 1.0,
      falseEasting: 500000,
      falseNorthing: 0
    }
  },

  TM33: {
    name: 'TM33',
    fullName: 'Transverse Mercator 33°E',
    type: 'Transverse Mercator',
    property: 'Conformal',
    description: 'Turkish projection zone centered at 33°E.',
    usage: 'Turkish mapping',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=33 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs',
    parameters: {
      centralMeridian: 33,
      scaleFactor: 1.0,
      falseEasting: 500000,
      falseNorthing: 0
    }
  },

  TM36: {
    name: 'TM36',
    fullName: 'Transverse Mercator 36°E',
    type: 'Transverse Mercator',
    property: 'Conformal',
    description: 'Turkish projection zone centered at 36°E.',
    usage: 'Turkish mapping',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=36 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs',
    parameters: {
      centralMeridian: 36,
      scaleFactor: 1.0,
      falseEasting: 500000,
      falseNorthing: 0
    }
  },

  TM39: {
    name: 'TM39',
    fullName: 'Transverse Mercator 39°E',
    type: 'Transverse Mercator',
    property: 'Conformal',
    description: 'Turkish projection zone centered at 39°E.',
    usage: 'Turkish mapping',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=39 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs',
    parameters: {
      centralMeridian: 39,
      scaleFactor: 1.0,
      falseEasting: 500000,
      falseNorthing: 0
    }
  },

  TM42: {
    name: 'TM42',
    fullName: 'Transverse Mercator 42°E',
    type: 'Transverse Mercator',
    property: 'Conformal',
    description: 'Turkish projection zone centered at 42°E.',
    usage: 'Turkish mapping',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=42 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs',
    parameters: {
      centralMeridian: 42,
      scaleFactor: 1.0,
      falseEasting: 500000,
      falseNorthing: 0
    }
  },

  TM45: {
    name: 'TM45',
    fullName: 'Transverse Mercator 45°E',
    type: 'Transverse Mercator',
    property: 'Conformal',
    description: 'Turkish projection zone centered at 45°E.',
    usage: 'Turkish mapping',
    proj4: '+proj=tmerc +lat_0=0 +lon_0=45 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs',
    parameters: {
      centralMeridian: 45,
      scaleFactor: 1.0,
      falseEasting: 500000,
      falseNorthing: 0
    }
  },

  // Lambert Conformal Conic
  LCC: {
    name: 'LCC',
    fullName: 'Lambert Conformal Conic',
    type: 'Conic',
    property: 'Conformal',
    description: 'Best for mid-latitude regions with east-west extent. Used for aeronautical charts.',
    usage: 'Aviation, state plane coordinates, meteorological maps',
    parameters: {
      standardParallel1: 'Variable',
      standardParallel2: 'Variable',
      centralMeridian: 'Variable',
      latitudeOfOrigin: 'Variable'
    },
    distortion: {
      scale: 'True along standard parallels',
      angle: 'Preserved (conformal)',
      area: 'Slight distortion away from standard parallels'
    }
  },

  // Web Mercator
  WebMercator: {
    name: 'Web Mercator',
    fullName: 'WGS 84 / Pseudo-Mercator',
    type: 'Cylindrical',
    property: 'Conformal (with limitations)',
    epsg: 3857,
    description: 'Standard for web mapping (Google Maps, OpenStreetMap). Not suitable for measurements.',
    usage: 'Web mapping, visualization only',
    proj4: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs',
    parameters: {
      sphereRadius: 6378137,
      centralMeridian: 0
    },
    distortion: {
      scale: 'Severe at high latitudes',
      area: 'Severe distortion (Greenland appears larger than Africa)',
      angle: 'Approximately preserved'
    },
    warning: 'Not recommended for measurements or analysis. Use for display only.'
  },

  // Standard Mercator
  Mercator: {
    name: 'Mercator',
    fullName: 'Mercator Projection',
    type: 'Cylindrical',
    property: 'Conformal',
    description: 'Classic projection preserving angles. Historically used for navigation.',
    usage: 'Navigation charts, equatorial regions',
    parameters: {
      centralMeridian: 0,
      scaleFactor: 1.0
    },
    distortion: {
      scale: 'Increases dramatically toward poles',
      area: 'Severe distortion at high latitudes',
      angle: 'Preserved (conformal)'
    }
  }
};

/**
 * Generate UTM zone definitions
 */
function generateUTMZones() {
  const zones = {};
  
  for (let zone = 1; zone <= 60; zone++) {
    const centralMeridian = -183 + zone * 6;
    zones[zone] = {
      zone: zone,
      centralMeridian: centralMeridian,
      bounds: {
        west: centralMeridian - 3,
        east: centralMeridian + 3
      },
      proj4North: `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`,
      proj4South: `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`,
      epsgNorth: 32600 + zone,
      epsgSouth: 32700 + zone
    };
  }
  
  return zones;
}

/**
 * Get UTM zone from longitude
 * @param {number} longitude - Longitude in degrees
 * @returns {number} - UTM zone number (1-60)
 */
export function getUTMZone(longitude) {
  // Normalize longitude to -180 to 180
  let lon = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  // Special zones for Norway and Svalbard not implemented
  // Standard calculation
  return Math.floor((lon + 180) / 6) + 1;
}

/**
 * Get UTM zone hemisphere indicator
 * @param {number} latitude - Latitude in degrees
 * @returns {string} - 'N' for north, 'S' for south
 */
export function getUTMHemisphere(latitude) {
  return latitude >= 0 ? 'N' : 'S';
}

/**
 * Get proj4 string for UTM zone
 * @param {number} zone - UTM zone number
 * @param {boolean} isNorth - True for northern hemisphere
 * @param {string} datum - Datum name (default: WGS84)
 * @returns {string} - Proj4 definition string
 */
export function getUTMProj4(zone, isNorth = true, datum = 'WGS84') {
  const ellipsoid = datum === 'WGS84' ? 'WGS84' : 'GRS80';
  const south = isNorth ? '' : '+south ';
  return `+proj=utm +zone=${zone} ${south}+ellps=${ellipsoid} +units=m +no_defs`;
}

/**
 * Get projection by name
 * @param {string} name - Projection name
 * @returns {Object} - Projection object
 */
export function getProjection(name) {
  return PROJECTIONS[name] || null;
}

/**
 * Calculate scale factor for Transverse Mercator
 * @param {number} latitude - Latitude in radians
 * @param {number} longitude - Longitude in radians
 * @param {number} centralMeridian - Central meridian in radians
 * @param {number} k0 - Scale factor at central meridian
 * @returns {number} - Scale factor at given point
 */
export function calculateTMScaleFactor(latitude, longitude, centralMeridian, k0 = 0.9996) {
  const dLon = longitude - centralMeridian;
  const cosLat = Math.cos(latitude);
  
  // Simplified calculation
  const B = cosLat * Math.sin(dLon);
  const k = k0 / Math.sqrt(1 - B * B);
  
  return k;
}

export default PROJECTIONS;
