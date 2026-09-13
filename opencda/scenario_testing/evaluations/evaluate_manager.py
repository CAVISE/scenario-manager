# -*- coding: utf-8 -*-
# Original author: Runsheng Xu <rxx3386@ucla.edu>
# License: TDG-Attribution-NonCommercial-NoDistrib
"""Persist evaluation samples and metrics; the browser renders the charts."""
import json
import math
from pathlib import Path

from app.chart_schema import CHARTS_NAME, ChartDocument
from app.config import get_settings
from opencda.scenario_testing.evaluations.chart_data import VehicleCharts, finite
from opencda.scenario_testing.evaluations.utils import lprint


def json_safe(value):
    """Convert non-finite diagnostics to null for standards-compliant JSON."""
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]
    if value is None or isinstance(value, (str, bool, int)):
        return value
    return finite(value)


def write_json(path, data):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(json_safe(data), ensure_ascii=False,
                                    allow_nan=False), encoding='utf-8')
    temporary.replace(path)


class EvaluationManager:
    def __init__(self, cav_world, script_name, current_time,
                 fixed_delta_seconds=0.05, weather_report=None):
        if not math.isfinite(fixed_delta_seconds) or fixed_delta_seconds <= 0:
            raise ValueError('fixed_delta_seconds must be positive and finite')
        self.cav_world = cav_world
        self.fixed_delta_seconds = fixed_delta_seconds
        self.weather_report = weather_report
        self.run_id = script_name + '_' + current_time
        root = get_settings().eval_dir.resolve()
        directory = (root / self.run_id).resolve()
        if directory.parent != root:
            raise ValueError('Invalid run directory')
        directory.mkdir(parents=True, exist_ok=True)
        self.eval_save_path = str(directory)

    def evaluate(self):
        directory = Path(self.eval_save_path)
        log_file = str(directory / 'log.txt')
        document = {
            'schema_version': 1,
            'run_id': self.run_id,
            'fixed_delta_seconds': self.fixed_delta_seconds,
            'elapsed_seconds': self.cav_world.global_clock * self.fixed_delta_seconds,
            'actors': [], 'charts': [], 'warnings': [],
        }
        localization_metrics = []
        for vm in self.cav_world.get_vehicle_managers().values():
            collector = VehicleCharts(vm, self.fixed_delta_seconds)
            actor_id = collector.actor_id
            lprint(log_file, f'*********** Vehicle {actor_id} ***********')
            for module in ('planning', 'safety', 'localization', 'kinematics',
                           'cooperation', 'platooning'):
                # A failed module/vehicle must not discard other recorded data.
                try:
                    metrics = getattr(collector, module)()
                    if module == 'localization' and metrics:
                        localization_metrics.append(metrics)
                except Exception as exc:
                    warning = f'Vehicle {actor_id}: {module} data is incomplete.'
                    document['warnings'].append(warning)
                    lprint(log_file, f'{warning} {exc}')
            document['actors'].append({
                'id': actor_id,
                'label': getattr(vm, 'name', None) or f'Vehicle {actor_id}',
                'metrics': collector.metrics,
            })
            document['charts'].extend(collector.charts)
            for item in collector.metrics:
                lprint(log_file, f"{item['label']}: {item['value']} {item['unit']}")
            # Preserve detailed collision diagnostics alongside chart summaries.
            safety = getattr(vm, 'safety_manager', None)
            for tick, status in getattr(safety, 'status_queue', []):
                if status.get('collision'):
                    lprint(log_file, f'Collision at tick {tick}: {status}')
                    break
            for sensor in getattr(safety, 'sensors', []):
                if getattr(sensor, 'collided_frame', -1) != -1:
                    lprint(log_file, f"Collision frame: {sensor.collided_frame}; "
                           f"other actor: {getattr(sensor, 'last_other_actor', None)}; "
                           f"location: {getattr(sensor, 'last_collision_event_loc', None)}")

        lprint(log_file, '*********** Weather ***********')
        lprint(log_file, json.dumps(json_safe(self.weather_report), ensure_ascii=False))
        # Validate before publishing. Atomic replacement prevents readers from
        # seeing a truncated JSON file, including after a process restart.
        validated = ChartDocument.model_validate(document)
        write_json(directory / CHARTS_NAME, validated.model_dump())
        write_json(directory / 'metrics.json', {
            'localization': localization_metrics,
            'weather': self.weather_report,
            'vehicles': document['actors'],
        })
