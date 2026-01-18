/**
 * Geoid Undulation Approximation
 * 
 * This module provides approximate geoid undulation values.
 * For high-precision applications, use EGM96 or EGM2008 grid files.
 * 
 * Geoid undulation (N) is the height of the geoid above the reference ellipsoid.
 * The relationship between heights:
 * 
 * H = h - N
 * 
 * Where:
 * - H: Orthometric height (above geoid/Mean Sea Level)
 * - h: Ellipsoidal height (from GNSS)
 * - N: Geoid undulation
 */

/**
 * Approximate geoid undulation using a simplified spherical harmonic model
 * This is a simplified approximation - for precise work use EGM96/EGM2008
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @returns {number} - Approximate geoid undulation in meters
 */
export function approximateGeoidUndulation(lat, lon) {
  // Very simplified approximation based on major terms
  // Real applications should use EGM96 or EGM2008 grids
  
  const phi = lat * Math.PI / 180;
  const lambda = lon * Math.PI / 180;
  
  // Simplified model (not accurate, for demonstration only)
  // Real geoid models have thousands of coefficients
  const N = -8.4 - 14 * Math.sin(phi) * Math.sin(phi)
          + 16 * Math.cos(2 * lambda) * Math.cos(phi) * Math.cos(phi)
          - 10 * Math.sin(3 * phi)
          + 8 * Math.cos(4 * lambda) * Math.cos(2 * phi);
  
  return N;
}

/**
 * Regional geoid undulation for Turkey (approximate)
 * Turkey's geoid undulation ranges roughly from 25m to 45m
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @returns {number} - Approximate geoid undulation in meters
 */
export function turkeyGeoidUndulation(lat, lon) {
  // Very rough approximation for Turkey region
  // Actual values should come from Turkish Geoid Model (TG-xx)
  
  // Base value around 35m
  const base = 35;
  
  // Simple variations (not accurate)
  const latEffect = (lat - 39) * 0.5;  // ~0.5m per degree latitude
  const lonEffect = (lon - 35) * 0.3;  // ~0.3m per degree longitude
  
  return base + latEffect + lonEffect;
}

/**
 * Height information and conversion utilities
 */
export const HeightSystems = {
  ELLIPSOIDAL: {
    name: 'Ellipsoidal Height (h)',
    description: 'Height above the reference ellipsoid. Directly measured by GNSS.',
    unit: 'meters',
    measurementMethod: 'GNSS'
  },
  ORTHOMETRIC: {
    name: 'Orthometric Height (H)',
    description: 'Height above the geoid (Mean Sea Level). Used for practical applications.',
    unit: 'meters',
    measurementMethod: 'Leveling, H = h - N'
  },
  GEOID_UNDULATION: {
    name: 'Geoid Undulation (N)',
    description: 'Height of geoid above ellipsoid. Obtained from geoid models.',
    unit: 'meters',
    models: ['EGM96', 'EGM2008', 'National geoid models']
  }
};

/**
 * Geoid model information
 */
export const GeoidModels = {
  EGM96: {
    name: 'EGM96',
    fullName: 'Earth Gravitational Model 1996',
    resolution: '15 arc-minutes (~30 km)',
    accuracy: '±0.5 to ±1.0 m globally',
    description: 'NASA/NIMA gravitational model, widely used for general applications.',
    degree: 360
  },
  EGM2008: {
    name: 'EGM2008',
    fullName: 'Earth Gravitational Model 2008',
    resolution: '2.5 arc-minutes (~5 km)',
    accuracy: '±0.1 to ±0.3 m in well-surveyed areas',
    description: 'High-resolution global geoid model. Standard for modern applications.',
    degree: 2190
  },
  TG_03: {
    name: 'TG-03',
    fullName: 'Turkish Geoid 2003',
    coverage: 'Turkey',
    accuracy: '±0.05 to ±0.10 m',
    description: 'Turkish national geoid model.',
    notes: 'Hybrid geoid (GPS/leveling + gravimetric)'
  }
};

export default {
  approximateGeoidUndulation,
  turkeyGeoidUndulation,
  HeightSystems,
  GeoidModels
};
