/**
 * Educational Content for Coordinate Systems
 * 
 * This module provides theoretical explanations for the educational mode.
 */

export const EDUCATIONAL_CONTENT = {
  // Coordinate System Types
  coordinateSystems: {
    geographic: {
      title: 'Geographic Coordinate System (GCS)',
      shortDescription: 'Angular coordinates on Earth\'s surface',
      fullDescription: `Geographic coordinates describe a position on Earth using angular measurements:

Latitude (φ): Angle from the equatorial plane, ranging from -90° (South Pole) to +90° (North Pole)

Longitude (λ): Angle from the prime meridian (Greenwich), ranging from -180° to +180°

Ellipsoidal Height (h): Height above the reference ellipsoid in meters

Geographic coordinates are based on a reference ellipsoid and datum. Different datums will give different coordinates for the same physical point.`,
      formula: `Position: P(φ, λ, h)

φ = Latitude (degrees or radians)
λ = Longitude (degrees or radians)  
h = Ellipsoidal height (meters)`,
      usage: 'GNSS positioning, global mapping, navigation'
    },
    
    geocentric: {
      title: 'Geocentric/ECEF Coordinate System',
      shortDescription: 'Cartesian coordinates with origin at Earth\'s center',
      fullDescription: `Earth-Centered Earth-Fixed (ECEF) is a Cartesian coordinate system:

Origin: Earth's center of mass
X-axis: Points toward the intersection of prime meridian and equator
Y-axis: Points toward 90°E longitude on the equator
Z-axis: Points toward the North Pole (parallel to Earth's rotation axis)

ECEF coordinates are used directly in GNSS satellite computations and for datum transformations.`,
      formula: `X = (N + h) × cos(φ) × cos(λ)
Y = (N + h) × cos(φ) × sin(λ)
Z = (N × (1 - e²) + h) × sin(φ)

Where:
N = Radius of curvature in prime vertical
e² = First eccentricity squared`,
      usage: 'GNSS processing, satellite orbits, datum transformations'
    },
    
    projected: {
      title: 'Projected Coordinate System (PCS)',
      shortDescription: 'Flat plane coordinates in linear units',
      fullDescription: `Projected coordinates represent Earth's surface on a flat plane:

Easting (E): Distance east from a reference point (meters)
Northing (N): Distance north from a reference point (meters)

Projections inevitably introduce distortions. Different projections preserve different properties:
- Conformal: Preserves angles and shapes locally (e.g., UTM, Mercator)
- Equal-area: Preserves area (e.g., Albers, Lambert Azimuthal)
- Equidistant: Preserves distances along certain lines`,
      distortions: `No flat map can perfectly represent the curved Earth. All projections distort:
- Scale
- Area  
- Shape
- Direction/angles

The choice of projection depends on the application and region of interest.`,
      usage: 'Topographic mapping, engineering surveys, GIS analysis'
    }
  },
  
  // Ellipsoids
  ellipsoid: {
    title: 'Reference Ellipsoid',
    shortDescription: 'Mathematical model of Earth\'s shape',
    fullDescription: `A reference ellipsoid is a mathematically defined surface that approximates the Earth's shape. It is defined by:

Semi-major axis (a): Equatorial radius (~6,378 km)
Semi-minor axis (b): Polar radius (~6,357 km)
Flattening (f): (a - b) / a ≈ 1/298.257

The ellipsoid is smoother than the actual Earth but provides a computationally practical reference for coordinates.`,
    formula: `Flattening: f = (a - b) / a
First eccentricity: e² = (a² - b²) / a² = 2f - f²
Second eccentricity: e'² = (a² - b²) / b²

Radius of curvature in prime vertical:
N = a / √(1 - e² × sin²φ)

Radius of curvature in meridian:
M = a(1 - e²) / (1 - e² × sin²φ)^(3/2)`,
    comparison: `| Ellipsoid | Semi-major axis (a) | Flattening (1/f) |
|-----------|-------------------|-----------------|
| WGS84 | 6,378,137 m | 298.257223563 |
| GRS80 | 6,378,137 m | 298.257222101 |
| International 1924 | 6,378,388 m | 297.0 |`
  },
  
  // Datums
  datum: {
    title: 'Geodetic Datum',
    shortDescription: 'Reference system for coordinate measurements',
    fullDescription: `A geodetic datum defines the size, shape, and orientation of a reference ellipsoid relative to the Earth:

Components:
1. Reference ellipsoid
2. Origin point and orientation
3. Relationship to Earth's center of mass

Types:
- Local datums: Ellipsoid best-fits a specific region (e.g., ED50, NAD27)
- Geocentric datums: Origin at Earth's center of mass (e.g., WGS84, ITRF)

Using the wrong datum can cause position errors of tens to hundreds of meters!`,
    warning: `CRITICAL: Always know your datum!

Coordinates without datum information are meaningless. The same lat/lon values in different datums represent different physical locations.

Example: A point at 41°N, 29°E
- In WGS84: One location
- In ED50: ~100m different location`,
    transformation: `Datum transformations use various methods:

3-parameter: Translations only (ΔX, ΔY, ΔZ)
- Simple but less accurate
- Suitable for meter-level work

7-parameter (Helmert): Translations + Rotations + Scale
- More accurate
- Standard for sub-meter work

Grid-based (NADCON, NTv2): Local distortion grids
- Highest accuracy
- Region-specific`
  },
  
  // Helmert Transformation
  helmert: {
    title: 'Helmert 7-Parameter Transformation',
    shortDescription: 'Rigorous datum transformation method',
    fullDescription: `The Helmert transformation (also called Bursa-Wolf) uses 7 parameters to transform between datums:

3 Translations (ΔX, ΔY, ΔZ): Shift of origin in meters
3 Rotations (Rx, Ry, Rz): Rotation about each axis in arc-seconds
1 Scale (s): Scale factor in parts per million (ppm)`,
    formula: `[X']   [1+s  -Rz   Ry ] [X]   [ΔX]
[Y'] = [Rz   1+s  -Rx ] [Y] + [ΔY]
[Z']   [-Ry  Rx   1+s ] [Z]   [ΔZ]

Where rotations are in radians and scale is dimensionless (s × 10⁻⁶)`,
    conventions: `Two conventions exist:

Position Vector (EPSG): 
- Rotation is of the position vector
- Used in most software

Coordinate Frame (IERS):
- Rotation is of the coordinate frame
- Opposite rotation signs

Always verify the convention used!`
  },
  
  // Height Systems
  heights: {
    title: 'Height Reference Systems',
    shortDescription: 'Different vertical references',
    fullDescription: `Three main height types exist:

Ellipsoidal Height (h)
- Height above the reference ellipsoid
- Directly measured by GNSS
- Geometric, no physical meaning

Orthometric Height (H)
- Height above the geoid (≈ Mean Sea Level)
- Used for practical applications
- Water flows downhill in H

Geoid Undulation (N)
- Height of geoid above ellipsoid
- Obtained from geoid models
- Connects h and H`,
    formula: `h = H + N

or equivalently:

H = h - N

Where:
h = Ellipsoidal height (from GNSS)
H = Orthometric height (practical height)
N = Geoid undulation (from geoid model)`,
    geoid: `The geoid is an equipotential surface of Earth's gravity field that best fits global Mean Sea Level.

Key properties:
- Water at rest follows the geoid
- Perpendicular to plumb line direction
- Irregular due to mass distribution variations

Geoid models:
- EGM96: ~1m accuracy globally
- EGM2008: ~0.1-0.3m accuracy
- National models: cm-level accuracy`
  },
  
  // UTM
  utm: {
    title: 'Universal Transverse Mercator (UTM)',
    shortDescription: 'Worldwide projection system',
    fullDescription: `UTM divides the world into 60 zones, each 6° wide:

Zone numbering: 1-60 from 180°W to 180°E
Hemispheres: N (north of equator) or S (south)

Parameters:
- Central meridian scale factor: 0.9996
- False Easting: 500,000 m (always positive E)
- False Northing: 0 m (N) or 10,000,000 m (S)

UTM is conformal (preserves angles) and suitable for most mapping applications within a zone.`,
    zoneCalculation: `Zone = floor((λ + 180) / 6) + 1

Example: For λ = 29°E
Zone = floor((29 + 180) / 6) + 1 = 35

Turkey spans UTM zones 35-38`,
    distortion: `Scale distortion in UTM:
- At zone center: k = 0.9996 (4 cm/km reduction)
- At zone edge: k ≈ 1.00096 (1 cm/km enlargement)
- Maximum: ±0.04% within zone

For higher accuracy, use local projections or apply scale factor corrections.`
  },
  
  // Time dependency
  timeDependency: {
    title: 'Time-Dependent Coordinates',
    shortDescription: 'Coordinate changes due to plate tectonics',
    fullDescription: `Modern precise coordinates change over time due to:

Plate tectonics: Crustal plates move 1-10 cm/year
Post-glacial rebound: Land rising after ice age
Local deformation: Earthquakes, subsidence, etc.

ITRF (International Terrestrial Reference Frame):
- Updated every few years (ITRF2014, ITRF2020)
- Coordinates have an epoch (reference time)
- Velocities provided for coordinate propagation`,
    epochFormula: `X(t) = X(t₀) + Vx × (t - t₀)
Y(t) = Y(t₀) + Vy × (t - t₀)
Z(t) = Z(t₀) + Vz × (t - t₀)

Where:
t₀ = Reference epoch
t = Target epoch
V = Velocity (m/year)`,
    practical: `For cm-level work:
- Use consistent epoch for all data
- Transform between epochs if needed
- Consider using plate-fixed frames (ETRS89 in Europe)

Turkey example:
- Moving ~2.5 cm/year northward
- ~2 cm/year westward (Anatolian plate motion)
- TUREF based on ITRF96 at epoch 2005.0`
  }
};

/**
 * Get educational content by topic
 * @param {string} topic - Topic key
 * @returns {Object} - Educational content
 */
export function getEducationalContent(topic) {
  const keys = topic.split('.');
  let content = EDUCATIONAL_CONTENT;
  
  for (const key of keys) {
    if (content[key]) {
      content = content[key];
    } else {
      return null;
    }
  }
  
  return content;
}

/**
 * Get all topic titles
 * @returns {Array} - Array of {key, title} objects
 */
export function getAllTopics() {
  const topics = [];
  
  const extractTopics = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (value.title) {
        topics.push({
          key: prefix ? `${prefix}.${key}` : key,
          title: value.title,
          shortDescription: value.shortDescription
        });
      } else if (typeof value === 'object') {
        extractTopics(value, prefix ? `${prefix}.${key}` : key);
      }
    }
  };
  
  extractTopics(EDUCATIONAL_CONTENT);
  return topics;
}

export default EDUCATIONAL_CONTENT;
