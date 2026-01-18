/**
 * Ellipsoid Definitions
 * Reference ellipsoids used in geodetic computations
 * 
 * Key parameters:
 * - a: Semi-major axis (equatorial radius) in meters
 * - b: Semi-minor axis (polar radius) in meters
 * - f: Flattening = (a - b) / a
 * - e: First eccentricity
 * - e2: First eccentricity squared = (a² - b²) / a²
 */

export const ELLIPSOIDS = {
  WGS84: {
    name: 'WGS84',
    fullName: 'World Geodetic System 1984',
    a: 6378137.0,
    f: 1 / 298.257223563,
    description: 'Global reference ellipsoid used by GPS/GNSS systems. Standard for worldwide positioning.',
    usage: 'GNSS, Global mapping, Aviation, Maritime navigation',
    epoch: 1984
  },
  GRS80: {
    name: 'GRS80',
    fullName: 'Geodetic Reference System 1980',
    a: 6378137.0,
    f: 1 / 298.257222101,
    description: 'Adopted by IUGG in 1979. Nearly identical to WGS84, basis for many national systems.',
    usage: 'ITRF, ETRS89, National geodetic networks',
    epoch: 1980
  },
  ED50: {
    name: 'International 1924 (Hayford)',
    fullName: 'European Datum 1950 Ellipsoid',
    a: 6378388.0,
    f: 1 / 297.0,
    description: 'Historical European ellipsoid. Used for ED50 datum, now largely replaced by ETRS89.',
    usage: 'Legacy European surveys, ED50 datum',
    epoch: 1924
  },
  Bessel1841: {
    name: 'Bessel 1841',
    fullName: 'Bessel 1841',
    a: 6377397.155,
    f: 1 / 299.1528128,
    description: 'German ellipsoid, historically used in Central Europe and parts of Asia.',
    usage: 'Germany, Austria, Switzerland, Indonesia, Japan (historical)',
    epoch: 1841
  },
  Clarke1866: {
    name: 'Clarke 1866',
    fullName: 'Clarke 1866',
    a: 6378206.4,
    f: 1 / 294.9786982,
    description: 'North American ellipsoid, basis for NAD27.',
    usage: 'NAD27, North American surveys (historical)',
    epoch: 1866
  },
  Clarke1880: {
    name: 'Clarke 1880',
    fullName: 'Clarke 1880 (IGN)',
    a: 6378249.2,
    f: 1 / 293.466021,
    description: 'Used in France and Africa.',
    usage: 'African surveys, French territories',
    epoch: 1880
  },
  Krassovsky1940: {
    name: 'Krassovsky 1940',
    fullName: 'Krassovsky 1940',
    a: 6378245.0,
    f: 1 / 298.3,
    description: 'Soviet/Russian ellipsoid, used for Pulkovo datums.',
    usage: 'Russia, Eastern Europe, China (historical)',
    epoch: 1940
  },
  Airy1830: {
    name: 'Airy 1830',
    fullName: 'Airy 1830',
    a: 6377563.396,
    f: 1 / 299.3249646,
    description: 'British ellipsoid, used for OSGB36.',
    usage: 'Great Britain (Ordnance Survey)',
    epoch: 1830
  }
};

/**
 * Calculate derived ellipsoid parameters
 * @param {Object} ellipsoid - Ellipsoid object with a and f
 * @returns {Object} - Extended ellipsoid parameters
 */
export function getEllipsoidParams(ellipsoid) {
  const a = ellipsoid.a;
  const f = ellipsoid.f;
  const b = a * (1 - f);                    // Semi-minor axis
  const e2 = 2 * f - f * f;                 // First eccentricity squared
  const e = Math.sqrt(e2);                  // First eccentricity
  const ep2 = e2 / (1 - e2);                // Second eccentricity squared
  const ep = Math.sqrt(ep2);                // Second eccentricity
  const c = a * a / b;                      // Polar radius of curvature
  
  return {
    ...ellipsoid,
    b,
    e,
    e2,
    ep,
    ep2,
    c
  };
}

/**
 * Calculate radius of curvature in the prime vertical (N)
 * N = a / sqrt(1 - e² * sin²(φ))
 * @param {number} lat - Latitude in radians
 * @param {Object} ellipsoid - Ellipsoid parameters
 * @returns {number} - Radius of curvature in meters
 */
export function radiusOfCurvatureN(lat, ellipsoid) {
  const params = getEllipsoidParams(ellipsoid);
  const sinLat = Math.sin(lat);
  return params.a / Math.sqrt(1 - params.e2 * sinLat * sinLat);
}

/**
 * Calculate radius of curvature in the meridian (M)
 * M = a(1 - e²) / (1 - e² * sin²(φ))^(3/2)
 * @param {number} lat - Latitude in radians
 * @param {Object} ellipsoid - Ellipsoid parameters
 * @returns {number} - Radius of curvature in meters
 */
export function radiusOfCurvatureM(lat, ellipsoid) {
  const params = getEllipsoidParams(ellipsoid);
  const sinLat = Math.sin(lat);
  const W = Math.sqrt(1 - params.e2 * sinLat * sinLat);
  return params.a * (1 - params.e2) / (W * W * W);
}

/**
 * Calculate mean radius of curvature
 * R = sqrt(M * N)
 * @param {number} lat - Latitude in radians
 * @param {Object} ellipsoid - Ellipsoid parameters
 * @returns {number} - Mean radius in meters
 */
export function meanRadius(lat, ellipsoid) {
  const M = radiusOfCurvatureM(lat, ellipsoid);
  const N = radiusOfCurvatureN(lat, ellipsoid);
  return Math.sqrt(M * N);
}

export default ELLIPSOIDS;
