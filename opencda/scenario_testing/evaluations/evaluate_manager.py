# -*- coding: utf-8 -*-
"""
Evaluation manager.
"""
import itertools
import matplotlib
matplotlib.use('Agg')  # headless backend — no display required
import math
# Author: Runsheng Xu <rxx3386@ucla.edu>
# License: TDG-Attribution-NonCommercial-NoDistrib

import os
import carla.libcarla
import matplotlib.pyplot as plt

from opencda.scenario_testing.evaluations.utils import lprint


class EvaluationManager(object):
    """
    Evaluation manager to manage the analysis of the
    results for different modules.

    Parameters
    ----------
    cav_world : opencda object
        The CavWorld object that contains all CAVs' information.

    script_name : str
        The current scenario testing name. E.g, single_town06_carla

    current_time : str
        Current timestamp, used to name the output folder.

    Attributes
    ----------
    eval_save_path : str
        The final output folder name.

    """

    def __init__(self, cav_world, script_name, current_time):
        self.cav_world = cav_world
        self.fixed_delta_seconds = 0.05
        self.skip_head = 60
        self.dest_reach_threshold = 5.0  # meters
        current_path = os.path.dirname(os.path.realpath(__file__))

        self.eval_save_path = os.path.join(
            current_path, '../../../evaluation_outputs',
            script_name + '_' + current_time)
        if not os.path.exists(self.eval_save_path):
            os.makedirs(self.eval_save_path)

    def dist(self, p, q):
        return p.transform.location.distance(q.transform.location)

    @staticmethod
    def _fmt_xyz(value):
        if value is None:
            return None
        if hasattr(value, 'x'):
            return f"({value.x:.2f},{value.y:.2f},{value.z:.2f})"
        return f"({value[0]:.2f},{value[1]:.2f},{value[2]:.2f})"

    def _collision_extra(self, status):
        details = []
        other = status.get('collision_with')
        if other:
            details.append(f"first hit: {other}")
        other_id = status.get('collision_with_id')
        if other_id is not None:
            details.append(f"other_id={other_id}")
        for label_name, status_key in (
                ('event_loc', 'collision_event_loc'),
                ('ego_loc', 'ego_loc_at_collision'),
                ('other_loc', 'collision_loc')):
            loc_text = self._fmt_xyz(status.get(status_key))
            if loc_text:
                details.append(f"{label_name}={loc_text}")
        return ", " + ", ".join(details) if details else ""

    @staticmethod
    def _late_collision_status(vm):
        safety_manager = getattr(vm, 'safety_manager', None)
        for sensor in getattr(safety_manager, 'sensors', []):
            frame = getattr(sensor, 'collided_frame', -1)
            if frame == -1:
                continue
            return {
                'collision_with': getattr(sensor, 'last_other_actor', None),
                'collision_with_id': getattr(sensor, 'last_other_actor_id', None),
                'collision_loc': getattr(sensor, 'last_collision_loc', None),
                'collision_event_loc': getattr(sensor, 'last_collision_event_loc', None),
                'ego_loc_at_collision': getattr(sensor, 'last_ego_loc', None),
                'collision_frame': frame,
            }
        return None

    def evaluate(self):
        """
        Evaluate performance of all modules by plotting and writing the
        statistics into the log file.
        """
        log_file = os.path.join(self.eval_save_path, 'log.txt')

        self.planning_eval(log_file)
        print('Planning Evaluation Done.')

        self.localization_eval(log_file)
        print('Localization Evaluation Done.')

        self.kinematics_eval(log_file)
        print('Kinematics Evaluation Done.')

        self.platooning_eval(log_file)
        print('Platooning Evaluation Done.')

    def calculate_route_dist(self, route):
        route_dist = 0.0
        for i in range(len(route) - 1):
            prev = route[i][0] if isinstance(route[i], (list, tuple)) else route[i]
            cur = route[i + 1][0] if isinstance(route[i + 1], (list, tuple)) else route[i + 1]
            if isinstance(prev, carla.libcarla.Waypoint):
                route_dist += prev.transform.location.distance(cur.transform.location)
            else:
                route_dist += prev.location.distance(cur.location)
        return route_dist

    @staticmethod
    def plot_3d(timestamp, acc_x_axis, acc_y_axis, acc_z_axis, acc_magnitude,
                gyro_x_axis, gyro_y_axis, gyro_z_axis, gyro_magnitude):
        fig, axes = plt.subplots(nrows=2, ncols=4)
        ax1, ax2, ax3, ax4, ax5, ax6, ax7, ax8 = axes.flatten()
        ax1.plot(timestamp, acc_x_axis, label='Accelerometer X axis')
        ax2.plot(timestamp, acc_y_axis, label='Accelerometer Y axis')
        ax3.plot(timestamp, acc_z_axis, label='Accelerometer Z axis')
        ax4.plot(timestamp, acc_magnitude, label='Accelerometer Magnitude')
        ax5.plot(timestamp, gyro_x_axis, 'r', label='Gyroscope X axis')
        ax6.plot(timestamp, gyro_y_axis, 'r', label='Gyroscope Y axis')
        ax7.plot(timestamp, gyro_z_axis, 'r', label='Gyroscope Z axis')
        ax8.plot(timestamp, gyro_magnitude, 'r', label='Gyroscope Magnitude')
        ax1.set_xlabel('timestamp')
        ax1.set_ylabel('x')
        ax2.set_xlabel('timestamp')
        ax2.set_ylabel('y')
        ax3.set_xlabel('timestamp')
        ax3.set_ylabel('z')
        ax4.set_xlabel('timestamp')
        ax4.set_ylabel('Accelerometer Signed Forward Magnitude')
        ax5.set_xlabel('timestamp')
        ax5.set_ylabel('x')
        ax6.set_xlabel('timestamp')
        ax6.set_ylabel('y')
        ax7.set_xlabel('timestamp')
        ax7.set_ylabel('z')
        ax8.set_xlabel('timestamp')
        ax8.set_ylabel('Gyroscope Magnitude')
        for axis in axes.flatten():
            axis.legend()
        fig.suptitle('Plots with Accelerometer and Gyroscope')
        plt.subplots_adjust(wspace=0.5)
        return fig

    @staticmethod
    def plot_2d(x_axis, y_axis, x_label, y_label, legend_name, title_name):
        fig, ax = plt.subplots()
        ax.plot(x_axis, y_axis, label=legend_name, marker='o', markersize=4)
        ax.set_title(title_name)
        ax.set_xlabel(x_label)
        ax.set_ylabel(y_label)
        ax.legend()
        return fig

    @staticmethod
    def plot_hazard_condition(timestamp, collide, off_road, stuck, over_light):
        fig, ax = plt.subplots()
        ax.plot(timestamp, collide, linestyle='None', marker='o', label='Collide')
        ax.plot(timestamp, off_road, linestyle='None', marker='x', label='Off Road')
        ax.plot(timestamp, stuck, linestyle='None', marker='*', label='Stuck')
        ax.plot(timestamp, over_light, linestyle='None', marker='d', label='Ran over Traffic Light')
        plt.ylim(-0.2, 1.5)
        plt.xlabel("Time")
        plt.ylabel("Event Occurrence")
        plt.title("Time Series with Event Occurrence")
        plt.legend()
        return fig

    @staticmethod
    def plot_routes(real_route_transforms, planned_route_transforms,
                    gt_route_transforms=None):
        """
        Plot three layers on one figure:
          - Red ×   : initial planned route waypoints
          - Green ─  : ground-truth physical path (what the vehicle actually did)
          - Blue ·   : GNSS-reported path (what the vehicle *thought* it was doing)

        When gt_route_transforms is None (no attack / legacy call) only the
        first two layers are drawn and the title stays generic.
        """
        fig, ax = plt.subplots(figsize=(10, 7))

        # --- GNSS-reported (noisy) path ---
        real_x = [t.location.x for t in real_route_transforms]
        real_y = [t.location.y for t in real_route_transforms]
        ax.scatter(real_y, real_x, marker='o', s=8, alpha=0.5,
                   color='steelblue', label='GNSS-reported position (spoofed)')

        # --- planned route ---
        plan_x = [t.location.x for t in planned_route_transforms]
        plan_y = [t.location.y for t in planned_route_transforms]
        ax.scatter(plan_y, plan_x, marker='x', color='red', s=50,
                   label='Planned route waypoints')

        # --- ground-truth physical path ---
        if gt_route_transforms:
            gt_x = [t.location.x for t in gt_route_transforms]
            gt_y = [t.location.y for t in gt_route_transforms]
            ax.plot(gt_y, gt_x, color='green', linewidth=1.5, alpha=0.85,
                    label='Actual physical path (ground truth)')
            title = ('Route Comparison Under GNSS Spoofing Attack\n'
                     'Green = actual path  |  Blue = spoofed GNSS report  |  Red = planned')
        else:
            title = 'Actual Route / Initial Planned Route'

        ax.set_xlabel('Y (meters)')
        ax.set_ylabel('X (meters)')
        ax.set_title(title)
        ax.legend(loc='best', fontsize=8)
        ax.grid(True, alpha=0.3)

        all_x = real_x + plan_x + (gt_x if gt_route_transforms else [])
        all_y = real_y + plan_y + (gt_y if gt_route_transforms else [])
        if all_x and all_y:
            x_margin = max((max(all_x) - min(all_x)) * 0.1, 5)
            y_margin = max((max(all_y) - min(all_y)) * 0.1, 5)
            ax.set_xlim(min(all_y) - y_margin, max(all_y) + y_margin)
            ax.set_ylim(min(all_x) - x_margin, max(all_x) + x_margin)

        return fig

    def planning_eval(self, log_file):
        """
        Route planning related evaluation.

        Args:
            -log_file (File): The log file to write the data.
        """
        all_vms = self.cav_world.get_vehicle_managers()
        if not all_vms:
            lprint(log_file, "WARNING: No vehicle managers found, skipping planning eval.")
            return

        for vid, vm in all_vms.items():
            self._planning_eval_single(vm, log_file)
    def _planning_eval_single(self, vm, log_file):
        """Run planning evaluation for a single vehicle manager."""
        planned_route = vm.agent.initial_global_route
        gnss_route = vm.v2x_manager.ego_dynamic_trace
        gt_route = list(vm.gt_dynamic_trace) if hasattr(vm, 'gt_dynamic_trace') else []
        if not planned_route:
            lprint(log_file, f"WARNING: initial_global_route is None for CAV {vm.vehicle.id}, skipping.")
            return
        if not gnss_route:
            lprint(log_file, f"WARNING: ego_dynamic_trace is empty for CAV {vm.vehicle.id}, skipping.")
            return
        planned_dist = self.calculate_route_dist(planned_route)
        # Real distance must be physical ground-truth distance. The V2X trace
        # intentionally carries GNSS/spoofed ego_pos and can explode under an
        # attack; keep it only as a separate diagnostic.
        real_dist = self.calculate_route_dist(gt_route) if gt_route else self.calculate_route_dist(gnss_route)
        gnss_dist = self.calculate_route_dist(gnss_route)
        elapsed_s = self.cav_world.global_clock * self.fixed_delta_seconds
        actor_id = vm.vehicle.id
        lprint(log_file, "***********Planning Evaluation Module***********")
        lprint(log_file, f"Actor ID: {actor_id}")
        lprint(log_file, f"Planned distance: {planned_dist}")
        lprint(log_file, f"Real distance: {real_dist}")
        if gt_route:
            lprint(log_file, f"GNSS-reported distance: {gnss_dist}")
        lprint(log_file, f"Cav world ticks elapsed: {self.cav_world.global_clock}")
        lprint(log_file, f"Cav World time in seconds: {elapsed_s}")
        if gt_route:
            dest_loc = planned_route[-1][0].transform.location
            dist_to_dest = gt_route[-1].location.distance(dest_loc)
            lprint(log_file, f"Final GT distance to destination: {dist_to_dest}")
            lprint(log_file, "Success or not: ", "Yes" if dist_to_dest < self.dest_reach_threshold else "No")
        else:
            lprint(log_file, "Success or not: UNKNOWN (no gt_dynamic_trace on this vm)")
        timestamps = list(map(lambda e: e[2], gnss_route))
        imu_data = list(vm.safety_manager.imu_sensor.imu_data)
        safety_data = list(vm.safety_manager.status_queue)

        n = min(len(timestamps), len(imu_data))
        timestamps = timestamps[:n]
        imu_data = imu_data[:n]
        real_route_trimmed = list(gnss_route)[:n]

        skip = min(self.skip_head, max(10, len(timestamps) // 10))

        fig_velocity = self.plot_2d(
            timestamps[skip:],
            list(map(lambda e: e[1], real_route_trimmed))[skip:],
            'velocity', 'timestamp', 'velocity', 'velocity to timestamp plot'
        )
        fig_velocity.savefig(os.path.join(self.eval_save_path, f'{actor_id}_velocity.png'), dpi=100)
        plt.close(fig_velocity)

        fig_imu = self.plot_3d(
            timestamps[skip:],
            list(map(lambda e: e[0].x, imu_data))[skip:],
            list(map(lambda e: e[0].y, imu_data))[skip:],
            list(map(lambda e: e[0].z, imu_data))[skip:],
            list(map(lambda e: e[2], imu_data))[skip:],
            list(map(lambda e: e[1].x, imu_data))[skip:],
            list(map(lambda e: e[1].y, imu_data))[skip:],
            list(map(lambda e: e[1].z, imu_data))[skip:],
            list(map(lambda e: math.sqrt(e[1].x**2 + e[1].y**2 + e[1].z**2), imu_data))[skip:],
        )
        fig_imu.savefig(os.path.join(self.eval_save_path, f'{actor_id}_imu.png'), dpi=100)
        plt.close(fig_imu)

        fig_hazard = self.plot_hazard_condition(
            list(map(lambda e: e[0], safety_data))[skip:],
            list(map(lambda e: int(e[1]['collision']), safety_data))[skip:],
            list(map(lambda e: int(e[1]['offroad']), safety_data))[skip:],
            list(map(lambda e: int(e[1]['stuck']), safety_data))[skip:],
            list(map(lambda e: int(e[1]['ran_light']), safety_data))[skip:]
        )
        fig_hazard.savefig(os.path.join(self.eval_save_path, f'{actor_id}_hazard.png'), dpi=100)
        plt.close(fig_hazard)

        # Hazard totals over the FULL run (not the plot's skip_head-trimmed
        # slice) — this is the numeric answer to "did it actually break,
        # and when" without having to eyeball *_hazard.png.
        lprint(log_file, "--- Hazard summary (full run) ---")
        for key, label in (('collision', 'Collisions'),
                           ('offroad', 'Off-road events'),
                           ('stuck', 'Stuck events'),
                           ('ran_light', 'Ran traffic light events')):
            flags = [bool(e[1][key]) for e in safety_data]
            count = sum(flags)
            if count:
                first_idx = flags.index(True)
                first_t = safety_data[first_idx][0]
                extra = ""
                status = safety_data[first_idx][1]
                if key == 'collision':
                    extra = self._collision_extra(status)
                elif key == 'offroad':
                    loc_text = self._fmt_xyz(status.get('offroad_loc'))
                    if loc_text:
                        extra = f", loc={loc_text}"
                lprint(log_file, f"{label}: {count} tick(s), first at t={first_t}{extra}")
            else:
                late_collision = None
                if key == 'collision':
                    late_collision = self._late_collision_status(vm)
                if late_collision:
                    extra = self._collision_extra(late_collision)
                    frame = late_collision.get('collision_frame')
                    frame_text = f", first frame={frame}" if frame is not None else ""
                    lprint(log_file, f"{label}: 1 late/unqueued event{frame_text}{extra}")
                else:
                    lprint(log_file, f"{label}: 0")

        # RSU cooperative-perception participation — lets you tell "RSU had
        # nothing new to add" apart from "RSU never registered as nearby"
        # when comparing an RSU-present run against an RSU-absent one.
        rs = vm.rsu_merge_stats
        pct_in_range = (100.0 * rs['ticks_rsu_in_range'] / rs['ticks_total']
                        if rs['ticks_total'] else 0.0)
        lprint(log_file, "--- RSU cooperative perception ---")
        lprint(log_file, f"Ticks with >=1 RSU in range: {rs['ticks_rsu_in_range']}/{rs['ticks_total']} ({pct_in_range:.1f}%)")
        lprint(log_file, f"Total objects merged from RSU perception: {rs['objects_merged_total']}")

        gt_route = list(vm.gt_dynamic_trace) if hasattr(vm, 'gt_dynamic_trace') else []

        fig_routes = self.plot_routes(
            list(map(lambda e: e[0], real_route_trimmed)),
            list(map(lambda e: e[0].transform, planned_route)),
            gt_route_transforms=gt_route if gt_route else None,
        )
        fig_routes.savefig(os.path.join(self.eval_save_path, f'{actor_id}_routes.png'), dpi=100)
        plt.close(fig_routes)

    def kinematics_eval(self, log_file):
        """
        vehicle kinematics related evaluation.

        Args:
            -log_file (File): The log file to write the data.

        """
        lprint(log_file, "***********Kinematics Module***********")
        for vid, vm in self.cav_world.get_vehicle_managers().items():
            actor_id = vm.vehicle.id
            lprint(log_file, 'Actor ID: %d' % actor_id)

            loc_debug_helper = vm.agent.debug_helper
            figure, perform_txt = loc_debug_helper.evaluate()

            # save plotting
            figure_save_path = os.path.join(
                self.eval_save_path,
                '%d_kinematics_plotting.png' %
                actor_id)
            figure.savefig(figure_save_path, dpi=100)

            lprint(log_file, perform_txt)

    def localization_eval(self, log_file):
        """
        Localization module evaluation.

        Args:
            -log_file (File): The log file to write the data.
        """
        lprint(log_file, "***********Localization Module***********")
        for vid, vm in self.cav_world.get_vehicle_managers().items():
            actor_id = vm.vehicle.id
            lprint(log_file, 'Actor ID: %d' % actor_id)

            loc_debug_helper = vm.localizer.debug_helper
            figure, perform_txt = loc_debug_helper.evaluate()

            # save plotting
            figure_save_path = os.path.join(
                self.eval_save_path,
                '%d_localization_plotting.png' %
                actor_id)
            figure.savefig(figure_save_path, dpi=100)

            # save log txt
            lprint(log_file, perform_txt)

    def platooning_eval(self, log_file):
        """
        Platooning evaluation.

        Args:
            -log_file (File): The log file to write the data.

        """
        lprint(log_file, "***********Platooning Analysis***********")

        for pmid, pm in self.cav_world.get_platoon_dict().items():
            lprint(log_file, 'Platoon ID: %s' % pmid)
            figure, perform_txt = pm.evaluate()

            # save plotting
            figure_save_path = os.path.join(
                self.eval_save_path,
                '%s_platoon_plotting.png' %
                pmid)
            figure.savefig(figure_save_path, dpi=100)

            # save log txt
            lprint(log_file, perform_txt)
