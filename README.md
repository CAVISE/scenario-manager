# ScenarioManager · CAVISE

> **A real-time 3D scenario editor for V2X (Vehicle-to-Everything) simulation environments.**
> Built for engineers working on autonomous driving and smart infrastructure research.

---

## Demo

### Scene Editor
![Scene Editor](docs/Screen-Scenario-manager.gif)
*Place and move vehicles, RSUs, and buildings on an OpenDRIVE road network*

### Scene Graph Panel
![Scene Graph Panel](docs/Screen-Scenario-manager-panel.gif)
*Hierarchical object tree with live position readout and type badges*

### Export Configs
![Export Configs](docs/Screen-Scenario-manager-config.gif)
*Generate config files for OMNeT++, Artery, CAPI, Sionna, CARLA, OpenCDA, SUMO, and MPC*

---

## Screenshots

![3D Editor Viewport](docs/screenshot-editor.png)
*OpenDRIVE road network with a vehicle equipped with LiDAR sensor and route waypoint*

![Settings Panel](docs/screenshot-panel.png)
*Scene Graph tree with object hierarchy and LiDAR property editor*

![Simulation Settings](docs/screenshot-simulation.png)
*Per-simulator configuration dialog — SIONNA ray tracing parameters shown*

![Export Menu](docs/screenshot-export.png)
*Export menu — generate config files for multiple simulators*

---

## Overview

ScenarioManager is a browser-based 3D scene editor built on top of [OpenDRIVE](https://www.asam.net/standards/detail/opendrive/) road network maps. It lets you place and configure vehicles, pedestrians, RSUs (Road Side Units), LiDAR sensors, and buildings — then export scenarios to multiple simulators including [OpenCDA](https://github.com/ucla-mobility/OpenCDA), CARLA, SUMO, OMNeT++, Artery, CAPI, Sionna, and MPC.

Scenarios are stored on a backend and can be saved, loaded, and shared across sessions. The editor features a live scene graph panel, per-object property editing, transform controls, and real-time telemetry monitoring via WebSocket.

---

## Features

- **OpenDRIVE map loading** — parse and render `.xodr` road network files via WebAssembly
- **3D scene editing** — place, move, rotate, and scale objects directly in the viewport
- **Vehicle management** — add cars with configurable color, speed, model, and route waypoints
- **Pedestrian support** — place pedestrians with speed, crossing behavior, and V2X parameters
- **RSU placement** — deploy Road Side Units with protocol, TX power, antenna, and MIMO settings
- **LiDAR sensors** — attach configurable LiDAR sensors to vehicles with range visualization
- **Building placement** — populate the scene with 3D building assets and material properties
- **Route planning** — define per-vehicle waypoint paths with visual connectors
- **Scene Graph panel** — hierarchical object tree with live position readout and type badges
- **Scenario save/load** — persist and restore full scene state via backend REST API
- **Simulation launch** — send scenarios directly to an OpenCDA backend
- **Real-time status** — live simulation status updates via WebSocket with auto-reconnect
- **Telemetry modal** — view simulation result images grouped by category
- **Multi-simulator export** — generate configs for 8 simulators in one click (OMNeT++, Artery, CAPI, Sionna, CARLA, OpenCDA, SUMO, MPC)
- **Error recovery** — React ErrorBoundary wraps the 3D editor and canvas for graceful crash handling

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| 3D Engine | Three.js |
| Road Network | OpenDRIVE (via WebAssembly) |
| State Management | Zustand |
| Server State | TanStack Query v5 |
| HTTP Client | ky |
| UI Components | MUI Material + MUI X Tree View |
| Build Tool | Vite |
| Testing | Vitest (unit) + Playwright (E2E) |
| 3D Utilities | three-stdlib (TransformControls, GLTFLoader) |

### Backend

| Component | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | PostgreSQL (psycopg2) |
| Config | OmegaConf + pydantic-settings |
| Rate Limiting | slowapi |
| Simulation | OpenCDA + CARLA 0.9.15 |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL
- A `.xodr` road network file
- Running CARLA instance (for simulation)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Backend

```bash
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env.local

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Environment Variables

```bash
# .env.local (backend)
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_ENCODING=

CARLA_HOST=localhost
CARLA_PORT=2000
```

```bash
# frontend/.env.development
VITE_API_URL=http://localhost:8000
```

---

## Docker

### Production

```bash
docker-compose --profile prod up -d
```

Builds and serves the production bundle. Frontend waits for the backend health check before starting.

### Development

```bash
# Frontend only (Vite dev server with hot reload)
docker-compose --profile frontend-dev up

# Full development stack
docker-compose --profile dev up
```

### Common Commands

```bash
# Rebuild after dependency changes
docker-compose --profile prod up --build

# View logs
docker-compose logs -f

# Stop all containers
docker-compose down
```

### Static Map Files

Road network files (`.xodr`, `.glb`) are stored in a Docker volume and mounted into the nginx container. They only need to be copied once:

```bash
# After first deploy — copy map files into the volume
Get-ChildItem frontend\dist\*.xodr, frontend\dist\*.glb, frontend\dist\lib\*.wasm | ForEach-Object {
    docker cp $_.FullName scenario-manager-backend-1:/app/static/maps/
}
```

Adding new maps later requires no rebuild — copy the file into the volume and it's immediately available.

---

## Testing

### Frontend

```bash
cd frontend

npm run test           # unit tests (Vitest)
npm run test:coverage  # coverage report
npm run test:e2e       # end-to-end tests (Playwright)
```

Unit tests cover: Zustand store, API hooks, scenario handlers, payload builders, toast notifications.
E2E tests cover: editor initialization, transform modes, SpeedDial actions, scenario load flow, scene clear.

### Backend

```bash
python -m pytest tests/backend/ -v
```

Tests cover: all simulation routes (start/stop/status/results), scenario CRUD routes, coordinate conversion, scenario payload building, simulation state machine, cleanup logic, WebSocket broadcast.

---

## Project Structure

```
.
├── frontend/                          # React + Three.js application
│   ├── src/
│   │   ├── api/                       # HTTP layer (ky client, scenarios API, error handling)
│   │   ├── store/                     # Zustand global store
│   │   ├── components/                # Shared UI (AppToast, TelemetryModal, ImageViewerModal)
│   │   └── pages/
│   │       ├── Editor.tsx             # Editor entry point (wrapped in ErrorBoundary)
│   │       ├── Editor/
│   │       │   ├── Generators/        # Multi-simulator config export engine
│   │       │   ├── Skeletons/         # Loading / error / not-found screens
│   │       │   ├── context/           # React contexts (refs, hooks)
│   │       │   ├── hooks/             # Three.js, scene, API, and editor hooks
│   │       │   ├── scene/             # Asset loaders and scene utilities
│   │       │   └── components/        # Editor UI (canvas, toolbar, modals, panels)
│   │       ├── StartPage.tsx
│   │       ├── Reports.tsx
│   │       └── Params.tsx
│   ├── tests/e2e/                     # Playwright E2E tests
│   ├── .env.development               # Local environment (gitignored)
│   ├── .env.example                   # Environment template
│   └── vite.config.ts
│
├── app/
│   ├── routers/
│   │   ├── simulation.py              # Simulation control + WebSocket status
│   │   └── scenarios.py              # Scenario CRUD (PostgreSQL)
│   ├── config.py                      # pydantic-settings configuration
│   ├── database.py                    # PostgreSQL connection pool
│   ├── schemas.py                     # Pydantic request/response models
│   └── utils.py                       # Coordinate conversion, scenario payload builder
│
├── tests/
│   └── backend/
│       ├── test_simulation_routes.py  # Simulation endpoint tests
│       ├── test_simulation_internals.py # _run_with_state, cleanup, broadcast
│       ├── test_scenarios_routes.py   # Scenario CRUD tests
│       ├── test_utils.py              # Coordinate + payload builder tests
│       └── test_additional_coverage.py # Edge cases and branch coverage
│
├── main.py                            # FastAPI app factory + lifespan
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
└── nginx.conf
```

---

## Usage

### Adding Objects

Use the speed dial button (bottom-right corner) to add objects to the scene:

| Action | Description |
|---|---|
| **Add Car** | Click to enter car placement mode, then click on the road |
| **Add RSU** | Double-click on the road or open space to place an RSU |
| **Add Building** | Click to enter building mode, then double-click to place |
| **Add Pedestrian** | Click to enter pedestrian placement mode, then click to place |
| **Add Route Points** | Select a car first, then use Add Points to define its route |

### Selecting & Editing

- **Click** any object in the viewport to select it and open its properties in the right panel
- **Click** any object in the Scene Graph tree to select it and attach transform controls
- Use the **transform toolbar** (top-left) to switch between Translate / Rotate / Scale modes
- Press **Escape** to deselect and save current transforms
- Press **Delete** to remove the selected object

### Saving & Loading

- Click **Save** in the toolbar to persist the scenario to the backend
- Click **Load** to browse and restore previously saved scenarios
- Scenarios are stored server-side and identified by `scenario_id`

---

## Backend API

All routes are prefixed with `/api`.

### Scenario Management

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload_scenario` | Save a new scenario |
| `GET` | `/api/load_all_scenarios` | List all saved scenarios |
| `GET` | `/api/load_scenario/{scenario_id}` | Load a scenario by ID |
| `POST` | `/api/update_scenario` | Update an existing scenario |
| `POST` | `/api/delete_scenario` | Delete a scenario |

### Simulation Control

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/start_opencda` | Start simulation (rate limited: 5/min) |
| `GET` | `/api/status` | Poll simulation status |
| `POST` | `/api/stop` | Stop the running simulation |
| `GET` | `/api/results/{run_id}` | List result images for a run |
| `DELETE` | `/api/results/{run_id}` | Delete results for a run |
| `WS` | `/api/ws/simulation` | Real-time simulation status stream |
| `GET` | `/health` | Service health check |

### Simulation Request

```json
POST /api/start_opencda
{
  "map": "Town10HD",
  "max_ticks": 1000,
  "weather": "ClearNoon",
  "scenario": [
    {
      "vehicle": "car",
      "path": [
        {
          "x": 0, "y": 0, "z": 0,
          "model": "mercedes.coupe_2020",
          "color": 16711680,
          "points": [{ "id": 1, "x": 10, "y": 0, "z": 0 }],
          "lidars": [{ "range": 50, "channels": 32, "rotation_frequency": 10 }]
        }
      ]
    },
    {
      "vehicle": "RSU",
      "path": [{ "x": 5, "y": 0, "z": 0, "tx_power": 23, "protocol": "ITS-G5" }]
    },
    {
      "vehicle": "pedestrian",
      "path": [{ "x": 3, "y": 0, "z": 0, "speed": 1.4, "cross_factor": 0.5 }]
    }
  ]
}
```

### Simulation Status Lifecycle

```
POST /api/start_opencda  →  { "status": "started", "map": "Town10HD" }
WS   /api/ws/simulation  →  { "status": "running", "map": "Town10HD", "error": null }
WS   /api/ws/simulation  →  { "status": "finished", "run_id": "Town10HD_20250101_120000" }
GET  /api/results/{run_id} → { "files": [...], "run_id": "..." }
```

---

## Exporting Configs

Click the **download icon** in the toolbar to open the export menu. Configs are generated from the current scene state.

### Supported Simulators

| Category | Simulator | Format |
|---|---|---|
| V2X | **OMNeT++** | `.ini` |
| V2X | **Artery** | `.ini` |
| V2X | **CAPI** | `.ini` |
| Channel / Ray tracing | **Sionna** | `.json` |
| Driving simulation | **CARLA** | `.yaml` |
| Driving simulation | **OpenCDA** | `.yaml` |
| Traffic simulation | **SUMO** | `.xml` |
| Control | **MPC** | `.yaml` |

### Export Workflow

```
1. Load .xodr map
2. Place vehicles, RSUs, pedestrians, buildings
3. Define vehicle routes (waypoints)
4. Attach LiDAR sensors to vehicles
5. Open Settings → configure simulation parameters
6. Click Export → choose target simulator
7. Use generated config with the corresponding simulator
```

---

## Object Types

| Type | Description |
|---|---|
| **Car** | Autonomous vehicle with route waypoints and optional LiDAR sensors |
| **RSU** | Road Side Unit — V2X infrastructure node |
| **Pedestrian** | Pedestrian agent with V2X capability |
| **LiDAR** | Sensor attached to a vehicle |
| **Building** | Static environment asset |
| **Waypoint** | Route point belonging to a vehicle |

---

## Weather Presets

`ClearNoon` · `CloudyNoon` · `WetNoon` · `WetCloudyNoon` · `SoftRainNoon` · `MidRainyNoon` · `HardRainNoon` · `ClearSunset` · `CloudySunset` · `WetSunset` · `WetCloudySunset` · `SoftRainSunset` · `MidRainSunset` · `HardRainSunset`

---

## License

© 2025 CAVISE. All rights reserved.