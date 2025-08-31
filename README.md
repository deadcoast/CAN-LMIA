# 🇨🇦 LMIA Database: Canadian Labour Market Impact Assessment Visualization

<div align="center">

![LMIA Database Homepage](assets/LMIAhome.png)

*A comprehensive visualization platform for Canadian Labour Market Impact Assessment (LMIA) data, featuring interactive maps, statistical analysis, and real-time data processing.*

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green.svg)](https://leafletjs.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

## Overview

The LMIA Database is a sophisticated web application designed to visualize and analyze Canadian Labour Market Impact Assessment data. Built with modern web technologies, it provides interactive mapping capabilities, comprehensive statistical analysis, and real-time data processing for over **17,000+ employers** across Canada.

### Key Features

- **Interactive Mapping**: Real-time visualization of employer locations with advanced clustering
- **Canadian Geographic Names Integration**: Accurate geocoding using official Canadian Geographic Names Database (25,228+ locations)
- **Statistical Dashboard**: Comprehensive analytics with charts and data visualizations  
- **High Performance**: Optimized for handling large datasets with Web Workers and server-side processing
- **Advanced Filtering**: Search and filter by location, occupation, program type, and time period
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **Real-time Updates**: Dynamic data loading with viewport-based optimization
- **One-Command Startup**: Automated scripts for easy development setup
- **Cross-Platform**: Works seamlessly on macOS, Linux, and Windows
- **Intelligent Caching**: In-memory geocoding cache for fast coordinate lookups

## Graph View Statistics per Database

![LMIA Statistics Dashboard](assets/LMIAgraph.png)
*Comprehensive statistics dashboard featuring labor market analytics, occupation distributions, and provincial breakdowns*

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/can-lmia.git
   cd can-lmia
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the application (Recommended)**

   ```bash
   # One-command startup (automatically starts both servers)
   ./start.sh          # macOS/Linux
   start.bat           # Windows
   
   # Or using npm scripts
   npm run start:all   # macOS/Linux
   npm run start:all:win # Windows
   ```

4. **Access the application**

   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3001](http://localhost:3001)

### Alternative: Manual Startup

If you prefer to start servers manually:

```bash
# Terminal 1: Start the backend server
npm start

# Terminal 2: Start the frontend development server
npm run dev
```

## Automated Startup Features

The project includes powerful startup scripts that handle everything automatically:

- **Dependency Check**: Verifies Node.js and npm installation
- **Auto-Install**: Runs `npm install` if needed
- **Port Management**: Automatically kills existing processes on ports 3001 and 5173
- **Health Monitoring**: Waits for both servers to be ready
- **Auto-Open Browser**: Opens the application automatically
- **Comprehensive Logging**: Creates detailed log files for debugging
- **Clean Shutdown**: Properly stops all processes on exit
- **Canadian Geo Names Loading**: Automatically loads and indexes the Canadian Geographic Names Database at startup

For detailed startup information, see [STARTUP.md](STARTUP.md).

## Architecture

### Frontend Stack

- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Leaflet** with React-Leaflet for interactive mapping
- **Tailwind CSS** for responsive, utility-first styling
- **Recharts** for data visualization and analytics
- **React Router** for client-side routing
- **Lucide React** for modern iconography

### Backend Stack

- **Node.js** with Express.js for API server
- **XLSX** for Excel file processing
- **CORS** enabled for cross-origin requests
- **Canadian Geographic Names Database** integration for accurate geocoding
- **In-memory caching** for optimized geocoding performance

### Performance Optimizations

- **Web Workers** for background clustering calculations
- **Server-side clustering** for efficient data processing
- **Viewport-based filtering** to load only visible data
- **Chunked loading** to prevent UI blocking
- **Canvas rendering** for high-performance marker display
- **Throttled updates** to prevent infinite API loops
- **Pre-loaded geocoding database** for instant coordinate lookups
- **Intelligent caching system** for geocoding results

## Project Structure

```text
can-lmia/
├── public/
│   └── data/
│       ├── LMIA-DATA/           # Excel data files by year/quarter
│       └── CAN_GEO_NAMES/       # Canadian Geographic Names Database
├── src/
│   ├── components/              # React components
│   │   ├── ComprehensiveMapView.tsx    # Main map component
│   │   ├── ChunkedMarkerLoader.tsx     # Chunked marker loading
│   │   ├── CanvasMarkerRenderer.tsx    # High-performance rendering
│   │   ├── HeatmapRenderer.tsx         # Heat map visualization
│   │   ├── MarkerClusterGroup.tsx      # Client-side clustering
│   │   ├── StatisticsPanel.tsx         # Statistics dashboard
│   │   ├── FilterPanel.tsx             # Advanced filtering
│   │   ├── EmployerModal.tsx           # Employer details modal
│   │   └── PerformanceIndicator.tsx    # Performance metrics
│   ├── hooks/                   # Custom React hooks
│   │   ├── useEmployerData.ts          # Main data management
│   │   └── useClusteringWorker.ts      # Web Worker integration
│   ├── data/                    # Data processing modules
│   │   ├── comprehensiveDataLoader.ts  # Local data processing
│   │   ├── serverDataLoader.ts         # Server API integration
│   │   └── viewportDataLoader.ts       # Viewport-based loading
│   ├── workers/                 # Web Workers
│   │   └── clusteringWorker.ts         # Background clustering
│   ├── types/                   # TypeScript type definitions
│   │   └── lmia.ts                    # Core data types
│   ├── utils/                   # Utility functions
│   │   ├── LMIAMapManager.ts          # Map management
│   │   ├── excelReader.ts             # Excel processing
│   │   └── geocoding.ts               # Canadian Geographic Names integration
│   └── pages/                   # Page components
│       ├── MapPage.tsx                # Main map page
│       └── StatisticsPage.tsx         # Statistics page
├── scripts/                     # Utility scripts
│   └── convertToGeoJSON.js            # Data conversion
├── server.js                    # Express.js backend server
├── start.sh / start.bat         # Automated startup scripts
├── stop.sh / stop.bat           # Cleanup scripts
└── package.json
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Data Configuration
DATA_PATH=./public/data/LMIA-DATA
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/employers` | GET | Get filtered employer data with viewport clustering |
| `/api/available-data` | GET | Get available years/quarters |

### npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend development server |
| `npm start` | Start backend server |
| `npm run start:all` | Start both servers (macOS/Linux) |
| `npm run start:all:win` | Start both servers (Windows) |
| `npm run stop` | Stop all servers (macOS/Linux) |
| `npm run stop:win` | Stop all servers (Windows) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

## Data Sources

The application processes Canadian Labour Market Impact Assessment data from official government sources:

- **Format**: Excel (.xlsx) and CSV files
- **Coverage**: 2015-2025 (quarterly data)
- **Records**: 17,839+ employers
- **Fields**: Employer details, locations, positions, programs, occupations

### Canadian Geographic Names Database

The application integrates with the official Canadian Geographic Names Database for accurate geocoding:

- **Source**: Government of Canada Geographic Names Database
- **Locations**: 25,228+ indexed populated places across Canada
- **Coverage**: All provinces and territories
- **Place Types**: Cities, towns, municipalities, villages, communities, and more
- **Priority System**: Intelligent matching based on place type and relevance
- **Performance**: Pre-loaded at startup with in-memory indexing for instant lookups

### Data Processing Pipeline

1. **Excel Parsing**: XLSX library processes government Excel files
2. **Canadian Geographic Names Integration**: Pre-loaded database with 25,228+ locations for accurate geocoding
3. **Intelligent Geocoding**: Priority-based matching using official Canadian place names
4. **Clustering**: Server-side clustering for performance optimization
5. **API Serving**: RESTful endpoints with viewport filtering
6. **Real-time Updates**: Dynamic data loading based on map viewport
7. **Caching**: In-memory cache for geocoding results and database indexing

## Features Deep Dive

### Interactive Mapping

- **Multi-level Clustering**: Automatic clustering based on zoom level
- **Performance Optimization**: Web Workers handle clustering calculations
- **Real-time Filtering**: Viewport-based data loading
- **Custom Markers**: Program-specific marker styling and colors
- **Popup System**: Native Leaflet popups with proper z-index handling
- **Heat Map Mode**: Density visualization for large datasets
- **Accurate Geocoding**: Canadian Geographic Names Database integration for precise location mapping
- **Intelligent Place Matching**: Priority-based selection of best location matches

### Statistical Analysis

- **Labor Market Metrics**: Total employers, positions, and LMIAs
- **Geographic Distribution**: Provincial and territorial breakdowns
- **Occupation Analysis**: Top occupations and program distributions
- **Time Series Data**: Quarterly and annual trends
- **Virtualized Lists**: Efficient rendering of large datasets

### Performance Features

- **Server-side Processing**: Efficient data clustering and filtering
- **Web Workers**: Background processing without UI blocking
- **Chunked Loading**: Progressive data loading for large datasets
- **Canvas Rendering**: High-performance marker rendering
- **Viewport Optimization**: Load only visible data
- **Throttled Updates**: Prevents excessive API calls
- **Pre-loaded Geocoding Database**: 25,228+ locations indexed at startup for instant lookups
- **Intelligent Caching**: Multi-level caching system for geocoding results

## Deployment

### Production Build

```bash
# Build the frontend
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**: The startup scripts automatically handle this
2. **Dependencies Issues**: Run `npm install` to resolve
3. **Server Won't Start**: Check `server.log` for detailed error messages
4. **Map Not Loading**: Verify both frontend and backend servers are running
5. **Canadian Geo Names Loading**: The database loads at startup - initial startup may take a few extra seconds
6. **Geocoding Performance**: First-time geocoding may be slower, but results are cached for subsequent requests

### Log Files

- **Backend Logs**: `server.log`
- **Frontend Logs**: `frontend.log`

View logs in real-time:
```bash
tail -f server.log    # Backend logs
tail -f frontend.log  # Frontend logs
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Test on multiple platforms (macOS, Linux, Windows)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, [email](info@deadcoast.net) or create an issue in this repository.

---

<div align="center">

[Report Bug](https://github.com/yourusername/can-lmia/issues) · [Request Feature](https://github.com/yourusername/can-lmia/issues) · [Documentation](https://github.com/yourusername/can-lmia/wiki)

</div>