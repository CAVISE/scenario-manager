import { Divider, Stack } from '@mui/material';
import OpenCDATabRareSections from './OpenCDAAdvancedSections';
import { BackgroundTrafficSection } from './components/BackgroundTrafficSection';
import { BlueprintSection } from './components/BlueprintSection';
import { ColorPickerSection } from './components/ColorPickerSection';
import { ExportProfileSection } from './components/ExportProfileSection';
import { LidarDropoffSection } from './components/LidarDropoffSection';
import { LocalPlannerSection } from './components/LocalPlannerSection';
import { RSUSection } from './components/RSUSection';
import { GNSSNoiseSection } from './components/GNSSNoiseSection';
import { SUMOSection } from './components/SUMOSection';
import { V2XSection } from './components/V2XSection';
import { VehicleBehaviorSection } from './components/VehicleBehaviorSection';
import { VehicleSensingSection } from './components/VehicleSensingSection';
import { useOpenCDAConfig } from './hooks/useOpenCDAConfig';

export default function OpenCDATab() {
  const { oc, baseColor, updateSimConfigOpenCDA, applyAimCheckDefaults } =
    useOpenCDAConfig();

  return (
    <Stack spacing={2}>
      <ExportProfileSection
        exportProfile={oc.export_profile}
        onExportProfileChange={(val) =>
          updateSimConfigOpenCDA({ export_profile: val })
        }
        onLoadAimDefaults={applyAimCheckDefaults}
      />

      <ColorPickerSection
        color={baseColor}
        hasColor={oc.vehicle_base_color != null}
        onColorToggle={(enabled) =>
          updateSimConfigOpenCDA({
            vehicle_base_color: enabled
              ? ([122, 156, 111] as [number, number, number])
              : undefined,
          })
        }
        onColorChange={(newColor) =>
          updateSimConfigOpenCDA({ vehicle_base_color: newColor })
        }
      />

      <Divider />

      <BlueprintSection
        useMultiClass={oc.use_multi_class_bp}
        bpMetaPath={oc.bp_meta_path}
        classProbabilities={oc.bp_class_sample_prob}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <V2XSection
        enabled={oc.v2x_enabled}
        range={oc.v2x_communication_range}
        positionSource={oc.v2x_position_source}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <VehicleBehaviorSection
        maxSpeed={oc.max_speed}
        tailgateSpeed={oc.tailgate_speed}
        safetyTime={oc.safety_time}
        emergencyParam={oc.emergency_param}
        collisionTimeAhead={oc.collision_time_ahead}
        sampleResolution={oc.sample_resolution}
        speedLimDist={oc.speed_lim_dist}
        speedDecrease={oc.speed_decrease}
        overtakeCounterRecover={oc.overtake_counter_recover}
        ignoreTrafficLight={oc.ignore_traffic_light}
        overtakeAllowed={oc.overtake_allowed}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <LocalPlannerSection
        bufferSize={oc.local_planner.buffer_size}
        trajectoryUpdateFreq={oc.local_planner.trajectory_update_freq}
        waypointUpdateFreq={oc.local_planner.waypoint_update_freq}
        minDist={oc.local_planner.min_dist}
        trajectoryDt={oc.local_planner.trajectory_dt}
        debug={oc.local_planner.debug}
        debugTrajectory={oc.local_planner.debug_trajectory}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <VehicleSensingSection
        cameraVisualize={oc.vehicle_camera_visualize}
        camNum={oc.vehicle_cam_num}
        lidarChannels={oc.lidar_channels}
        lidarRange={oc.lidar_range}
        lidarPointsPerSecond={oc.lidar_points_per_second}
        lidarRotationFrequency={oc.lidar_rotation_frequency}
        lidarUpperFov={oc.lidar_upper_fov}
        lidarLowerFov={oc.lidar_lower_fov}
        perceptionActivate={oc.perception_activate}
        localizationActivate={oc.localization_activate}
        localizationSource={oc.localization_navigation_source}
        lidarVisualize={oc.lidar_visualize}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <LidarDropoffSection
        dropoffGeneralRate={oc.lidar_sim.dropoff_general_rate}
        dropoffIntensityLimit={oc.lidar_sim.dropoff_intensity_limit}
        dropoffZeroIntensity={oc.lidar_sim.dropoff_zero_intensity}
        noiseStddev={oc.lidar_sim.noise_stddev}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <GNSSNoiseSection
        altStddev={oc.gnss_noise.alt_stddev}
        latStddev={oc.gnss_noise.lat_stddev}
        lonStddev={oc.gnss_noise.lon_stddev}
        debugAnimation={oc.vehicle_localization_debug_animation}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <RSUSection
        rsu_lidar_channels={oc.rsu_lidar_channels}
        rsu_lidar_range={oc.rsu_lidar_range}
        rsu_camera_visualize={oc.rsu_camera_visualize}
        rsu_cam_num={oc.rsu_cam_num}
        rsu_perception_activate={oc.rsu_perception_activate}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <SUMOSection
        host={oc.sumo_host}
        port={oc.sumo_port}
        clientOrder={oc.sumo_client_order}
        gui={oc.sumo_gui}
        onUpdate={updateSimConfigOpenCDA}
      />

      <Divider />

      <BackgroundTrafficSection
        enabled={oc.enable_background_traffic}
        random={oc.bg_traffic_random}
        spawnRange={oc.bg_spawn_range}
        globalSpeedPerc={oc.global_speed_perc}
        vehicleNum={oc.bg_vehicle_num}
        globalDistance={oc.bg_global_distance}
        osmMode={oc.bg_set_osm_mode}
        ignoreLightsPerc={oc.ignore_lights_percentage}
        ignoreSignsPerc={oc.bg_ignore_signs_percentage}
        ignoreWalkersPerc={oc.bg_ignore_walkers_percentage}
        autoLaneChange={oc.auto_lane_change}
        onUpdate={updateSimConfigOpenCDA}
      />

      <OpenCDATabRareSections oc={oc} update={updateSimConfigOpenCDA} />
    </Stack>
  );
}
