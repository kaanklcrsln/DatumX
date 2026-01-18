/**
 * Datum Definitions and Transformation Parameters
 * 
 * A datum defines the position of the ellipsoid relative to the center of the Earth.
 * It includes:
 * - Reference ellipsoid
 * - Origin point
 * - Orientation
 * 
 * Datum transformations use various methods:
 * - 3-parameter: Translations only (ΔX, ΔY, ΔZ)
 * - 7-parameter (Helmert/Bursa-Wolf): Translations + Rotations + Scale
 * - 14-parameter: Time-dependent transformations
 */

import { ELLIPSOIDS } from './ellipsoids';

/**
 * Datum definitions with transformation parameters to WGS84
 * 
 * Helmert 7-parameter transformation:
 * [X']   [1+s  -rz   ry ] [X]   [tx]
 * [Y'] = [rz   1+s  -rx ] [Y] + [ty]
 * [Z']   [-ry  rx   1+s ] [Z]   [tz]
 * 
 * Where:
 * - tx, ty, tz: Translations in meters
 * - rx, ry, rz: Rotations in arc-seconds (converted to radians)
 * - s: Scale factor in ppm (parts per million)
 */

export const DATUMS = {
  WGS84: {
    name: 'WGS84',
    fullName: 'World Geodetic System 1984',
    ellipsoid: 'WGS84',
    description: 'Global geocentric datum. The standard for GPS/GNSS.',
    type: 'geocentric',
    epoch: null,
    toWGS84: { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 0 },
    accuracy: 'Reference datum'
  },
  
  ITRF2014: {
    name: 'ITRF2014',
    fullName: 'International Terrestrial Reference Frame 2014',
    ellipsoid: 'GRS80',
    description: 'High-precision global reference frame. Used for scientific applications.',
    type: 'geocentric',
    epoch: 2010.0,
    toWGS84: { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 0 },
    accuracy: 'mm-level',
    notes: 'Practically identical to WGS84 at cm level'
  },

  ITRF2020: {
    name: 'ITRF2020',
    fullName: 'International Terrestrial Reference Frame 2020',
    ellipsoid: 'GRS80',
    description: 'Latest ITRF realization. Highest precision global frame.',
    type: 'geocentric',
    epoch: 2015.0,
    toWGS84: { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 0 },
    accuracy: 'mm-level'
  },

  ETRS89: {
    name: 'ETRS89',
    fullName: 'European Terrestrial Reference System 1989',
    ellipsoid: 'GRS80',
    description: 'European regional datum fixed to Eurasian plate at epoch 1989.0.',
    type: 'plate-fixed',
    epoch: 1989.0,
    toWGS84: { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 0 },
    accuracy: 'cm-level',
    notes: 'Coincided with ITRF89 at epoch 1989.0'
  },

  TUREF: {
    name: 'TUREF',
    fullName: 'Turkish National Reference Frame',
    ellipsoid: 'GRS80',
    description: 'Turkish national geodetic reference frame based on ITRF96.',
    type: 'geocentric',
    epoch: 2005.0,
    toWGS84: { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 0 },
    accuracy: 'cm-level',
    notes: 'CORS-TR network based'
  },

  ED50: {
    name: 'ED50',
    fullName: 'European Datum 1950',
    ellipsoid: 'ED50',
    description: 'Historical European datum. Widely used for mapping until ETRS89.',
    type: 'local',
    toWGS84: {
      // Turkey parameters (approximate, regional variations exist)
      tx: -84.0,
      ty: -103.0,
      tz: -127.0,
      rx: 0,
      ry: 0,
      rz: 0,
      s: 0
    },
    accuracy: '5-10 meters',
    notes: 'Parameters vary by country/region'
  },

  ED50_Turkey: {
    name: 'ED50 (Turkey)',
    fullName: 'European Datum 1950 - Turkey Parameters',
    ellipsoid: 'ED50',
    description: 'ED50 with Turkey-specific transformation parameters.',
    type: 'local',
    toWGS84: {
      tx: -87.0,
      ty: -98.0,
      tz: -121.0,
      rx: 0,
      ry: 0,
      rz: 0,
      s: 0
    },
    accuracy: '2-5 meters'
  },

  NAD27: {
    name: 'NAD27',
    fullName: 'North American Datum 1927',
    ellipsoid: 'Clarke1866',
    description: 'Historical North American datum. Origin at Meades Ranch, Kansas.',
    type: 'local',
    toWGS84: {
      // CONUS average parameters
      tx: -8,
      ty: 160,
      tz: 176,
      rx: 0,
      ry: 0,
      rz: 0,
      s: 0
    },
    accuracy: '5-15 meters',
    notes: 'Use NADCON for precise conversions'
  },

  NAD83: {
    name: 'NAD83',
    fullName: 'North American Datum 1983',
    ellipsoid: 'GRS80',
    description: 'North American geocentric datum. Multiple realizations exist.',
    type: 'geocentric',
    toWGS84: { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 0 },
    accuracy: '1-2 meters',
    notes: 'NAD83(2011) is current realization'
  },

  OSGB36: {
    name: 'OSGB36',
    fullName: 'Ordnance Survey Great Britain 1936',
    ellipsoid: 'Airy1830',
    description: 'British national datum. Used for UK Ordnance Survey maps.',
    type: 'local',
    toWGS84: {
      tx: 446.448,
      ty: -125.157,
      tz: 542.060,
      rx: 0.1502,
      ry: 0.2470,
      rz: 0.8421,
      s: -20.4894
    },
    accuracy: '5-7 meters',
    notes: 'Use OSTN15 for sub-meter accuracy'
  },

  Tokyo: {
    name: 'Tokyo',
    fullName: 'Tokyo Datum',
    ellipsoid: 'Bessel1841',
    description: 'Japanese geodetic datum. Used until 2002.',
    type: 'local',
    toWGS84: {
      tx: -148,
      ty: 507,
      tz: 685,
      rx: 0,
      ry: 0,
      rz: 0,
      s: 0
    },
    accuracy: '3-10 meters'
  },

  Pulkovo1942: {
    name: 'Pulkovo 1942',
    fullName: 'Pulkovo 1942',
    ellipsoid: 'Krassovsky1940',
    description: 'Soviet/Russian geodetic datum. Used across former USSR.',
    type: 'local',
    toWGS84: {
      tx: 23.92,
      ty: -141.27,
      tz: -80.9,
      rx: 0,
      ry: 0.35,
      rz: 0.82,
      s: -0.12
    },
    accuracy: '2-5 meters'
  },

  HD72: {
    name: 'HD72',
    fullName: 'Hungarian Datum 1972',
    ellipsoid: 'GRS67',
    description: 'Hungarian national datum.',
    type: 'local',
    toWGS84: {
      tx: 52.17,
      ty: -71.82,
      tz: -14.9,
      rx: 0,
      ry: 0,
      rz: 0,
      s: 0
    },
    accuracy: '2-3 meters'
  }
};

/**
 * Get datum by name
 * @param {string} name - Datum name
 * @returns {Object} - Datum object
 */
export function getDatum(name) {
  return DATUMS[name] || null;
}

/**
 * Get ellipsoid for a datum
 * @param {string} datumName - Datum name
 * @returns {Object} - Ellipsoid object
 */
export function getEllipsoidForDatum(datumName) {
  const datum = getDatum(datumName);
  if (!datum) return null;
  return ELLIPSOIDS[datum.ellipsoid] || null;
}

/**
 * Get transformation parameters between two datums
 * @param {string} fromDatum - Source datum name
 * @param {string} toDatum - Target datum name
 * @returns {Object} - 7-parameter transformation
 */
export function getTransformationParams(fromDatum, toDatum) {
  // If same datum, no transformation needed
  if (fromDatum === toDatum) {
    return { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, s: 0 };
  }

  const source = getDatum(fromDatum);
  const target = getDatum(toDatum);

  if (!source || !target) return null;

  // Direct transformation to WGS84
  if (toDatum === 'WGS84') {
    return source.toWGS84;
  }

  // Transformation from WGS84
  if (fromDatum === 'WGS84') {
    // Inverse transformation
    const params = target.toWGS84;
    return {
      tx: -params.tx,
      ty: -params.ty,
      tz: -params.tz,
      rx: -params.rx,
      ry: -params.ry,
      rz: -params.rz,
      s: -params.s
    };
  }

  // Transform via WGS84
  // First: source -> WGS84, then WGS84 -> target
  return {
    viaWGS84: true,
    toWGS84: source.toWGS84,
    fromWGS84: {
      tx: -target.toWGS84.tx,
      ty: -target.toWGS84.ty,
      tz: -target.toWGS84.tz,
      rx: -target.toWGS84.rx,
      ry: -target.toWGS84.ry,
      rz: -target.toWGS84.rz,
      s: -target.toWGS84.s
    }
  };
}

export default DATUMS;
