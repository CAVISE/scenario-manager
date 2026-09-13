"""Export recorded samples without constructing matplotlib figures or images."""
import math


def finite(value):
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError, OverflowError):
        return None


def series(key, label, xs, ys):
    # Keep missing Y values as gaps; never join across invalid measurements.
    return {"id": key, "label": label, "points": [
        [x, finite(y)] for raw_x, y in zip(xs, ys)
        if (x := finite(raw_x)) is not None
    ]}


def metric(key, label, value, unit=""):
    return {"id": key, "label": label, "value": finite(value), "unit": unit}


def location(entry):
    if isinstance(entry, (tuple, list)):
        entry = entry[0]
    if hasattr(entry, "transform"):
        entry = entry.transform
    return entry.location


def distances(route):
    result = [0.0] if route else []
    for previous, current in zip(route, route[1:]):
        a, b = location(previous), location(current)
        result.append(result[-1] + math.dist((a.x, a.y, a.z), (b.x, b.y, b.z)))
    return result


class VehicleCharts:
    def __init__(self, vm, dt):
        self.vm = vm
        self.dt = dt
        self.actor_id = str(vm.vehicle.id)
        self.charts = []
        self.metrics = []

    def add(self, key, title, category, unit, lines, description="",
            kind="line", x_label="Elapsed simulation time", x_unit="s",
            y_label=None):
        if not any(line["points"] for line in lines):
            return
        self.charts.append({
            "id": key, "actor_id": self.actor_id, "title": title,
            "category": category, "kind": kind, "description": description,
            "x_axis": {"label": x_label, "unit": x_unit},
            "y_axis": {"label": y_label or title, "unit": unit},
            "series": lines,
        })

    def planning(self):
        vm = self.vm
        transmitted = list(vm.v2x_manager.transmitted_dynamic_trace)
        gt = list(getattr(vm, "gt_dynamic_trace", []))
        planned = list(vm.agent.initial_global_route or [])
        times = [e[2] * self.dt for e in transmitted]
        self.add("speed", "Vehicle speed", "motion", "km/h", [
            series("transmitted", "V2X-transmitted speed", times, [e[1] for e in transmitted])
        ], "Speed reported by the V2X manager; attacks may affect reported values.")
        routes = [("planned", "Planned route", planned),
                  ("actual", "Actual physical path", gt),
                  ("transmitted", "V2X-transmitted position", transmitted)]
        self.add("routes", "Route comparison", "motion", "m", [
            series(key, label, [location(e).x for e in route],
                   [location(e).y for e in route]) for key, label, route in routes
        ], "Compare physical movement with the plan and the position broadcast to other vehicles.",
            kind="trajectory", x_label="World X", x_unit="m", y_label="World Y")
        planned_dist = distances(planned)
        actual_dist = distances(gt)
        transmitted_dist = distances(transmitted)
        lines = [series("transmitted", "V2X-transmitted", times, transmitted_dist)]
        if gt:
            lines.append(series("actual", "Actual physical distance", times, actual_dist))
        if planned_dist and times:
            lines.append(series("planned", "Planned route length", [times[0], times[-1]],
                                [planned_dist[-1], planned_dist[-1]]))
        self.add("distance", "Distance travelled", "motion", "m", lines,
                 "Cumulative distance. The planned route length is a fixed reference, not progress.")
        self.metrics.extend([
            metric("distance", "Physical distance", actual_dist[-1] if actual_dist else None, "m"),
            metric("planned_distance", "Planned distance", planned_dist[-1] if planned_dist else None, "m"),
        ])
        if gt and planned:
            a, b = location(gt[-1]), location(planned[-1])
            self.metrics.append(metric("destination_distance", "Distance to destination",
                                       math.dist((a.x, a.y, a.z), (b.x, b.y, b.z)), "m"))

    def safety(self):
        vm = self.vm
        data = list(vm.safety_manager.status_queue)
        times = [e[0] * self.dt for e in data]
        labels = [("collision", "Collision"), ("offroad", "Off road"),
                  ("stuck", "Stuck"), ("ran_light", "Red light violation")]
        lines = []
        for key, label in labels:
            values = [int(bool(e[1].get(key, False))) for e in data]
            lines.append(series(key, label, times, values))
            self.metrics.append(metric(key + "_ticks", label + " ticks",
                                       sum(values) if data else None, "ticks"))
        self.add("hazards", "Safety events", "safety", "", lines,
                 "1 = detected, 0 = not detected. Summary counts are affected ticks, not distinct incidents.",
                 kind="step", y_label="Event detected")
        # A collision callback may arrive after the last status queue sample.
        late = any(getattr(sensor, "collided_frame", -1) != -1
                   for sensor in getattr(vm.safety_manager, "sensors", []))
        self.metrics.append(metric("collision_detected", "Collision detected",
                                   1 if late or any(e[1].get("collision") for e in data)
                                   else (0 if data else None), ""))
        imu = list(vm.safety_manager.imu_sensor.imu_data)
        # The IMU buffer has no simulation timestamps. Label the sample axis
        # honestly instead of aligning asynchronous callbacks with V2X ticks.
        for idx, key, title, unit in [(0, "acceleration", "IMU acceleration", "m/s²"),
                                       (1, "gyroscope", "IMU angular velocity", "rad/s")]:
            lines = [series(axis, axis.upper(), range(len(imu)),
                            [getattr(e[idx], axis) for e in imu]) for axis in "xyz"]
            lines.append(series("magnitude", "Signed forward" if idx == 0 else "Magnitude",
                                range(len(imu)), [e[2] if idx == 0 else
                                math.sqrt(e[1].x ** 2 + e[1].y ** 2 + e[1].z ** 2) for e in imu]))
            self.add(key, title, "motion", unit, lines,
                     "Sensor samples in acquisition order; sample zero is the first recorded measurement.",
                     x_label="IMU sample", x_unit="")

    def localization(self):
        helper = self.vm.localizer.debug_helper
        sources = [("gnss", "Raw GNSS"), ("gt", "Ground truth"), ("filter", "Kalman filter")]
        self.add("localization_route", "Localization trajectory", "localization", "m", [
            series(key, label, getattr(helper, key + "_x"), getattr(helper, key + "_y"))
            for key, label in sources
        ], "Raw sensor readings and filtered position compared with ground truth.",
            kind="trajectory", x_label="World X", x_unit="m", y_label="World Y")
        for field, title, unit in [("yaw", "Heading", "°"), ("spd", "Localization speed", "m/s")]:
            self.add("localization_" + field, title, "localization", unit, [
                series(key, label, range(len(getattr(helper, key + "_" + field))),
                       getattr(helper, key + "_" + field)) for key, label in sources
            ], x_label="Localization sample", x_unit="")
        for field, title, unit in [("x", "X position error", "m"),
                                    ("y", "Y position error", "m"), ("yaw", "Heading error", "°")]:
            lines = []
            for key, label in (sources[0], sources[2]):
                errors = [a - b for a, b in zip(getattr(helper, "gt_" + field),
                                               getattr(helper, key + "_" + field))]
                if field == "yaw":
                    errors = [(e + 180) % 360 - 180 for e in errors]
                lines.append(series(key, label, range(len(errors)), errors))
            self.add("error_" + field, title, "localization", unit, lines,
                     "Signed error: ground truth minus the estimated value. Heading uses the shortest angle.",
                     x_label="Localization sample", x_unit="")
        metrics = helper.metrics_dict()
        if metrics:
            for source, prefix in [("gnss_raw_vs_ground_truth", "GNSS"),
                                   ("kalman_filter_vs_ground_truth", "Kalman")]:
                for field, unit in [("x", "m"), ("y", "m"), ("yaw", "deg")]:
                    self.metrics.append(metric(source + "_" + field, f"{prefix} {field.upper()} mean error",
                                               metrics[source][f"{field}_mean_abs_error_{unit}"], unit))
        return metrics

    def kinematics(self):
        helper = self.vm.agent.debug_helper
        for key, title, unit, field in [("planner_speed", "Planner speed", "m/s", "speed_list"),
                                       ("planner_acceleration", "Planner acceleration", "m/s²", "acc_list"),
                                       ("ttc", "Time to collision", "s", "ttc_list")]:
            values = list(getattr(helper, field)[0])
            if key == "ttc":
                values = [v if v < 1000 else None for v in values]
            self.add(key, title, "safety" if key == "ttc" else "motion", unit,
                     [series(key, title, range(len(values)), values)],
                     "Planner samples after its 100-update warm-up. TTC ≥ 1000 s means no predicted collision and is omitted.",
                     x_label="Planner sample after warm-up", x_unit="")

    def cooperation(self):
        history = list(getattr(self.vm, "rsu_merge_history", []))
        times = [e[0] * self.dt for e in history]
        cumulative, total = [], 0
        for entry in history:
            total += entry[2]
            cumulative.append(total)
        self.add("rsu_coverage", "RSU coverage", "cooperation", "", [
            series("coverage", "RSU in range", times, [int(e[1]) for e in history])
        ], "1 = at least one roadside unit is within range.", kind="step", y_label="In range")
        self.add("rsu_objects", "Objects received from RSUs", "cooperation", "objects", [
            series("merged", "Cumulative merged objects", times, cumulative)
        ])
        if history:
            self.metrics.append(metric("rsu_coverage", "RSU coverage",
                                       100 * sum(bool(e[1]) for e in history) / len(history), "%"))

    def platooning(self):
        helper = self.vm.agent.debug_helper
        for field, key, label, unit in [("time_gap_list", "time_gap", "Platoon time gap", "s"),
                                        ("dist_gap_list", "distance_gap", "Platoon distance gap", "m")]:
            for index, values in enumerate(getattr(helper, field, [])):
                self.add(f"{key}_{index}", label, "platooning", unit, [
                    series(key, label, range(len(values)), [v if v < 100 else None for v in values])
                ], "Values ≥ 100 are unavailable and shown as gaps.",
                    x_label="Platoon sample after warm-up", x_unit="")
