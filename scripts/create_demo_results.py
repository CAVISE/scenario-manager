"""Create a deterministic, explicitly synthetic Results example (no CARLA/DB).

Run from the repository root:
docker run --rm -v "$PWD:/app" -w /app python:3.11-slim python scripts/create_demo_results.py
"""
import json
import math
from pathlib import Path

RUN_ID = "Demo_Town01_GNSS_spoofing"
SOURCE_RUN = "Town01_2026_09_11_13_04_38_671771"
ROOT = Path(__file__).resolve().parents[1] / "evaluation_outputs"
TIMES = [i / 2 for i in range(89)]
ROUTES = [
    ("197", "cav1 · GNSS drift", [(-42.75, -76.42), (-42.75, 30), (74.6, 30), (74.6, -206.61)]),
    ("202", "cav2 · Reference vehicle", [(128.53, 82.37), (128.53, -9.37), (-106.95, -9.37)]),
    ("207", "cav3 · Mild GNSS drift", [(-123.65, -207.71), (76.35, -207.71), (76.35, 64.13)]),
]


def line(key, label, values, xs=TIMES):
    return {"id": key, "label": label, "points": [
        [round(x, 3), None if y is None else round(y, 3)] for x, y in zip(xs, values)
    ]}


def total_distance(points):
    result = [0.0]
    for previous, current in zip(points, points[1:]):
        result.append(result[-1] + math.dist(previous, current))
    return result


def route_point(route, distance):
    for start, end in zip(route, route[1:]):
        length = math.dist(start, end)
        if distance <= length:
            return tuple(a + (b - a) * distance / length for a, b in zip(start, end))
        distance -= length
    return route[-1]


def generate():
    document = {
        "schema_version": 1, "run_id": RUN_ID,
        "fixed_delta_seconds": 0.05, "elapsed_seconds": 44,
        "actors": [], "charts": [],
        "warnings": [
            "DEMO — synthetic data for previewing Results, not a recorded CARLA simulation. "
            "Inspired by POC_Scenario_Town01 with three vehicles. "
            "GNSS drift is illustrated from 14–30 s; curves are sampled every 0.5 s."
        ],
    }
    for index, (actor_id, label, route) in enumerate(ROUTES):
        def add(key, title, category, unit, series, description="", kind="line"):
            document["charts"].append({
                "id": key, "actor_id": actor_id, "title": title,
                "category": category, "kind": kind, "description": description,
                "x_axis": {"label": "World X" if kind == "trajectory" else "Elapsed simulation time",
                           "unit": "m" if kind == "trajectory" else "s"},
                "y_axis": {"label": "World Y" if kind == "trajectory" else title, "unit": unit},
                "series": series,
            })

        target = total_distance(route)[-1]
        weights = [max(0, min(t / 4, 1, (44 - t) / 4)) *
                   (1 + 0.06 * math.sin(t / 3 + index) -
                    (0.5 if index == 0 else 0.2) * math.exp(-((t - 22) / 3) ** 2))
                   for t in TIMES]
        integral = sum((a + b) / 4 for a, b in zip(weights, weights[1:]))
        speeds = [w * (target - 6) / integral for w in weights]
        travelled = [0.0]
        for a, b in zip(speeds, speeds[1:]):
            travelled.append(travelled[-1] + (a + b) / 4)
        actual = [route_point(route, distance) for distance in travelled]
        amplitude = [12, 0, 3][index]
        drift = [amplitude * math.sin(math.pi * (t - 14) / 16) ** 2 if 14 < t < 30 else 0 for t in TIMES]
        error_x = [d + 0.3 * math.sin(t * 3 + index) for t, d in zip(TIMES, drift)]
        error_y = [0.45 * d + 0.2 * math.cos(t * 4 + index) for t, d in zip(TIMES, drift)]
        filtered_x = [e * 0.32 for e in error_x]
        filtered_y = [e * 0.32 for e in error_y]
        gnss = [(x + ex, y + ey) for (x, y), ex, ey in zip(actual, error_x, error_y)]
        filtered = [(x + ex, y + ey) for (x, y), ex, ey in zip(actual, filtered_x, filtered_y)]
        transmitted = gnss
        coverage = [int(not (9 + index <= t < 12 + index or 28 <= t < 33)) for t in TIMES]
        objects, merged = [], 0
        for i, covered in enumerate(coverage):
            merged += (1 + (i + index) % 3) if covered else 0
            objects.append(merged)

        def metric(key, title, value, unit=""):
            return {"id": key, "label": title, "value": round(value, 3), "unit": unit}

        document["actors"].append({"id": actor_id, "label": label, "metrics": [
            metric("distance", "Physical distance", travelled[-1], "m"),
            metric("planned_distance", "Planned distance", target, "m"),
            metric("destination_distance", "Distance to destination", math.dist(actual[-1], route[-1]), "m"),
            metric("collision_detected", "Collision detected", 0),
            metric("rsu_coverage", "RSU coverage", 100 * sum(coverage) / len(coverage), "%"),
            metric("max_speed", "Maximum speed", max(speeds) * 3.6, "km/h"),
            metric("gnss_x_error", "GNSS X mean absolute error", sum(map(abs, error_x)) / len(error_x), "m"),
            metric("kalman_x_error", "Kalman X mean absolute error", sum(map(abs, filtered_x)) / len(filtered_x), "m"),
            metric("collision_ticks", "Collision ticks", 0, "ticks"),
            metric("ran_light_ticks", "Red light violation ticks", 20 if index == 0 else 0, "ticks"),
            metric("rsu_objects", "Objects received from RSUs", merged, "objects"),
        ]})
        add("speed", "Vehicle speed", "motion", "km/h", [line("actual", "Ground truth", [v * 3.6 for v in speeds]),
            line("reported", "V2X-transmitted speed", [v * 3.6 + d * 0.35 for v, d in zip(speeds, drift)])],
            "Illustrative acceleration, braking near 22 s and recovery. Reported speed drifts during the attack.")
        add("routes", "Route comparison", "motion", "m", [
            line(key, title, [p[1] for p in points], [p[0] for p in points]) for key, title, points in
            [("planned", "Planned route", route), ("actual", "Actual physical path", actual),
             ("reported", "V2X-transmitted position", transmitted)]],
            "Approximate routes based on the original vehicle start/end coordinates; intermediate waypoints are illustrative.", "trajectory")
        add("distance", "Distance travelled", "motion", "m", [
            line("actual", "Actual physical distance", travelled),
            line("reported", "V2X-transmitted distance", total_distance(transmitted)),
            line("planned", "Planned route length", [target] * len(TIMES))],
            "The planned length stays constant. Physical and reported cumulative distances come from their respective paths.")
        add("acceleration", "Longitudinal acceleration", "motion", "m/s²", [
            line("acceleration", "Acceleration", [0] + [(b - a) / 0.5 for a, b in zip(speeds, speeds[1:])])],
            "Acceleration derived from the demo vehicle speed.")
        add("localization_route", "Localization trajectory", "localization", "m", [
            line(key, title, [p[1] for p in points], [p[0] for p in points]) for key, title, points in
            [("gt", "Ground truth", actual), ("gnss", "Raw GNSS", gnss), ("filter", "Kalman filter", filtered)]],
            "An illustrative filter reduces the artificial GNSS position drift.", "trajectory")
        for key, title, raw, smooth in [("x", "X position error", error_x, filtered_x),
                                         ("y", "Y position error", error_y, filtered_y)]:
            add("error_" + key, title, "localization", "m", [
                line("gnss", "Raw GNSS", [-v for v in raw]),
                line("filter", "Kalman filter", [-v for v in smooth])],
                "Signed error: ground truth minus estimated position. Synthetic GNSS drift from 14–30 s.")
        add("hazards", "Safety events", "safety", "", [
            line("collision", "Collision", [0] * len(TIMES)),
            line("red_light", "Red light violation", [int(index == 0 and 25 <= t < 26) for t in TIMES])],
            "1 = detected, 0 = not detected. The first vehicle has an illustrative red light violation at 25 s.", "step")
        add("ttc", "Time to collision", "safety", "s", [
            line("ttc", "Predicted TTC", [(1.4 + index + ((t - 22) / 2) ** 2) if 18 <= t <= 26 else None for t in TIMES])],
            "A brief approach to an obstacle during braking. Gaps indicate no predicted collision.")
        add("rsu_coverage", "RSU coverage", "cooperation", "", [line("coverage", "RSU in range", coverage)],
            "Two short coverage gaps illustrate entering and leaving roadside-unit range.", "step")
        add("rsu_objects", "Objects received from RSUs", "cooperation", "objects", [
            line("objects", "Cumulative merged objects", objects)],
            "The cumulative count pauses while no roadside unit is in range.")
    return document


if __name__ == "__main__":
    directory = ROOT / RUN_ID
    if directory.exists():
        manifest = directory / "run_status.json"
        if not manifest.exists() or json.loads(manifest.read_text()).get("is_demo") is not True:
            raise SystemExit("Refusing to overwrite a directory not marked as demo data")
    directory.mkdir(parents=True, exist_ok=True)
    document = generate()
    files = {
        "charts.json": document,
        "metrics.json": {"is_demo": True, "vehicles": document["actors"]},
        "demo_scenario.json": {"is_demo": True, "inspired_by_run": SOURCE_RUN,
                               "description": "Illustrative GNSS drift; not a runnable CARLA configuration.",
                               "map": "Town01", "attack_window_seconds": [14, 30],
                               "vehicles": [{"id": key, "label": label, "approximate_route": route}
                                            for key, label, route in ROUTES]},
        "run_status.json": {"outcome": "complete", "is_demo": True,
                            "scenario_name": "DEMO · Town01 — GNSS drift", "scenario_id": "demo-town01",
                            "tick": 880, "max_ticks": 880},
    }
    for name, data in files.items():
        temporary = directory / (name + ".tmp")
        temporary.write_text(json.dumps(data, ensure_ascii=False, allow_nan=False,
                                       separators=(",", ":")) + "\n", encoding="utf-8")
        temporary.replace(directory / name)
    (directory / "demo_notes.txt").write_text(
        "DEMO DATA — not a recorded simulation.\n"
        f"Inspired by POC_Scenario_Town01 ({SOURCE_RUN}).\n"
        "Three vehicles, 44 simulated seconds, sample spacing 0.5 s.\n"
        "Positions, measurements and events are synthetic. Original start/end positions are reused, "
        "but intermediate route geometry is approximate.\n"
        "Vehicle cav1: strong GNSS drift from 14–30 s, braking near 22 s, red light violation at 25 s.\n"
        "Vehicle cav2: reference without attack. Vehicle cav3: mild GNSS drift.\n"
        "All three have route, speed, acceleration, localization, safety and RSU charts.\n",
        encoding="utf-8",
    )
    print(f"Created {directory.name}: {len(document['actors'])} vehicles, {len(document['charts'])} charts")
