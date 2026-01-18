# DatumX

Coordinate transformation system for geomatics engineers and GIS professionals.


[![Join Us](https://img.shields.io/badge/DatumX-white?style=for-the-badge&logo=github)](https://kaanklcrsln.github.io/DatumX)

<img width="1920" height="1080" alt="banner" src="https://github.com/user-attachments/assets/9379cd40-69df-4006-b87b-d84af2f0f159" />

## Features

- **Coordinate Systems**: Geographic (GCS), Geocentric (ECEF), Projected (PCS)
- **Datum Transformations**: WGS84, ED50, TUREF, ITRF, NAD27/83, and more
- **Projections**: UTM zones, Turkish TM projections, Web Mercator
- **Interactive Map**: Leaflet integration with satellite/OSM basemaps
- **Educational Mode**: Comprehensive geodetic theory and formulas
- **Batch Processing**: Transform multiple coordinates at once

## Tech Stack

- **Frontend**: React 19.2.0 + Vite 7.x
- **Mapping**: Leaflet + react-leaflet
- **Transformations**: Proj4js + custom Helmert implementations
- **Styling**: Custom CSS with responsive design
- **Deployment**: GitHub Pages ready

## Installation

```bash
# Clone repository
git clone https://github.com/kaanklcrsln/DatumX.git
cd DatumX

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Usage

1. Select source and target coordinate systems
2. Enter coordinates in the input panel
3. View results instantly with map visualization
4. Access educational content for geodetic concepts
5. Export results or use batch mode for multiple points

## Supported Systems

- **Datums**: WGS84, ITRF2014/2020, ETRS89, TUREF, ED50, NAD27/83, OSGB36, Tokyo
- **Projections**: UTM (zones 1-60), Turkish TM (30°-45°), Web Mercator, LCC
- **Heights**: Ellipsoidal, orthometric, geoid undulations

Built with precision for professional surveying and GIS applications.
