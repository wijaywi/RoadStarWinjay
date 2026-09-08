# RoadStar Winjay

<p align="center">
  <img src="coywin_logo_.png" alt="Coywin Logo" width="210"/>
</p>

RoadStar Winjay is an all-in-one logistics, load matching, and fleet management platform, designed for modern dispatching.

## Features Built
- **Fleet Hub**: Manage your vehicles and drivers database.
- **Load Planner**: 3D Visualization and Bin-Packing algorithm for optimal cargo loading.
- **Crew & Route**: Driver schedule management and interactive route planner with OpenStreetMap & OSRM integration.
- **Dispatch**: Kanban-style Dispatch Board with smart match suggestion between loads and available fleet.
- **Insight AI**: Predictive analytics on delay risks, maintenance alerts, and an AI-generated executive summary.
- **Integrations**: Bulk Import/Export via CSV and a documented REST API.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Three.js (for 3D), React-Leaflet (for maps).
- **Backend**: Node.js, Express, TypeScript. (In-memory mock data for demo purposes).

## How to Run

### 1. Backend
Navigate to the `backend` directory, install dependencies, and run the server:
```bash
cd backend
npm install
npm run dev
```
The backend will run on `http://localhost:3001`.

### 2. Frontend
Navigate to the `frontend` directory, install dependencies, and run the development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

Enjoy!
