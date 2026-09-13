import json
from types import SimpleNamespace as NS

import pytest

from app.chart_schema import CHARTS_NAME, ChartDocument
from app.routers import simulation
from app.run_results import MANIFEST_NAME
from opencda.scenario_testing.evaluations.chart_data import VehicleCharts, series
from opencda.scenario_testing.evaluations.evaluate_manager import EvaluationManager


def transform(x, y=0):
    return NS(location=NS(x=x, y=y, z=0))


def vehicle(actor_id=7):
    helper = NS(speed_list=[[1, 2]], acc_list=[[0, 20]], ttc_list=[[1000, 4]])
    localizer = NS(**{
        prefix + '_' + field: values
        for prefix in ('gnss', 'gt', 'filter')
        for field, values in [('x', [0, 1]), ('y', [0, 0]),
                              ('yaw', [179, -179]), ('spd', [1, 2])]
    }, metrics_dict=lambda: None)
    return NS(
        vehicle=NS(id=actor_id),
        agent=NS(initial_global_route=[(NS(transform=transform(0)), None),
                                       (NS(transform=transform(10)), None)], debug_helper=helper),
        v2x_manager=NS(transmitted_dynamic_trace=[(transform(0), 3.6, 1),
                                                 (transform(8), 7.2, 2)]),
        gt_dynamic_trace=[transform(0), transform(3)],
        safety_manager=NS(status_queue=[(1, {'collision': False}), (2, {'collision': True})],
                          imu_sensor=NS(imu_data=[]), sensors=[]),
        localizer=NS(debug_helper=localizer),
        rsu_merge_history=[(1, False, 0), (2, True, 2)],
    )


@pytest.fixture
def result_root(monkeypatch, tmp_path):
    settings = NS(eval_dir=tmp_path)
    monkeypatch.setattr(simulation, 'get_settings', lambda: settings)
    monkeypatch.setattr('opencda.scenario_testing.evaluations.evaluate_manager.get_settings', lambda: settings)
    monkeypatch.setattr(simulation, 'simulation_state', {'running': False, 'run_id': None})
    return tmp_path


def evaluate(root, vehicles=None):
    world = NS(global_clock=2, get_vehicle_managers=lambda: vehicles or {'a': vehicle()})
    manager = EvaluationManager(world, 'Town01', 'test', fixed_delta_seconds=0.1)
    manager.evaluate()
    directory = root / 'Town01_test'
    (directory / MANIFEST_NAME).write_text(json.dumps({'outcome': 'partial', 'tick': 2, 'max_ticks': 10}))
    return directory


def test_short_run_exports_full_samples_in_seconds_without_png(result_root):
    directory = evaluate(result_root)
    document = ChartDocument.model_validate_json((directory / CHARTS_NAME).read_text())
    assert document.elapsed_seconds == 0.2
    charts = {chart.id: chart for chart in document.charts}
    assert charts['speed'].series[0].points == [(0.1, 3.6), (0.2, 7.2)]
    assert charts['speed'].x_axis.unit == 's'
    assert charts['speed'].y_axis.unit == 'km/h'
    lines = {line.id: line.points for line in charts['distance'].series}
    assert lines['actual'][-1] == (0.2, 3.0)
    assert lines['transmitted'][-1] == (0.2, 8.0)
    assert lines['planned'] == [(0.1, 10.0), (0.2, 10.0)]
    assert charts['hazards'].series[0].points == [(0.1, 0), (0.2, 1)]
    assert charts['ttc'].series[0].points == [(0, None), (1, 4)]
    assert not list(directory.glob('*.png'))
    assert not list(directory.glob('*.tmp'))
    assert document.warnings == []


def test_chart_data_is_returned_from_disk_for_partial_runs(scenario_client, result_root):
    directory = evaluate(result_root)
    response = scenario_client.get('/api/results/Town01_test')
    assert response.status_code == 200
    assert response.json()['data'] == json.loads((directory / CHARTS_NAME).read_text())
    assert response.json()['data_error'] is None
    assert CHARTS_NAME in [entry['filename'] for entry in response.json()['files']]


@pytest.mark.parametrize('contents', ['{broken', '{"schema_version": 999}', '[]'])
def test_invalid_chart_data_preserves_downloads(scenario_client, result_root, contents):
    directory = evaluate(result_root)
    (directory / CHARTS_NAME).write_text(contents)
    response = scenario_client.get('/api/results/Town01_test')
    assert response.status_code == 200
    assert response.json()['data'] is None
    assert response.json()['data_error']
    assert response.json()['files']


def test_legacy_result_has_no_invented_chart_data(scenario_client, result_root):
    directory = result_root / 'legacy'
    directory.mkdir()
    (directory / 'plot.png').write_bytes(b'old chart')
    response = scenario_client.get('/api/results/legacy')
    assert response.json()['data'] is None
    assert response.json()['data_error'] is None
    assert len(response.json()['files']) == 1


def test_chart_symlinks_and_wrong_run_are_not_served(scenario_client, result_root):
    directory = evaluate(result_root)
    chart_path = directory / CHARTS_NAME
    wrong_run = json.loads(chart_path.read_text())
    wrong_run['run_id'] = 'another-run'
    chart_path.write_text(json.dumps(wrong_run))
    assert scenario_client.get('/api/results/Town01_test').json()['data_error']
    chart_path.rename(result_root / 'outside.json')
    chart_path.symlink_to(result_root / 'outside.json')
    response = scenario_client.get('/api/results/Town01_test').json()
    assert response['data'] is None
    assert CHARTS_NAME not in [entry['filename'] for entry in response['files']]


def test_invalid_values_become_gaps_and_missing_gt_is_not_reported_as_real_distance():
    assert series('s', 'S', [0, 1, 2, float('nan')], [3, float('inf'), 4, 5])['points'] == [[0, 3], [1, None], [2, 4]]
    vm = vehicle()
    vm.gt_dynamic_trace = []
    collector = VehicleCharts(vm, 0.1)
    collector.planning()
    chart = next(item for item in collector.charts if item['id'] == 'distance')
    assert 'actual' not in [line['id'] for line in chart['series']]
    assert next(item for item in collector.metrics if item['id'] == 'distance')['value'] is None


def test_one_broken_module_does_not_discard_other_vehicles(result_root):
    broken = vehicle(8)
    broken.localizer = None
    directory = evaluate(result_root, {'a': broken, 'b': vehicle(9)})
    data = json.loads((directory / CHARTS_NAME).read_text())
    assert len(data['actors']) == 2
    assert data['warnings'] == ['Vehicle 8: localization data is incomplete.']
    assert any(chart['actor_id'] == '9' and chart['category'] == 'localization' for chart in data['charts'])


def test_heading_error_wraps_and_imu_is_not_given_invented_timestamps():
    vm = vehicle()
    vm.localizer.debug_helper.gnss_yaw = [-179, 179]
    vm.safety_manager.imu_sensor.imu_data = [(NS(x=1, y=2, z=3), NS(x=0, y=0, z=1), 1)]
    collector = VehicleCharts(vm, 0.1)
    collector.localization()
    collector.safety()
    charts = {chart['id']: chart for chart in collector.charts}
    assert charts['error_yaw']['series'][0]['points'] == [[0, -2], [1, 2]]
    assert charts['acceleration']['x_axis'] == {'label': 'IMU sample', 'unit': ''}
    assert charts['acceleration']['series'][0]['points'] == [[0, 1]]
