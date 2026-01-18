/**
 * Coordinate Transformation Functions
 * 
 * This module provides comprehensive coordinate transformation capabilities:
 * 
 * 1. Geographic (φ, λ, h) ↔ Geocentric (X, Y, Z) conversions
 * 2. Datum transformations using Helmert 7-parameter model
 * 3. Projection transformations (Geographic ↔ Projected)
 * 4. Height transformations (ellipsoidal ↔ orthometric)
 * 
 * Reference: IERS Conventions, EPSG Guidance Notes
 */

import { getEllipsoidParams, ELLIPSOIDS } from './ellipsoids';
import { DATUMS, getTransformationParams } from './datums';
import proj4 from 'proj4';

// Degree/Radian conversion
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const ARCSEC2RAD = Math.PI / (180 * 3600); // Arc-seconds to radians

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number}
 */
export function toRadians(degrees) {
  return degrees * DEG2RAD;
}

/**
 * Convert radians to degrees
 * @param {number} radians 
 * @returns {number}
 */
export function toDegrees(radians) {
  return radians * RAD2DEG;
}

/**
 * Convert degrees to DMS (Degrees, Minutes, Seconds)
 * @param {number} decimal - Decimal degrees
 * @returns {Object} - {degrees, minutes, seconds, direction}
 */
export function decimalToDMS(decimal, isLatitude = true) {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;
  
  let direction;
  if (isLatitude) {
    direction = decimal >= 0 ? 'N' : 'S';
  } else {
    direction = decimal >= 0 ? 'E' : 'W';
  }
  
  return { degrees, minutes, seconds, direction };
}

/**
 * Convert DMS to decimal degrees
 * @param {number} degrees 
 * @param {number} minutes 
 * @param {number} seconds 
 * @param {string} direction - N, S, E, W
 * @returns {number}
 */
export function dmsToDecimal(degrees, minutes, seconds, direction) {
  let decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
}

/**
 * Format DMS as string
 * @param {Object} dms - DMS object
 * @returns {string}
 */
export function formatDMS(dms) {
  return `${dms.degrees}° ${dms.minutes}' ${dms.seconds.toFixed(4)}" ${dms.direction}`;
}

// ============================================================
// GEOGRAPHIC ↔ GEOCENTRIC (ECEF) TRANSFORMATIONS
// ============================================================

/**
 * Convert Geographic coordinates to Geocentric (ECEF) coordinates
 * 
 * Formulas:
 * X = (N + h) * cos(φ) * cos(λ)
 * Y = (N + h) * cos(φ) * sin(λ)
 * Z = (N(1-e²) + h) * sin(φ)
 * 
 * Where N is the radius of curvature in prime vertical
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} h - Ellipsoidal height in meters
 * @param {Object} ellipsoid - Reference ellipsoid
 * @returns {Object} - {x, y, z} in meters
 */
export function geographicToGeocentric(lat, lon, h, ellipsoid) {
  const params = getEllipsoidParams(ellipsoid);
  
  const phi = toRadians(lat);
  const lambda = toRadians(lon);
  
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);
  
  // Radius of curvature in prime vertical
  const N = params.a / Math.sqrt(1 - params.e2 * sinPhi * sinPhi);
  
  const x = (N + h) * cosPhi * cosLambda;
  const y = (N + h) * cosPhi * sinLambda;
  const z = (N * (1 - params.e2) + h) * sinPhi;
  
  return { x, y, z };
}

/**
 * Convert Geocentric (ECEF) coordinates to Geographic coordinates
 * 
 * Uses iterative Bowring's method for high accuracy
 * 
 * @param {number} x - X coordinate in meters
 * @param {number} y - Y coordinate in meters
 * @param {number} z - Z coordinate in meters
 * @param {Object} ellipsoid - Reference ellipsoid
 * @returns {Object} - {lat, lon, h} - lat/lon in degrees, h in meters
 */
export function geocentricToGeographic(x, y, z, ellipsoid) {
  const params = getEllipsoidParams(ellipsoid);
  const a = params.a;
  const b = params.b;
  const e2 = params.e2;
  const ep2 = params.ep2;
  
  // Longitude
  const lambda = Math.atan2(y, x);
  
  // Distance from Z-axis
  const p = Math.sqrt(x * x + y * y);
  
  // Initial approximation using Bowring's formula
  let theta = Math.atan2(z * a, p * b);
  
  // Iterative solution for latitude
  let phi = Math.atan2(
    z + ep2 * b * Math.pow(Math.sin(theta), 3),
    p - e2 * a * Math.pow(Math.cos(theta), 3)
  );
  
  // Iterate for higher precision
  for (let i = 0; i < 10; i++) {
    const sinPhi = Math.sin(phi);
    const N = a / Math.sqrt(1 - e2 * sinPhi * sinPhi);
    const newPhi = Math.atan2(z + e2 * N * sinPhi, p);
    
    if (Math.abs(newPhi - phi) < 1e-12) break;
    phi = newPhi;
  }
  
  // Height
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const N = a / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  
  let h;
  if (Math.abs(cosPhi) > 1e-10) {
    h = p / cosPhi - N;
  } else {
    h = Math.abs(z) / Math.abs(sinPhi) - N * (1 - e2);
  }
  
  return {
    lat: toDegrees(phi),
    lon: toDegrees(lambda),
    h: h
  };
}

// ============================================================
// HELMERT 7-PARAMETER TRANSFORMATION
// ============================================================

/**
 * Apply Helmert 7-parameter transformation
 * 
 * Bursa-Wolf model (Position Vector convention):
 * [X']   [tx]   [1+s  -rz   ry ] [X]
 * [Y'] = [ty] + [rz   1+s  -rx ] [Y]
 * [Z']   [tz]   [-ry  rx   1+s ] [Z]
 * 
 * Where:
 * - tx, ty, tz: Translations (meters)
 * - rx, ry, rz: Rotations (arc-seconds, converted to radians)
 * - s: Scale factor (ppm, converted to dimensionless)
 * 
 * @param {Object} xyz - {x, y, z} source coordinates in meters
 * @param {Object} params - Transformation parameters
 * @returns {Object} - {x, y, z} transformed coordinates
 */
export function helmertTransformation(xyz, params) {
  const { x, y, z } = xyz;
  const { tx, ty, tz, rx, ry, rz, s } = params;
  
  // Convert rotations from arc-seconds to radians
  const rxRad = rx * ARCSEC2RAD;
  const ryRad = ry * ARCSEC2RAD;
  const rzRad = rz * ARCSEC2RAD;
  
  // Convert scale from ppm to dimensionless
  const scale = 1 + s * 1e-6;
  
  // Apply transformation (Bursa-Wolf Position Vector convention)
  const xp = tx + scale * (x - rzRad * y + ryRad * z);
  const yp = ty + scale * (rzRad * x + y - rxRad * z);
  const zp = tz + scale * (-ryRad * x + rxRad * y + z);
  
  return { x: xp, y: yp, z: zp };
}

/**
 * Inverse Helmert transformation
 * @param {Object} xyz - {x, y, z} coordinates
 * @param {Object} params - Transformation parameters
 * @returns {Object} - {x, y, z} inverse transformed coordinates
 */
export function inverseHelmertTransformation(xyz, params) {
  const inverseParams = {
    tx: -params.tx,
    ty: -params.ty,
    tz: -params.tz,
    rx: -params.rx,
    ry: -params.ry,
    rz: -params.rz,
    s: -params.s
  };
  
  return helmertTransformation(xyz, inverseParams);
}

// ============================================================
// MOLODENSKY TRANSFORMATION
// ============================================================

/**
 * Molodensky transformation (3-parameter, abridged)
 * 
 * Direct transformation between geographic coordinates without
 * going through geocentric. Less accurate than 7-parameter.
 * 
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} h - Height in meters
 * @param {Object} fromEllipsoid - Source ellipsoid
 * @param {Object} toEllipsoid - Target ellipsoid
 * @param {Object} shifts - {dx, dy, dz} translation in meters
 * @returns {Object} - {lat, lon, h}
 */
export function molodenskyTransformation(lat, lon, h, fromEllipsoid, toEllipsoid, shifts) {
  const phi = toRadians(lat);
  const lambda = toRadians(lon);
  
  const fromParams = getEllipsoidParams(fromEllipsoid);
  const toParams = getEllipsoidParams(toEllipsoid);
  
  const da = toParams.a - fromParams.a;
  const df = toParams.f - fromParams.f;
  
  const { dx, dy, dz } = shifts;
  
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinLambda = Math.sin(lambda);
  const cosLambda = Math.cos(lambda);
  const sin2Phi = Math.sin(2 * phi);
  
  const a = fromParams.a;
  const f = fromParams.f;
  const e2 = fromParams.e2;
  
  // Radii of curvature
  const Rm = a * (1 - e2) / Math.pow(1 - e2 * sinPhi * sinPhi, 1.5);
  const Rn = a / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  
  // Latitude shift
  const dPhi = ((-dx * sinPhi * cosLambda - dy * sinPhi * sinLambda + dz * cosPhi)
    + da * (Rn * e2 * sinPhi * cosPhi) / a
    + df * (Rm / (1 - f) + Rn * (1 - f)) * sinPhi * cosPhi) / (Rm + h);
  
  // Longitude shift
  const dLambda = (-dx * sinLambda + dy * cosLambda) / ((Rn + h) * cosPhi);
  
  // Height shift
  const dh = dx * cosPhi * cosLambda + dy * cosPhi * sinLambda + dz * sinPhi
    - da * a / Rn + df * (1 - f) * Rn * sinPhi * sinPhi;
  
  return {
    lat: lat + toDegrees(dPhi),
    lon: lon + toDegrees(dLambda),
    h: h + dh
  };
}

// ============================================================
// DATUM TRANSFORMATION
// ============================================================

/**
 * Transform coordinates between datums
 * 
 * Process:
 * 1. Convert geographic to geocentric (if needed)
 * 2. Apply Helmert transformation
 * 3. Convert back to geographic (if needed)
 * 
 * @param {Object} coords - {lat, lon, h} or {x, y, z}
 * @param {string} fromDatum - Source datum name
 * @param {string} toDatum - Target datum name
 * @param {string} inputType - 'geographic' or 'geocentric'
 * @returns {Object} - Transformed coordinates
 */
export function transformDatum(coords, fromDatum, toDatum, inputType = 'geographic') {
  if (fromDatum === toDatum) {
    return { ...coords };
  }
  
  const fromDatumObj = DATUMS[fromDatum];
  const toDatumObj = DATUMS[toDatum];
  
  if (!fromDatumObj || !toDatumObj) {
    throw new Error(`Unknown datum: ${fromDatum} or ${toDatum}`);
  }
  
  const fromEllipsoid = ELLIPSOIDS[fromDatumObj.ellipsoid];
  const toEllipsoid = ELLIPSOIDS[toDatumObj.ellipsoid];
  
  // Get transformation parameters
  const transParams = getTransformationParams(fromDatum, toDatum);
  
  // Convert to geocentric if input is geographic
  let xyz;
  if (inputType === 'geographic') {
    xyz = geographicToGeocentric(coords.lat, coords.lon, coords.h || 0, fromEllipsoid);
  } else {
    xyz = { x: coords.x, y: coords.y, z: coords.z };
  }
  
  // Apply transformation(s)
  let transformedXYZ;
  if (transParams.viaWGS84) {
    // Two-step transformation via WGS84
    const toWGS84 = helmertTransformation(xyz, transParams.toWGS84);
    transformedXYZ = helmertTransformation(toWGS84, transParams.fromWGS84);
  } else {
    transformedXYZ = helmertTransformation(xyz, transParams);
  }
  
  // Convert back to geographic if that was the input type
  if (inputType === 'geographic') {
    return geocentricToGeographic(transformedXYZ.x, transformedXYZ.y, transformedXYZ.z, toEllipsoid);
  }
  
  return transformedXYZ;
}

// ============================================================
// PROJECTION TRANSFORMATIONS (using proj4)
// ============================================================

// Define common coordinate systems for proj4
proj4.defs([
  ['EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs'], // WGS84 Geographic
  ['EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +no_defs'], // Web Mercator
  ['EPSG:4258', '+proj=longlat +ellps=GRS80 +no_defs'], // ETRS89 Geographic
]);

// Add UTM zone definitions
for (let zone = 1; zone <= 60; zone++) {
  proj4.defs(`EPSG:${32600 + zone}`, `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`);
  proj4.defs(`EPSG:${32700 + zone}`, `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs`);
}

// Add Turkish TM projections
proj4.defs('ED50_TM30', '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs');
proj4.defs('ED50_TM33', '+proj=tmerc +lat_0=0 +lon_0=33 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs');
proj4.defs('ED50_TM36', '+proj=tmerc +lat_0=0 +lon_0=36 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs');
proj4.defs('ED50_TM39', '+proj=tmerc +lat_0=0 +lon_0=39 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs');
proj4.defs('ED50_TM42', '+proj=tmerc +lat_0=0 +lon_0=42 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs');
proj4.defs('ED50_TM45', '+proj=tmerc +lat_0=0 +lon_0=45 +k=1 +x_0=500000 +y_0=0 +ellps=intl +units=m +no_defs');

// TUREF TM projections
proj4.defs('TUREF_TM30', '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
proj4.defs('TUREF_TM33', '+proj=tmerc +lat_0=0 +lon_0=33 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
proj4.defs('TUREF_TM36', '+proj=tmerc +lat_0=0 +lon_0=36 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
proj4.defs('TUREF_TM39', '+proj=tmerc +lat_0=0 +lon_0=39 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
proj4.defs('TUREF_TM42', '+proj=tmerc +lat_0=0 +lon_0=42 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs');
proj4.defs('TUREF_TM45', '+proj=tmerc +lat_0=0 +lon_0=45 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs');

/**
 * Project geographic coordinates to plane coordinates
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {string} targetCRS - Target coordinate reference system
 * @returns {Object} - {easting, northing}
 */
export function projectCoordinates(lat, lon, targetCRS) {
  const result = proj4('EPSG:4326', targetCRS, [lon, lat]);
  return {
    easting: result[0],
    northing: result[1]
  };
}

/**
 * Unproject plane coordinates to geographic
 * @param {number} easting - Easting in meters
 * @param {number} northing - Northing in meters
 * @param {string} sourceCRS - Source coordinate reference system
 * @returns {Object} - {lat, lon}
 */
export function unprojectCoordinates(easting, northing, sourceCRS) {
  const result = proj4(sourceCRS, 'EPSG:4326', [easting, northing]);
  return {
    lon: result[0],
    lat: result[1]
  };
}

/**
 * Transform between any two coordinate reference systems
 * @param {number} x - X coordinate (lon or easting)
 * @param {number} y - Y coordinate (lat or northing)
 * @param {string} fromCRS - Source CRS
 * @param {string} toCRS - Target CRS
 * @returns {Object} - {x, y}
 */
export function transformCRS(x, y, fromCRS, toCRS) {
  const result = proj4(fromCRS, toCRS, [x, y]);
  return {
    x: result[0],
    y: result[1]
  };
}

// ============================================================
// HEIGHT TRANSFORMATIONS
// ============================================================

/**
 * Convert ellipsoidal height to orthometric height
 * 
 * H = h - N
 * 
 * Where:
 * - H: Orthometric height (above geoid/MSL)
 * - h: Ellipsoidal height (above ellipsoid)
 * - N: Geoid undulation (geoid height above ellipsoid)
 * 
 * @param {number} ellipsoidalHeight - h in meters
 * @param {number} geoidUndulation - N in meters
 * @returns {number} - H in meters
 */
export function ellipsoidalToOrthometric(ellipsoidalHeight, geoidUndulation) {
  return ellipsoidalHeight - geoidUndulation;
}

/**
 * Convert orthometric height to ellipsoidal height
 * 
 * h = H + N
 * 
 * @param {number} orthometricHeight - H in meters
 * @param {number} geoidUndulation - N in meters
 * @returns {number} - h in meters
 */
export function orthometricToEllipsoidal(orthometricHeight, geoidUndulation) {
  return orthometricHeight + geoidUndulation;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Calculate geodesic distance between two points (Vincenty formula)
 * @param {number} lat1 - Start latitude in degrees
 * @param {number} lon1 - Start longitude in degrees
 * @param {number} lat2 - End latitude in degrees
 * @param {number} lon2 - End longitude in degrees
 * @param {Object} ellipsoid - Reference ellipsoid
 * @returns {Object} - {distance, azimuth12, azimuth21}
 */
export function vincentyDistance(lat1, lon1, lat2, lon2, ellipsoid = ELLIPSOIDS.WGS84) {
  const params = getEllipsoidParams(ellipsoid);
  const a = params.a;
  const b = params.b;
  const f = params.f;
  
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const L = toRadians(lon2 - lon1);
  
  const U1 = Math.atan((1 - f) * Math.tan(phi1));
  const U2 = Math.atan((1 - f) * Math.tan(phi2));
  
  const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
  
  let lambda = L;
  let lambdaP;
  let iterLimit = 100;
  
  let sinSigma, cosSigma, sigma, sinAlpha, cos2Alpha, cos2SigmaM;
  
  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    
    sinSigma = Math.sqrt(
      Math.pow(cosU2 * sinLambda, 2) +
      Math.pow(cosU1 * sinU2 - sinU1 * cosU2 * cosLambda, 2)
    );
    
    if (sinSigma === 0) return { distance: 0, azimuth12: 0, azimuth21: 0 };
    
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    
    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cos2Alpha = 1 - sinAlpha * sinAlpha;
    
    cos2SigmaM = cos2Alpha !== 0 ? cosSigma - 2 * sinU1 * sinU2 / cos2Alpha : 0;
    
    const C = f / 16 * cos2Alpha * (4 + f * (4 - 3 * cos2Alpha));
    
    lambdaP = lambda;
    lambda = L + (1 - C) * f * sinAlpha * (
      sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM))
    );
    
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
  
  if (iterLimit === 0) {
    console.warn('Vincenty formula failed to converge');
    return null;
  }
  
  const uSq = cos2Alpha * (a * a - b * b) / (b * b);
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  
  const deltaSigma = B * sinSigma * (
    cos2SigmaM + B / 4 * (
      cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
      B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)
    )
  );
  
  const distance = b * A * (sigma - deltaSigma);
  
  // Forward azimuth
  const azimuth12 = Math.atan2(
    cosU2 * Math.sin(lambda),
    cosU1 * sinU2 - sinU1 * cosU2 * Math.cos(lambda)
  );
  
  // Reverse azimuth
  const azimuth21 = Math.atan2(
    cosU1 * Math.sin(lambda),
    -sinU1 * cosU2 + cosU1 * sinU2 * Math.cos(lambda)
  );
  
  return {
    distance: distance,
    azimuth12: toDegrees(azimuth12),
    azimuth21: toDegrees(azimuth21)
  };
}

/**
 * Get UTM zone from longitude
 * @param {number} longitude - Longitude in degrees
 * @returns {number} - UTM zone number
 */
export function getUTMZone(longitude) {
  return Math.floor((longitude + 180) / 6) + 1;
}

/**
 * Get UTM EPSG code
 * @param {number} zone - UTM zone number
 * @param {boolean} isNorth - True for northern hemisphere
 * @returns {string} - EPSG code
 */
export function getUTMEPSG(zone, isNorth = true) {
  return `EPSG:${isNorth ? 32600 + zone : 32700 + zone}`;
}

export {
  proj4,
  DEG2RAD,
  RAD2DEG,
  ARCSEC2RAD
};
