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
*Generate config files for OMNeT++, Artery, Sionna, CARLA, OpenCDA, SUMO, and more*

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

ScenarioManager is a browser-based 3D scene editor built on top of [OpenDRIVE](https://www.asam.net/standards/detail/opendrive/) road network maps. It lets you place and configure vehicles, pedestrians, RSUs (Road Side Units), LiDAR sensors, and buildings — then export scenarios to multiple simulators including [OpenCDA](https://github.com/ucla-mobility/OpenCDA), CARLA, SUMO, OMNeT++, Artery, and Sionna.

Scenarios are stored on a backend and can be saved, loaded, and shared across sessions. The editor features a live scene graph panel, per-object property editing, transform controls, and real-time telemetry monitoring.

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
- **Telemetry modal** — monitor live simulation data in real time
- **Multi-simulator export** — generate configs for 7 different simulators in one click

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| 3D Engine | Three.js |
| Road Network | OpenDRIVE (via WebAssembly) |
| State Management | Zustand + Redux Toolkit |
| Server State | TanStack Query v5 |
| HTTP Client | ky |
| UI Components | MUI Joy + MUI X Tree View |
| Build Tool | Vite |
| Testing | Vitest + Playwright |
| 3D Utilities | three-stdlib (TransformControls, GLTFLoader) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A `.xodr` road network file (place at `public/data.xodr`)
- Running backend (see [Backend API](#backend-api))

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Test

```bash
npm run test          # unit tests (vitest)
npm run test:e2e      # end-to-end tests (playwright)
npm run test:coverage # coverage report
```

---

## Docker

The frontend can be run via Docker Compose using profiles.

### Production

```bash
docker compose --profile prod up
```

Builds and serves the production bundle.

### Development

```bash
docker compose --profile frontend-dev up
```

Starts the Vite dev server with hot reload.

```bash
docker compose --profile dev up
```

Starts the full development stack (frontend + backend services).

### Common Commands

```bash
# Run in background
docker compose --profile prod up -d

# Stop all containers
docker compose down

# Rebuild after dependency changes
docker compose --profile prod up --build

# View logs
docker compose logs -f
```

---

## Project Structure

```
src/
├── api/                                  # HTTP layer
│   ├── client.ts                         # ky instance with base URL
│   ├── scenarios.ts                      # Scenario CRUD endpoints
│   ├── queryClient.ts                    # TanStack Query client setup
│   ├── errors.ts                         # API error handling
│   └── types/IScenarioTypes.ts           # Request/response payload types
│
├── store/
│   └── useEditorStore.ts                 # Global Zustand store (cars, RSUs, buildings, pedestrians, lidars)
│
├── helpers/
│   └── editorhelper.ts
│
├── components/                           # Shared UI components
│   ├── AppToast/                         # Toast notification system
│   ├── TelemetryModal/                   # Live simulation telemetry
│   └── ImageViewerModal/                 # Image preview modal
│
├── pages/
│   ├── StartPage.tsx                     # Scenario list / landing page
│   ├── Reports.tsx                       # Reports page
│   ├── Params.tsx                        # Parameters page
│   ├── Editor.tsx                        # Editor entry point
│   │
│   ├── components/                       # Shared page-level components
│   │   ├── BottomNavbar/                 # Bottom navigation bar
│   │   ├── Inputs/                       # Reusable form inputs
│   │   ├── Statuses/                     # Simulation status indicators
│   │   └── RightPanel/                   # Properties sidebar
│   │       └── components/
│   │           ├── SceneTreePanel/       # Scene graph tree view
│   │           │   └── funcs/            # Tree helpers (select, delete, expand, sync)
│   │           ├── ScenarioControlWidget/ # Save / load / run controls
│   │           ├── CarProperties/        # Vehicle property editor
│   │           ├── CarList/              # Vehicle list
│   │           ├── CarLidarList/         # Per-vehicle LiDAR list
│   │           ├── RSUProperties/        # RSU property editor
│   │           ├── LidarProperties/      # LiDAR property editor
│   │           ├── BuildingProperties/   # Building property editor
│   │           ├── PedestrianProperties/ # Pedestrian property editor
│   │           └── RoutePointProperties/ # Waypoint property editor
│   │
│   └── Editor/
│       ├── Generators/                   # Config export engine
│       │   ├── configGenerators.ts       # Entry point, merges scene state into config
│       │   ├── types/                    # SimulationConfig type definitions
│       │   └── exporters/                # Per-simulator generators
│       │       ├── omnet.ts              # OMNeT++ .ini
│       │       ├── artery.ts             # Artery .ini
│       │       ├── capi.ts               # CAPI OMNeT++ .ini
│       │       ├── sionna.ts             # Sionna .json
│       │       ├── carla.ts              # CARLA .yaml
│       │       ├── opencda.ts            # OpenCDA .yaml
│       │       ├── sumo.ts               # SUMO .xml
│       │       ├── mpc.ts                # MPC .yaml
│       │       └── download.ts           # File download utility
│       │
│       ├── Sceletons/                    # Loading / error / not-found screens
│       │
│       ├── context/                      # React contexts
│       │   ├── EditorRefsContext         # Three.js refs (scene, camera, renderer, controls)
│       │   └── hooksContext              # Editor hooks context
│       │
│       ├── hooks/
│       │   ├── useThreeScene/            # Three.js scene lifecycle
│       │   │   ├── useOdrLoader/         # .xodr file loading
│       │   │   ├── useOdrMapManager/     # Road network build & clear
│       │   │   ├── useSceneAnimator/     # Render loop
│       │   │   ├── useSceneObjects/      # Object management
│       │   │   └── useTransformSetup/    # TransformControls initialization
│       │   │
│       │   ├── useEditorScene/           # Scene object synchronization
│       │   │   └── hooks/
│       │   │       ├── carFunctions/     # Car mesh sync + model loading
│       │   │       ├── rsuFunction/      # RSU mesh sync
│       │   │       ├── lidarFunction/    # LiDAR mesh sync
│       │   │       ├── pedestrianFunction/ # Pedestrian mesh sync
│       │   │       └── buildingFunction/ # Building mesh sync + loader
│       │   │
│       │   ├── useEditorEngine/          # Editor state hooks
│       │   │   ├── useEditorHandlers/    # Action handlers
│       │   │   ├── useSceneGraph/        # Scene tree traversal & state
│       │   │   ├── useSelectedObject/    # Selection state
│       │   │   ├── useTransformMode/     # Translate/Rotate/Scale mode
│       │   │   └── useLoadingState/      # Loading state management
│       │   │
│       │   ├── useOpenDriveUtils/        # OpenDRIVE helpers
│       │   │   ├── useOdrMap/            # Map rendering
│       │   │   ├── useThreeSetup/        # Camera, renderer, lights
│       │   │   ├── useDatGui/            # Debug GUI
│       │   │   └── useSpotlight/         # Spotlight setup
│       │   │
│       │   ├── mouseEvents/              # Input event handlers
│       │   │   └── handlers/
│       │   │       ├── useClickHandler
│       │   │       ├── useDblClickHandler
│       │   │       ├── useContextMenuHandler
│       │   │       ├── useMouseMoveHandler
│       │   │       └── useKeyDownHandler
│       │   │
│       │   ├── createEvents/             # Imperative event factories
│       │   │   ├── createEditorActions/  # Add car/RSU/building/pedestrian actions
│       │   │   ├── createStoreSubscriptions/ # Zustand store watchers → scene sync
│       │   │   └── createTransformListener/  # TransformControls change listener
│       │   │
│       │   └── useApiHooks/              # Data-fetching hooks (TanStack Query)
│       │       ├── useScenarioApi/       # Scenario mutations
│       │       ├── useScenarioQueries/   # Scenario list & detail queries
│       │       ├── useScenarioSave/      # Save current scene to backend
│       │       ├── useSimulationMutation/ # Start simulation
│       │       └── useStatusesQuery/     # Poll simulation status
│       │
│       ├── scene/
│       │   ├── loaders/                  # Asset loaders
│       │   │   ├── loadRSU/              # RSU GLTF model loader
│       │   │   ├── loadPoints/           # Waypoint circle renderer
│       │   │   ├── loadPedestrian/       # Pedestrian model loader
│       │   │   └── restoreLidars/        # Restore LiDAR meshes from state
│       │   └── utils/                    # Scene utilities
│       │       ├── disposeMesh/          # Geometry/material cleanup
│       │       ├── reloadOdrMap/         # Map hot-reload
│       │       ├── restoreObjects/       # Restore full scene from saved state
│       │       └── sceneHelpers/         # Misc scene helpers
│       │
│       └── components/                   # Editor UI components
│           ├── EditorCanvas/             # Three.js canvas mount
│           ├── EditorUI/                 # HUD overlay layout
│           ├── EditorModals/             # Modal orchestrator
│           ├── EditorToolbar/            # Top toolbar
│           │   └── menus/ExportMenu/     # Export menu with per-simulator sections
│           ├── EditorTransformControls/  # Transform mode switcher (T/R/S)
│           ├── CoordinateWidget/         # Live world/road coordinates
│           ├── SimConfigModal/           # Simulation settings (tabbed per simulator)
│           │   └── tabs/                 # Artery, CAPI, CARLA, MPC, OMNeT++, OpenCDA, Sionna, SUMO
│           ├── EditorSceneBootstrap/     # Scene initialization wrapper
│           ├── EditorLoadingGate/        # Loading state guard
│           └── UploadScenariosModal/     # Scenario browser / loader
│
└── VARS.ts                               # Global constants (backend port)
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

## Configuration

```ts
// src/VARS.ts
export const PORT = '8000'; // Backend port
```

---

## Backend

The backend is a **FastAPI** application (Python 3.12) with two layers:

- **Main API** (`app/routes.py`) — scenario storage (PostgreSQL), simulation control, and status polling. Serves the frontend.
- **Simulation API** (`simulation/app/`) — CARLA-connected service that manages scenario execution and reports (SQLite). Runs alongside CARLA.

The backend stores scenarios in **PostgreSQL** and runs OpenCDA simulations as background tasks against a live **CARLA** instance.

### Stack

| Component | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | PostgreSQL (psycopg2) |
| Simulation DB | SQLite |
| Config | OmegaConf + python-dotenv |
| Simulation | OpenCDA + CARLA 0.9.15 |

### Environment Variables

```bash
# .env.local
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_ENCODING=

CARLA_HOST=localhost   # default
CARLA_PORT=2000        # default
```

### Running

```bash
# Create and activate venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### API Endpoints

All routes are prefixed with `/api`.

#### Scenario Management

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload_scenario` | Save a new scenario to the database |
| `GET` | `/api/load_all_scenarios` | List all saved scenarios |
| `GET` | `/api/load_scenario/{scenario_id}` | Load a specific scenario by ID |
| `POST` | `/api/update_scenario` | Update an existing scenario |
| `POST` | `/api/delete_scenario` | Delete a scenario by ID |

#### Simulation Control

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/start_opencda` | Start a simulation as a background task |
| `GET` | `/api/status` | Poll simulation status (`idle` / `running` / `finished` / `error`) |
| `POST` | `/api/stop` | Stop the running simulation and destroy CARLA actors |

### Simulation Request

```json
POST /api/start_opencda
{
  "scenario_id": "string",
  "scenario_name": "string",
  "weather": "ClearNoon",
  "map": "town10",
  "scenario": [
    {
      "vehicle": "car",
      "path": [{ "x": 0, "y": 0, "z": 0 }],
      "color": { "r": 127, "g": 0, "b": 0 },
      "active": false
    }
  ]
}
```

### Simulation Response Lifecycle

```
POST /api/start_opencda  →  { "status": "started", "map": "town10" }
GET  /api/status         →  { "status": "running", "map": "town10", "error": null }
GET  /api/status         →  { "status": "finished", ... }
```

### Simulation App (CARLA-connected)

A separate FastAPI app in `simulation/app/` connects directly to CARLA and exposes additional endpoints for scenario execution and report tracking:

| Method | Path | Description |
|---|---|---|
| `GET` | `/getters/vehicles` | List available CARLA vehicle blueprints |
| `GET` | `/getters/spawnpoints` | List map spawn points |
| `POST` | `/scenario/create` | Create and store a scenario JSON |
| `GET` | `/scenario/run/{id}` | Run a stored scenario against CARLA |
| `GET` | `/scenario/all` | List all stored scenarios |
| `GET` | `/scenario/{id}` | Get a specific scenario |
| `POST` | `/scenario/edit` | Edit a stored scenario |
| `GET` | `/reports/get/all` | Get all simulation run reports |
| `GET` | `/reports/get/{id}` | Get reports for a specific scenario |

### Scenario Payload

```json
{
  "id": null,
  "name_of_scenario": "My Scenario",
  "scenario_id": "string",
  "weather": "ClearNoon",
  "map": "town10",
  "scenario": [
    {
      "vehicle": "car",
      "path": [
        {
          "x": 0, "y": 0, "z": 0,
          "model": "mercedes.coupe_2020",
          "color": 16711680,
          "speed": 30,
          "points": [{ "id": 1, "x": 10, "y": 0, "z": 0 }],
          "lidars": [{ "range": 50, "channels": 32 }]
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

---

## Object Types

| Type | `userData.type` | Description |
|---|---|---|
| Vehicle | `car` | Autonomous vehicle with route and optional LiDAR |
| RSU | `point` | Road Side Unit (V2X infrastructure node) |
| Pedestrian | `pedestrian` | Pedestrian agent with V2X capability |
| LiDAR | `lidar` | Sensor attached to a vehicle |
| Building | `building` | Static environment asset |
| Waypoint | `circle` | Route point belonging to a vehicle |

---

## Exporting Configs

Once your scenario is set up, click the **download icon** in the toolbar to open the export menu. Configs are generated from the current scene state — vehicles, RSUs, pedestrians, routes, LiDAR sensors, and simulation parameters.

### Supported Simulators

| Category | Simulator | Format | Description |
|---|---|---|---|
| V2X | **OMNeT++** | `.ini` | Network simulation config with RSU positions and vehicle routes |
| V2X | **Artery** | `.ini` | Artery V2X framework config derived from OMNeT++ |
| V2X | **CAPI** | `.ini` | CAPI OMNeT++ config with path loss and radio medium settings |
| Channel / Ray tracing | **Sionna** | `.json` | Ray tracing config with carrier frequency, depth, samples, and propagation flags |
| Driving simulation | **CARLA** | `.yaml` | CARLA scenario with vehicle spawns, routes, and sensor definitions |
| Driving simulation | **OpenCDA** | `.yaml` | OpenCDA cooperative driving scenario |
| Traffic simulation | **SUMO** | `.xml` | SUMO network and route files with vehicle and pedestrian definitions |
| Control | **MPC** | `.yaml` | Model Predictive Control parameters |

### Simulation Settings Dialog

Before exporting, configure per-simulator parameters via **Settings → Simulation Settings**:

**General**
- `Duration (s)` — total simulation time in seconds

**SIONNA**
- `Carrier Frequency (Hz)` — e.g. `5900000000` for 5.9 GHz DSRC
- `Max Depth` — maximum number of ray interactions
- `Num Samples` — number of ray paths to compute
- `LoS` / `Reflection` / `Diffraction` / `Scattering` — propagation flags

**SUMO**
- `Net file` — path to SUMO network file
- `Step length` — simulation step in seconds
- `Full output` — enable detailed output logging

**CARLA / OpenCDA**
- Vehicle models, colors, and routes are taken directly from the scene
- LiDAR sensors are exported with position, range, channels, and rotation frequency

### Workflow

```
1. Load .xodr map
2. Place vehicles, RSUs, pedestrians, buildings
3. Define vehicle routes (waypoints)
4. Attach LiDAR sensors to vehicles
5. Open Settings → configure simulation parameters
6. Click Export → choose target simulator
7. Use generated config file with the corresponding simulator
```

---

## Weather Presets

The following CARLA weather presets are available when configuring a scenario:

`ClearNoon` · `CloudyNoon` · `WetNoon` · `WetCloudyNoon` · `SoftRainNoon` · `MidRainyNoon` · `HardRainNoon` · `ClearSunset` · `CloudySunset` · `WetSunset` · `WetCloudySunset` · `SoftRainSunset` · `MidRainSunset` · `HardRainSunset`

---

## License

© 2025 CAVISE. All rights reserved.