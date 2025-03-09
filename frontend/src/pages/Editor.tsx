import React, { useEffect } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three-stdlib';
import { TransformControls } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';
import * as dat from 'dat.gui';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';


declare function libOpenDrive(): Promise<any>;

const Editor: React.FC = () => {
  let addCubeModeButton: HTMLButtonElement | null = null;
  let translateButton: HTMLButtonElement | null = null;
  let rotateButton: HTMLButtonElement | null = null;
  let scaleButton: HTMLButtonElement | null = null;
  let deleteCubeModeButton: HTMLButtonElement | null = null;
  let addPointModeButton: HTMLButtonElement | null = null;
  let deletePointModeButton: HTMLButtonElement | null = null;
  let rotatePosCubeButton: HTMLButtonElement | null = null;
  let gui: dat.GUI | null = null;

  function onWindowResize() {
  }
  function onDocumentMouseMove(event: MouseEvent) {
  }
  function onDocumentMouseDbClick(event: MouseEvent) {
  }
  function onMouseDownAttach(event: MouseEvent) {
  }

  useEffect(() => {
    const PARAMS: any = {
      load_file: () => {
        const input = document.getElementById('xodr_file_input') as HTMLInputElement;
        if (input) input.click();
      },
      resolution: 0.3,
      ref_line: true,
      roadmarks: true,
      wireframe: false,
      spotlight: true,
      fitView: () => {
        fitViewToObj(refline_lines);
      },
      lateralProfile: true,
      laneHeight: true,
      reload_map: () => {
        reloadOdrMap();
      },
      view_mode: 'Default',
      isAddCubeModeActive: false,
      isAddPointModeActive: false,
      addCubeMode: function () {
        this.isAddCubeModeActive = !this.isAddCubeModeActive;
        if (this.isAddCubeModeActive) {
          showModeLabel();
          this.isAddPointModeActive = false;
        } else {
          hideModeLabel();
        }
      },
      deleteCube: function () {
        if (disposable_objs.length > 0) {
          const lastObj = disposable_objs[disposable_objs.length - 1];
          if (lastObj && !lastObj.isDisposing) {
            lastObj.isDisposing = true;
            scene.remove(lastObj);
            disposable_objs.pop();
            if (lastObj.geometry) lastObj.geometry.dispose();
            if (lastObj.material) lastObj.material.dispose();
          }
          if (transformControls.object === lastObj) {
            transformControls.detach();
          }
          scene.remove(lastObj);
        }
      },
      addPointMode: function () {
        this.isAddPointModeActive = !this.isAddPointModeActive;
        if (this.isAddPointModeActive) {
          showModeLabel();
          this.isAddCubeModeActive = false;
        } else {
          hideModeLabel();
        }
      },
      deletePoint: function () {
        if (points_objs.length > 0) {
          const lastObj = points_objs[points_objs.length - 1];
          if (lastObj && !lastObj.isDisposing) {
            lastObj.isDisposing = true;
            scene.remove(lastObj);
            points_objs.pop();
            if (lastObj.geometry) lastObj.geometry.dispose();
            if (lastObj.material) lastObj.material.dispose();
          }
        }
      },
      rotatePosCube: function () {
        if (disposable_objs.length === 0) return;
        const lstCb = disposable_objs[disposable_objs.length - 1];
        lstCb.rotation.z += Math.PI / 18;
      },
      translateMode: () => {
        transformControls.setMode('translate');
      },
      rotateMode: () => {
        transformControls.setMode('rotate');
      },
      scaleMode: () => {
        transformControls.setMode('scale');
      }
    };

    let ModuleOpenDrive: any = null;
    let OpenDriveMap: any = null;
    let refline_lines: THREE.LineSegments;
    let road_network_mesh: THREE.Mesh;
    let roadmarks_mesh: THREE.Mesh;
    let lane_outline_lines: THREE.LineSegments;
    let roadmark_outline_lines: THREE.LineSegments;
    let ground_grid: THREE.GridHelper;
    let disposable_objs: any[] = [];
    let points_objs: any[] = [];
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const spotlight_info = document.getElementById('spotlight_info') as HTMLElement;
    let INTERSECTED_LANE_ID = 0xffffffff;
    let INTERSECTED_ROADMARK_ID = 0xffffffff;
    let spotlight_paused = false;
    let isAddCubeModeActive = false;
    let isAddPointModeActive = false;
    let stIntrvl: any;
    function loadCar(position: THREE.Vector3, normal: THREE.Vector3) {
      const loader = new GLTFLoader();
      loader.load(
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb',
        (gltf) => {
          const car = gltf.scene;
          car.scale.set(5, 5, 5);
          car.position.copy(position);
          car.position.z += 0.01;
          const up = new THREE.Vector3(0, 0, 1);
          const quat = new THREE.Quaternion().setFromUnitVectors(up, normal.normalize());
          car.quaternion.copy(quat);
          scene.add(car);
          transformControls.attach(car);
          disposable_objs.push(car);
        }
      );
    }

    (function () {
      addCubeModeButton = document.createElement('button');
      addCubeModeButton.textContent = 'Добавить куб';
      addCubeModeButton.style.position = 'absolute';
      addCubeModeButton.style.top = '10px';
      addCubeModeButton.style.left = '20px';
      document.body.appendChild(addCubeModeButton);

      translateButton = document.createElement('button');
      translateButton.textContent = 'Перемещение';
      translateButton.style.position = 'absolute';
      translateButton.style.top = '160px';
      translateButton.style.left = '20px';
      document.body.appendChild(translateButton);

      rotateButton = document.createElement('button');
      rotateButton.textContent = 'Вращение';
      rotateButton.style.position = 'absolute';
      rotateButton.style.top = '190px';
      rotateButton.style.left = '20px';
      document.body.appendChild(rotateButton);

      scaleButton = document.createElement('button');
      scaleButton.textContent = 'Масштабирование';
      scaleButton.style.position = 'absolute';
      scaleButton.style.top = '220px';
      scaleButton.style.left = '20px';
      document.body.appendChild(scaleButton);

      deleteCubeModeButton = document.createElement('button');
      deleteCubeModeButton.textContent = 'Удалить последний куб';
      deleteCubeModeButton.style.position = 'absolute';
      deleteCubeModeButton.style.top = '40px';
      deleteCubeModeButton.style.left = '20px';
      document.body.appendChild(deleteCubeModeButton);

      addPointModeButton = document.createElement('button');
      addPointModeButton.textContent = 'Установить точку';
      addPointModeButton.style.position = 'absolute';
      addPointModeButton.style.top = '70px';
      addPointModeButton.style.left = '20px';
      document.body.appendChild(addPointModeButton);

      deletePointModeButton = document.createElement('button');
      deletePointModeButton.textContent = 'Удалить последнюю точку';
      deletePointModeButton.style.position = 'absolute';
      deletePointModeButton.style.top = '100px';
      deletePointModeButton.style.left = '20px';
      document.body.appendChild(deletePointModeButton);

      rotatePosCubeButton = document.createElement('button');
      rotatePosCubeButton.textContent = 'Положительный поворот куба';
      rotatePosCubeButton.style.position = 'absolute';
      rotatePosCubeButton.style.top = '130px';
      rotatePosCubeButton.style.left = '20px';
      document.body.appendChild(rotatePosCubeButton);

      addPointModeButton.addEventListener('click', () => {
        isAddPointModeActive = !isAddPointModeActive;
        isAddCubeModeActive = false;
        addCubeModeButton!.textContent = 'Добавить куб';
        addPointModeButton!.textContent = 'Режим добавления точек RSU';
      });
      deleteCubeModeButton.addEventListener('click', () => {
        if (disposable_objs.length > 0) {
          const lastObj = disposable_objs[disposable_objs.length - 1];
          if (lastObj && !lastObj.isDisposing) {
            lastObj.isDisposing = true;
            scene.remove(lastObj);
            disposable_objs.pop();
            if (lastObj.geometry) lastObj.geometry.dispose();
            if (lastObj.material) lastObj.material.dispose();
          }
        }
      });
      deletePointModeButton.addEventListener('click', () => {
        if (points_objs.length > 0) {
          const lastObj = points_objs[points_objs.length - 1];
          if (lastObj && !lastObj.isDisposing) {
            lastObj.isDisposing = true;
            scene.remove(lastObj);
            points_objs.pop();
            if (lastObj.geometry) lastObj.geometry.dispose();
            if (lastObj.material) lastObj.material.dispose();
          }
        }
      });
      addCubeModeButton.addEventListener('click', () => {
        isAddCubeModeActive = !isAddCubeModeActive;
        isAddPointModeActive = false;
        addPointModeButton!.textContent = 'Установить точку';
        if (isAddCubeModeActive) {
          addCubeModeButton!.textContent = 'Режим добавления куба';
        } else {
          addCubeModeButton!.textContent = 'Добавить куб';
        }
      });

      const COLORS = {
        road: 1.0,
        roadmark: 1.0,
        lane_outline: 0xffffff,
        roadmark_outline: 0xffffff,
        ref_line: 0x69f0ae,
        background: 0xffffff,
        lane_highlight: 0xffff00,
        roadmark_highlight: 0xffff00
      };

      window.addEventListener('resize', onWindowResize, false);
      window.addEventListener('mousemove', onDocumentMouseMove, false);
      window.addEventListener('dblclick', onDocumentMouseDbClick, false);

      const notyf = new Notyf({
        duration: 3000,
        position: { x: 'left', y: 'bottom' },
        types: [{ type: 'info', background: '#607d8b', icon: false }]
      });

      const renderer = new THREE.WebGLRenderer({ antialias: true, sortObjects: false });
      renderer.shadowMap.enabled = true;
      renderer.setSize(window.innerWidth, window.innerHeight);
      const threeJSContainer = document.getElementById('ThreeJS');
      if (threeJSContainer) threeJSContainer.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
      camera.up.set(0, 0, 1);
      const controls = new MapControls(camera, renderer.domElement);
      controls.addEventListener('start', () => {
        spotlight_paused = true;
        controls.autoRotate = false;
      });
      controls.addEventListener('end', () => {
        spotlight_paused = false;
      });
      controls.autoRotate = true;

      const light = new THREE.DirectionalLight(0xffffff, 1.0);
      scene.add(light);
      scene.add(light.target);

      const lane_picking_scene = new THREE.Scene();
      lane_picking_scene.background = new THREE.Color(0xffffff);
      const roadmark_picking_scene = new THREE.Scene();
      roadmark_picking_scene.background = new THREE.Color(0xffffff);
      const xyz_scene = new THREE.Scene();
      xyz_scene.background = new THREE.Color(0xffffff);
      const st_scene = new THREE.Scene();
      st_scene.background = new THREE.Color(0xffffff);
      const lane_picking_texture = new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType });
      const roadmark_picking_texture = new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType });
      const xyz_texture = new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType });
      const st_texture = new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType });

      const transformControls = new TransformControls(camera, renderer.domElement);
      scene.add(transformControls);
      transformControls.addEventListener('change', () => renderer.render(scene, camera));
      transformControls.addEventListener('dragging-changed', (event: any) => {
        controls.enabled = !event.value;
      });

      const idVertexShader = (document.getElementById('idVertexShader') as HTMLScriptElement).textContent || '';
      const idFragmentShader = (document.getElementById('idFragmentShader') as HTMLScriptElement).textContent || '';
      const xyzVertexShader = (document.getElementById('xyzVertexShader') as HTMLScriptElement).textContent || '';
      const xyzFragmentShader = (document.getElementById('xyzFragmentShader') as HTMLScriptElement).textContent || '';
      const stVertexShader = (document.getElementById('stVertexShader') as HTMLScriptElement).textContent || '';
      const stFragmentShader = (document.getElementById('stFragmentShader') as HTMLScriptElement).textContent || '';

      const refline_material = new THREE.LineBasicMaterial({
        color: COLORS.ref_line
      });
      const road_network_material = new THREE.MeshPhongMaterial({
        vertexColors: THREE.VertexColors,
        wireframe: PARAMS.wireframe,
        shininess: 20.0,
        transparent: true,
        opacity: 0.4
      });
      const lane_outlines_material = new THREE.LineBasicMaterial({
        color: COLORS.lane_outline
      });
      const roadmark_outlines_material = new THREE.LineBasicMaterial({
        color: COLORS.roadmark_outline
      });
      const id_material = new THREE.ShaderMaterial({
        vertexShader: idVertexShader,
        fragmentShader: idFragmentShader
      });
      const xyz_material = new THREE.ShaderMaterial({
        vertexShader: xyzVertexShader,
        fragmentShader: xyzFragmentShader
      });
      const st_material = new THREE.ShaderMaterial({
        vertexShader: stVertexShader,
        fragmentShader: stFragmentShader
      });
      const roadmarks_material = new THREE.MeshBasicMaterial({
        vertexColors: THREE.VertexColors
      });

      libOpenDrive().then((Module: any) => {
        ModuleOpenDrive = Module;
        fetch('./data.xodr')
          .then((file_data) => file_data.text())
          .then((file_text) => {
            loadFile(file_text, false);
          });
      });

      function onFileSelect(file: File) {
        const file_reader = new FileReader();
        file_reader.onload = () => {
          loadFile(file_reader.result as string, true);
        };
        file_reader.readAsText(file);
      }

      function loadFile(file_text: string, clear_map: boolean) {
        if (clear_map)
          ModuleOpenDrive['FS_unlink']('./data.xodr');
        ModuleOpenDrive['FS_createDataFile']('.', 'data.xodr', file_text, true, true);
        if (OpenDriveMap) OpenDriveMap.delete();
        const odr_map_config = {
          with_lateralProfile: PARAMS.lateralProfile,
          with_laneHeight: PARAMS.laneHeight,
          with_road_objects: false,
          center_map: true,
          abs_z_for_for_local_road_obj_outline: true
        };
        OpenDriveMap = new ModuleOpenDrive.OpenDriveMap('./data.xodr', odr_map_config);
        loadOdrMap(clear_map);
      }

      function reloadOdrMap() {
        if (OpenDriveMap) OpenDriveMap.delete();
        const odr_map_config = {
          with_lateralProfile: PARAMS.lateralProfile,
          with_laneHeight: PARAMS.laneHeight,
          with_road_objects: false,
          center_map: true,
          abs_z_for_for_local_road_obj_outline: true
        };
        OpenDriveMap = new ModuleOpenDrive.OpenDriveMap('./data.xodr', odr_map_config);
        loadOdrMap(true, false);
      }

      function loadOdrMap(clear_map = true, fit_view = true) {
        const t0 = performance.now();
        if (clear_map) {
          road_network_mesh.userData.odr_road_network_mesh.delete();
          scene.remove(road_network_mesh, roadmarks_mesh, refline_lines, lane_outline_lines, roadmark_outline_lines, ground_grid);
          lane_picking_scene.clear();
          roadmark_picking_scene.clear();
          xyz_scene.clear();
          st_scene.clear();
          for (let obj of disposable_objs) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            if (obj.parent) obj.parent.remove(obj);
          }
          for (let obj of points_objs) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            if (obj.parent) obj.parent.remove(obj);
          }
          disposable_objs = [];
          points_objs = [];
        }
        const reflines_geom = new THREE.BufferGeometry();
        const odr_refline_segments = ModuleOpenDrive.get_refline_segments(OpenDriveMap, parseFloat(PARAMS.resolution));
        reflines_geom.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(getStdVecEntries(odr_refline_segments.vertices).flat(), 3)
        );
        reflines_geom.setIndex(getStdVecEntries(odr_refline_segments.indices, true));
        refline_lines = new THREE.LineSegments(reflines_geom, refline_material);
        refline_lines.renderOrder = 10;
        refline_lines.visible = PARAMS.ref_line;
        refline_lines.matrixAutoUpdate = false;
        disposable_objs.push(reflines_geom);
        points_objs.push(reflines_geom);
        scene.add(refline_lines);

        const odr_road_network_mesh = ModuleOpenDrive.get_road_network_mesh(OpenDriveMap, parseFloat(PARAMS.resolution));
        const odr_lanes_mesh = odr_road_network_mesh.lanes_mesh;
        const road_network_geom = get_geometry(odr_lanes_mesh);
        road_network_geom.attributes.color.array.fill(COLORS.road);
        for (const [vert_start_idx] of getStdMapEntries(odr_lanes_mesh.lane_start_indices)) {
          const vert_idx_interval = odr_lanes_mesh.get_idx_interval_lane(vert_start_idx);
          const vert_count = vert_idx_interval[1] - vert_idx_interval[0];
          const vert_start_idx_encoded = encodeUInt32(vert_start_idx);
          const attr_arr = new Float32Array(vert_count * 4);
          for (let i = 0; i < vert_count; i++) attr_arr.set(vert_start_idx_encoded, i * 4);
          road_network_geom.attributes.id.array.set(attr_arr, vert_idx_interval[0] * 4);
        }
        disposable_objs.push(road_network_geom);
        points_objs.push(road_network_geom);

        road_network_mesh = new THREE.Mesh(road_network_geom, road_network_material);
        road_network_mesh.renderOrder = 0;
        road_network_mesh.userData = { odr_road_network_mesh };
        road_network_mesh.matrixAutoUpdate = false;
        road_network_mesh.visible = !(PARAMS.view_mode === 'Outlines');
        scene.add(road_network_mesh);

        const lane_picking_mesh = new THREE.Mesh(road_network_geom, id_material);
        lane_picking_mesh.matrixAutoUpdate = false;
        lane_picking_scene.add(lane_picking_mesh);

        const xyz_mesh = new THREE.Mesh(road_network_geom, xyz_material);
        xyz_mesh.matrixAutoUpdate = false;
        xyz_scene.add(xyz_mesh);

        const st_mesh = new THREE.Mesh(road_network_geom, st_material);
        st_mesh.matrixAutoUpdate = false;
        st_scene.add(st_mesh);

        const odr_roadmarks_mesh = odr_road_network_mesh.roadmarks_mesh;
        const roadmarks_geom = get_geometry(odr_roadmarks_mesh);
        roadmarks_geom.attributes.color.array.fill(COLORS.roadmark);
        for (const [vert_start_idx] of getStdMapEntries(odr_roadmarks_mesh.roadmark_type_start_indices)) {
          const vert_idx_interval = odr_roadmarks_mesh.get_idx_interval_roadmark(vert_start_idx);
          const vert_count = vert_idx_interval[1] - vert_idx_interval[0];
          const vert_start_idx_encoded = encodeUInt32(vert_start_idx);
          const attr_arr = new Float32Array(vert_count * 4);
          for (let i = 0; i < vert_count; i++) attr_arr.set(vert_start_idx_encoded, i * 4);
          roadmarks_geom.attributes.id.array.set(attr_arr, vert_idx_interval[0] * 4);
        }
        disposable_objs.push(roadmarks_geom);
        points_objs.push(road_network_geom);

        roadmarks_mesh = new THREE.Mesh(roadmarks_geom, roadmarks_material);
        roadmarks_mesh.matrixAutoUpdate = false;
        roadmarks_mesh.visible = !(PARAMS.view_mode === 'Outlines') && PARAMS.roadmarks;
        scene.add(roadmarks_mesh);

        const roadmark_picking_mesh = new THREE.Mesh(roadmarks_geom, id_material);
        roadmark_picking_mesh.matrixAutoUpdate = false;
        roadmark_picking_scene.add(roadmark_picking_mesh);

        const lane_outlines_geom = new THREE.BufferGeometry();
        lane_outlines_geom.setAttribute('position', road_network_geom.attributes.position);
        lane_outlines_geom.setIndex(getStdVecEntries(odr_lanes_mesh.get_lane_outline_indices(), true));
        lane_outline_lines = new THREE.LineSegments(lane_outlines_geom, lane_outlines_material);
        lane_outline_lines.renderOrder = 9;
        disposable_objs.push(lane_outlines_geom);
        points_objs.push(lane_outlines_geom);
        scene.add(lane_outline_lines);

        const roadmark_outlines_geom = new THREE.BufferGeometry();
        roadmark_outlines_geom.setAttribute('position', roadmarks_geom.attributes.position);
        roadmark_outlines_geom.setIndex(getStdVecEntries(odr_roadmarks_mesh.get_roadmark_outline_indices(), true));
        roadmark_outline_lines = new THREE.LineSegments(roadmark_outlines_geom, roadmark_outlines_material);
        roadmark_outline_lines.renderOrder = 8;
        roadmark_outline_lines.matrixAutoUpdate = false;
        disposable_objs.push(roadmark_outlines_geom);
        points_objs.push(road_network_geom);
        roadmark_outline_lines.visible = PARAMS.roadmarks;
        scene.add(roadmark_outline_lines);

        const bbox_reflines = new THREE.Box3().setFromObject(refline_lines);
        const max_diag_dist = bbox_reflines.min.distanceTo(bbox_reflines.max);
        camera.far = max_diag_dist * 1.5;
        controls.autoRotate = fit_view;
        if (fit_view) fitViewToBbox(bbox_reflines);
        const bbox_center_pt = new THREE.Vector3();
        bbox_reflines.getCenter(bbox_center_pt);
        ground_grid = new THREE.GridHelper(max_diag_dist, max_diag_dist / 10, 0x2f2f2f, 0x2f2f2f);
        ground_grid.geometry.rotateX(Math.PI / 2);
        ground_grid.position.set(bbox_center_pt.x, bbox_center_pt.y, bbox_reflines.min.z - 0.1);
        disposable_objs.push(ground_grid.geometry);
        points_objs.push(ground_grid.geometry);
        scene.add(ground_grid);

        light.position.set(bbox_reflines.min.x, bbox_reflines.min.y, bbox_reflines.max.z + max_diag_dist);
        light.target.position.set(bbox_center_pt.x, bbox_center_pt.y, bbox_center_pt.z);
        light.position.needsUpdate = true;
        light.target.position.needsUpdate = true;
        light.target.updateMatrixWorld();

        const t1 = performance.now();
        console.log("Heap size: " + ModuleOpenDrive.HEAP8.length / 1024 / 1024 + " mb");
        const info_msg = `
            <div class=popup_info>
              <h3>Finished loading</h3>
              <table>
                <tr><th>Time</th><th>${((t1 - t0) / 1e3).toFixed(2)}s</th></tr>
                <tr><th>Num Vertices</th><th>${renderer.info.render.triangles}</th></tr>
              </table>
            </div>`;
        notyf.open({ type: 'info', message: info_msg });
        odr_roadmarks_mesh.delete();
        odr_lanes_mesh.delete();
        if (spotlight_info) spotlight_info.style.display = 'none';
        animate();
        function animate() {
          setTimeout(() => {
            requestAnimationFrame(animate);
          }, 1000 / 30);
          controls.update();
          if (PARAMS.spotlight && !spotlight_paused) {
            camera.setViewOffset(
              renderer.getContext().drawingBufferWidth,
              renderer.getContext().drawingBufferHeight,
              (mouse.x * renderer.getPixelRatio()) | 0,
              (mouse.y * renderer.getPixelRatio()) | 0,
              1,
              1
            );
            renderer.setRenderTarget(lane_picking_texture);
            renderer.render(lane_picking_scene, camera);
            renderer.setRenderTarget(roadmark_picking_texture);
            renderer.render(roadmark_picking_scene, camera);
            renderer.setRenderTarget(xyz_texture);
            renderer.render(xyz_scene, camera);
            renderer.setRenderTarget(st_texture);
            renderer.render(st_scene, camera);
            const lane_id_pixel_buffer = new Float32Array(4);
            renderer.readRenderTargetPixels(lane_picking_texture, 0, 0, 1, 1, lane_id_pixel_buffer);
            const roadmark_id_pixel_buffer = new Float32Array(4);
            renderer.readRenderTargetPixels(roadmark_picking_texture, 0, 0, 1, 1, roadmark_id_pixel_buffer);
            const xyz_pixel_buffer = new Float32Array(4);
            renderer.readRenderTargetPixels(xyz_texture, 0, 0, 1, 1, xyz_pixel_buffer);
            xyz_pixel_buffer[0] += OpenDriveMap.x_offs;
            xyz_pixel_buffer[1] += OpenDriveMap.y_offs;
            const st_pixel_buffer = new Float32Array(4);
            renderer.readRenderTargetPixels(st_texture, 0, 0, 1, 1, st_pixel_buffer);
            camera.clearViewOffset();
            renderer.setRenderTarget(null);
            if (isValid(lane_id_pixel_buffer)) {
              const decoded_lane_id = decodeUInt32(lane_id_pixel_buffer);
              const odr_lanes_mesh = road_network_mesh.userData.odr_road_network_mesh.lanes_mesh;
              if (INTERSECTED_LANE_ID !== decoded_lane_id) {
                if (INTERSECTED_LANE_ID !== 0xffffffff) {
                  const prev_lane_vert_idx_interval = odr_lanes_mesh.get_idx_interval_lane(INTERSECTED_LANE_ID);
                  road_network_mesh.geometry.attributes.color.array.fill(COLORS.road, prev_lane_vert_idx_interval[0] * 3, prev_lane_vert_idx_interval[1] * 3);
                }
                INTERSECTED_LANE_ID = decoded_lane_id;
                const lane_vert_idx_interval = odr_lanes_mesh.get_idx_interval_lane(INTERSECTED_LANE_ID);
                const vert_count = lane_vert_idx_interval[1] - lane_vert_idx_interval[0];
                applyVertexColors(road_network_mesh.geometry.attributes.color, new THREE.Color(COLORS.lane_highlight), lane_vert_idx_interval[0], vert_count);
                road_network_mesh.geometry.attributes.color.needsUpdate = true;
                if (spotlight_info) spotlight_info.style.display = 'block';
              }
              odr_lanes_mesh.delete();
            } else {
              if (INTERSECTED_LANE_ID !== 0xffffffff) {
                const odr_lanes_mesh = road_network_mesh.userData.odr_road_network_mesh.lanes_mesh;
                const lane_vert_idx_interval = odr_lanes_mesh.get_idx_interval_lane(INTERSECTED_LANE_ID);
                road_network_mesh.geometry.attributes.color.array.fill(COLORS.road, lane_vert_idx_interval[0] * 3, lane_vert_idx_interval[1] * 3);
                road_network_mesh.geometry.attributes.color.needsUpdate = true;
                odr_lanes_mesh.delete();
              }
              INTERSECTED_LANE_ID = 0xffffffff;
              if (spotlight_info) spotlight_info.style.display = 'none';
            }
            if (isValid(roadmark_id_pixel_buffer)) {
              const decoded_roadmark_id = decodeUInt32(roadmark_id_pixel_buffer);
              const odr_roadmarks_mesh = road_network_mesh.userData.odr_road_network_mesh.roadmarks_mesh;
              if (INTERSECTED_ROADMARK_ID !== decoded_roadmark_id) {
                if (INTERSECTED_ROADMARK_ID !== 0xffffffff) {
                  const prev_roadmark_vert_idx_interval = odr_roadmarks_mesh.get_idx_interval_roadmark(INTERSECTED_ROADMARK_ID);
                  roadmarks_mesh.geometry.attributes.color.array.fill(COLORS.roadmark, prev_roadmark_vert_idx_interval[0] * 3, prev_roadmark_vert_idx_interval[1] * 3);
                }
                INTERSECTED_ROADMARK_ID = decoded_roadmark_id;
                const roadmark_vert_idx_interval = odr_roadmarks_mesh.get_idx_interval_roadmark(INTERSECTED_ROADMARK_ID);
                const vert_count = roadmark_vert_idx_interval[1] - roadmark_vert_idx_interval[0];
                applyVertexColors(roadmarks_mesh.geometry.attributes.color, new THREE.Color(COLORS.roadmark_highlight), roadmark_vert_idx_interval[0], vert_count);
                roadmarks_mesh.geometry.attributes.color.needsUpdate = true;
              }
              odr_roadmarks_mesh.delete();
            } else {
              if (INTERSECTED_ROADMARK_ID !== 0xffffffff) {
                const odr_roadmarks_mesh = road_network_mesh.userData.odr_road_network_mesh.roadmarks_mesh;
                const roadmark_vert_idx_interval = odr_roadmarks_mesh.get_idx_interval_lane(INTERSECTED_ROADMARK_ID);
                roadmarks_mesh.geometry.attributes.color.array.fill(COLORS.roadmark, roadmark_vert_idx_interval[0] * 3, roadmark_vert_idx_interval[1] * 3);
                roadmarks_mesh.geometry.attributes.color.needsUpdate = true;
                odr_roadmarks_mesh.delete();
              }
              INTERSECTED_ROADMARK_ID = 0xffffffff;
            }
            if (INTERSECTED_LANE_ID !== 0xffffffff) {
              const odr_lanes_mesh = road_network_mesh.userData.odr_road_network_mesh.lanes_mesh;
              const road_id = odr_lanes_mesh.get_road_id(INTERSECTED_LANE_ID);
              const lanesec_s0 = odr_lanes_mesh.get_lanesec_s0(INTERSECTED_LANE_ID);
              const lane_id = odr_lanes_mesh.get_lane_id(INTERSECTED_LANE_ID);
              odr_lanes_mesh.delete();
              deleteCubeModeButton!.style.display = 'none';
              addCubeModeButton!.style.display = 'none';
              addPointModeButton!.style.display = 'none';
              deletePointModeButton!.style.display = 'none';
              rotatePosCubeButton!.style.display = 'none';
              if (spotlight_info)
                spotlight_info.innerHTML = `
                  <table>
                    <tr><th>road id</th><th>${road_id}</th></tr>
                    <tr><th>section s0</th><th>${lanesec_s0.toFixed(2)}</th></tr>
                    <tr><th>lane</th><th>${lane_id}</th></tr>
                    <tr><th>s/t</th><th>[${st_pixel_buffer[0].toFixed(2)}, ${st_pixel_buffer[1].toFixed(2)}]</th></tr>
                    <tr><th>world</th><th>[${xyz_pixel_buffer[0].toFixed(2)}, ${xyz_pixel_buffer[1].toFixed(2)}, ${xyz_pixel_buffer[2].toFixed(2)}]</th></tr>
                  </table>`;
            } else {
              addCubeModeButton!.style.display = 'block';
              deleteCubeModeButton!.style.display = 'block';
              addPointModeButton!.style.display = 'block';
              deletePointModeButton!.style.display = 'block';
              rotatePosCubeButton!.style.display = 'block';
            }
          }
          renderer.render(scene, camera);
        }
      }

      function get_geometry(odr_meshunion: any): THREE.BufferGeometry {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(getStdVecEntries(odr_meshunion.vertices, true).flat(), 3));
        geom.setAttribute('st', new THREE.Float32BufferAttribute(getStdVecEntries(odr_meshunion.st_coordinates, true).flat(), 2));
        geom.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geom.attributes.position.count * 3), 3));
        geom.setAttribute('id', new THREE.Float32BufferAttribute(new Float32Array(geom.attributes.position.count * 4), 4));
        geom.setIndex(getStdVecEntries(odr_meshunion.indices, true));
        geom.computeVertexNormals();
        return geom;
      }

      function fitViewToBbox(bbox: THREE.Box3, restrict_zoom = true) {
        const center_pt = new THREE.Vector3();
        bbox.getCenter(center_pt);
        const l2xy = 0.5 * Math.sqrt(Math.pow(bbox.max.x - bbox.min.x, 2.0) + Math.pow(bbox.max.y - bbox.min.y, 2));
        const fov2r = (camera.fov * 0.5) * (Math.PI / 180.0);
        const dz = l2xy / Math.tan(fov2r);
        camera.position.set(bbox.min.x, center_pt.y, bbox.max.z + dz);
        controls.target.set(center_pt.x, center_pt.y, center_pt.z);
        if (restrict_zoom) controls.maxDistance = center_pt.distanceTo(bbox.max) * 1.2;
        controls.update();
      }

      function fitViewToObj(obj: THREE.Object3D) {
        const bbox = new THREE.Box3().setFromObject(obj);
        fitViewToBbox(bbox);
      }

      function applyVertexColors(buffer_attribute: THREE.BufferAttribute, color: THREE.Color, offset: number, count: number) {
        const colors = new Float32Array(count * buffer_attribute.itemSize);
        for (let i = 0; i < count * buffer_attribute.itemSize; i += buffer_attribute.itemSize) {
          colors[i] = color.r;
          colors[i + 1] = color.g;
          colors[i + 2] = color.b;
        }
        buffer_attribute.array.set(colors, offset * buffer_attribute.itemSize);
      }

      function getStdMapKeys(std_map: any, delete_map = false): any[] {
        const map_keys: any[] = [];
        const map_keys_vec = std_map.keys();
        for (let idx = 0; idx < map_keys_vec.size(); idx++)
          map_keys.push(map_keys_vec.get(idx));
        map_keys_vec.delete();
        if (delete_map) std_map.delete();
        return map_keys;
      }

      function getStdMapEntries(std_map: any): any[] {
        const map_entries: any[] = [];
        for (let key of getStdMapKeys(std_map))
          map_entries.push([key, std_map.get(key)]);
        return map_entries;
      }

      function getStdVecEntries(std_vec: any, delete_vec = false, ArrayType: any = null): any[] {
        const entries = ArrayType ? new ArrayType(std_vec.size()) : new Array(std_vec.size());
        for (let idx = 0; idx < std_vec.size(); idx++)
          entries[idx] = std_vec.get(idx);
        if (delete_vec) std_vec.delete();
        return entries;
      }

      function isValid(rgba: number[]): boolean {
        return !(rgba[0] === 1 && rgba[1] === 1 && rgba[2] === 1 && rgba[3] === 1);
      }

      function encodeUInt32(ui32: number): Float32Array {
        const rgba = new Float32Array(4);
        rgba[0] = (Math.trunc(ui32) % 256) / 255;
        rgba[1] = (Math.trunc(ui32 / 256) % 256) / 255;
        rgba[2] = (Math.trunc(ui32 / 256 / 256) % 256) / 255;
        rgba[3] = (Math.trunc(ui32 / 256 / 256 / 256) % 256) / 255;
        return rgba;
      }

      function decodeUInt32(rgba: number[]): number {
        return (
          Math.round(rgba[0] * 255) +
          Math.round(rgba[1] * 255) * 256 +
          Math.round(rgba[2] * 255) * 256 * 256 +
          Math.round(rgba[3] * 255) * 256 * 256 * 256
        );
      }

      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      function onDocumentMouseMove(event: MouseEvent) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      }
      function onDocumentMouseDbClick(event: MouseEvent) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([road_network_mesh]);
        if (intersects.length > 0) {
          const intersectionPoint = intersects[0].point;
          const intersectionNormal = intersects[0].face.normal.clone().transformDirection(intersects[0].object.matrixWorld);
          if (PARAMS.isAddCubeModeActive) {
            const geometry = new THREE.BoxGeometry(3, 6, 3);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const cube = new THREE.Mesh(geometry, material);
            cube.isDisposing = false;
            cube.position.copy(intersectionPoint);
            cube.position.z += geometry.parameters.height / 2 + 0.01;
            cube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), intersectionNormal);
            scene.add(cube);
            transformControls.attach(cube);
            disposable_objs.push(cube);
          } else if (PARAMS.isAddPointModeActive) {
            const geometry = new THREE.BoxGeometry(5, 5, 5);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const point = new THREE.Mesh(geometry, material);
            point.isDisposing = false;
            point.position.copy(intersectionPoint);
            point.position.z += geometry.parameters.height / 2 + 0.01;
            point.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), intersectionNormal);
            const iconSize = 4;
            const iconGeometry = new THREE.PlaneGeometry(iconSize, iconSize);
            const iconTexture = new THREE.TextureLoader().load('fonts/globe-solid.svg');
            const iconMaterial = new THREE.MeshBasicMaterial({ map: iconTexture, side: THREE.DoubleSide, transparent: true });
            const icon = new THREE.Mesh(iconGeometry, iconMaterial);
            icon.position.set(0, 0, geometry.parameters.height / 2);
            icon.quaternion.copy(point.quaternion);
            point.add(icon);
            scene.add(point);
            points_objs.push(point);
          }
        }
      }

      rotatePosCubeButton!.addEventListener('mousedown', () => {
        const lstCb = disposable_objs[disposable_objs.length - 1];
        stIntrvl = setInterval(() => {
          lstCb.rotation.z += Math.PI / 18;
        }, 100);
      });
      rotatePosCubeButton!.addEventListener('mouseup', () => {
        clearInterval(stIntrvl);
      });

      gui = new dat.GUI();
      gui.add(PARAMS, 'load_file').name('📁 Load .xodr');
      gui.add(PARAMS, 'resolution', { Low: 1.0, Medium: 0.3, High: 0.02 }).name('📏  Detail').onChange((val: number) => {
        loadOdrMap(true, false);
      });
      gui.add(PARAMS, 'spotlight').name('🔦 Spotlight');
      gui.add(PARAMS, 'fitView').name('⟲ Reset Camera');

      const gui_view_folder = gui.addFolder('View');
      gui_view_folder.add(PARAMS, 'view_mode', { Default: 'Default', Outlines: 'Outlines' }).name('View Mode').onChange((val: string) => {
        if (val === 'Default') {
          road_network_mesh.visible = true;
          roadmarks_mesh.visible = PARAMS.roadmarks;
        } else if (val === 'Outlines') {
          road_network_mesh.visible = false;
          roadmarks_mesh.visible = false;
        }
      });
      gui_view_folder.add(PARAMS, 'ref_line').name('Reference Line').onChange((val: boolean) => {
        refline_lines.visible = val;
      });
      gui_view_folder.add(PARAMS, 'roadmarks').name('Roadmarks').onChange((val: boolean) => {
        roadmarks_mesh.visible = val;
        roadmark_outline_lines.visible = val;
      });
      gui_view_folder.add(PARAMS, 'wireframe').name('Wireframe').onChange((val: boolean) => {
        road_network_material.wireframe = val;
      });

      const gui_attributes_folder = gui.addFolder('Load Attributes');
      gui_attributes_folder.add(PARAMS, 'lateralProfile').name('Lateral Profile');
      gui_attributes_folder.add(PARAMS, 'laneHeight').name('Lane Height');
      gui_attributes_folder.add(PARAMS, 'reload_map').name('Reload Map');

      function showModeLabel() {
        const lbl = document.getElementById('modeLabel');
        if (lbl) lbl.style.display = 'block';
      }
      function hideModeLabel() {
        const lbl = document.getElementById('modeLabel');
        if (lbl) lbl.style.display = 'none';
      }

      const gui_controls_folder = gui.addFolder('Управление');
      gui_controls_folder.add(PARAMS, 'addCubeMode').name('Добавить куб');
      gui_controls_folder.add(PARAMS, 'deleteCube').name('Удалить_последний куб');
      gui_controls_folder.add(PARAMS, 'addPointMode').name('Установить точку');
      gui_controls_folder.add(PARAMS, 'deletePoint').name('Удалить_последнюю точку');
      gui_controls_folder.add(PARAMS, 'rotatePosCube').name('Поворот куба');
      gui_controls_folder.add(PARAMS, 'translateMode').name('Перемещение');
      gui_controls_folder.add(PARAMS, 'rotateMode').name('Вращение');
      gui_controls_folder.add(PARAMS, 'scaleMode').name('Масштаб');

      window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
          transformControls.detach();
        }
      });

      window.addEventListener('mousedown', onMouseDownAttach);

      const scenarioSettings = {
        scenario_id: "",
        scenario_name: "Default Scenario",
        weather: "ClearNoon"
      };

      const handleSaveScenario = async () => {
        const scenario = {
          scenario_id: scenarioSettings.scenario_id || null,
          scenario_name: scenarioSettings.scenario_name,
          weather: scenarioSettings.weather,
          scenario: [
            {
              vehicle: "chery.tiggo.7",
              path: disposable_objs
                .filter((obj) => obj.position && obj.position.x !== undefined)
                .map((obj) => ({
                  x: obj.position.x,
                  y: obj.position.y,
                  z: obj.position.z
                })),
              active: true,
              color: { r: 127, g: 12, b: 127 }
            },
            {
              vehicle: "",
              path: points_objs
                .filter((obj) => obj.position && obj.position.x !== undefined)
                .map((obj) => ({
                  x: obj.position.x,
                  y: obj.position.y,
                  z: obj.position.z
                })),
              active: false,
              color: { r: 127, g: 127, b: 127 }
            }
          ]
        };
        let host = "http://localhost:" + (process.env.PORT || 3000);
        if (!scenario.scenario_id) host += "/scenario/create";
        else host += "/scenario/edit";
        const response = await fetch(host, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scenario)
        });
      };

      const gui_save_folder = gui.addFolder('Сохранение сценария');
      gui_save_folder.add(scenarioSettings, 'scenario_id').name('ID сценария');
      gui_save_folder.add(scenarioSettings, 'scenario_name').name('Имя сценария');
      gui_save_folder.add(scenarioSettings, 'weather', [
        "ClearNoon",
        "CloudyNoon",
        "WetNoon",
        "WetCloudyNoon",
        "SoftRainNoon",
        "MidRainyNoon",
        "HardRainNoon",
        "ClearSunset",
        "CloudySunset",
        "WetSunset",
        "WetCloudySunset",
        "SoftRainSunset",
        "MidRainSunset",
        "HardRainSunset"
      ]).name('Погода');
      gui_save_folder.add({ saveScenario: handleSaveScenario }, 'saveScenario').name('Сохранить сценарий');
    })();

    return () => {
      if (addCubeModeButton) {
        document.body.removeChild(addCubeModeButton);
        addCubeModeButton = null;
      }
      if (translateButton) {
        document.body.removeChild(translateButton);
        translateButton = null;
      }
      if (rotateButton) {
        document.body.removeChild(rotateButton);
        rotateButton = null;
      }
      if (scaleButton) {
        document.body.removeChild(scaleButton);
        scaleButton = null;
      }
      if (deleteCubeModeButton) {
        document.body.removeChild(deleteCubeModeButton);
        deleteCubeModeButton = null;
      }
      if (addPointModeButton) {
        document.body.removeChild(addPointModeButton);
        addPointModeButton = null;
      }
      if (deletePointModeButton) {
        document.body.removeChild(deletePointModeButton);
        deletePointModeButton = null;
      }
      if (rotatePosCubeButton) {
        document.body.removeChild(rotatePosCubeButton);
        rotatePosCubeButton = null;
      }
      window.removeEventListener('resize', onWindowResize, false);
      window.removeEventListener('mousemove', onDocumentMouseMove, false);
      window.removeEventListener('dblclick', onDocumentMouseDbClick, false);
      window.removeEventListener('mousedown', onMouseDownAttach);
      if (gui) {
        gui.destroy();
        gui = null;
      }
    };
  }, []);

  return (
    <div>
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <div id="ThreeJS" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}></div>
        <div
          className="popup_info bottom_info"
          id="spotlight_info"
          style={{ position: 'absolute', top: '1em', left: '1em', color: 'whitesmoke', fontFamily: 'monospace' }}
        ></div>
        <input id="xodr_file_input" type="file" style={{ visibility: 'hidden' }} />
        <div style={{ display: 'none' }}>
          <script id="idVertexShader" type="x-shader/x-vertex">{`
            attribute vec4 id;
            varying vec4 vId;
            void main() {
              vId = id;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
          `}</script>
          <script id="idFragmentShader" type="x-shader/x-vertex">{`
            varying vec4 vId;
            void main() {
              gl_FragColor = vId;
            }
          `}</script>
          <script id="xyzVertexShader" type="x-shader/x-vertex">{`
            varying vec3 vXYZ;
            void main() {
              vXYZ = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
          `}</script>
          <script id="xyzFragmentShader" type="x-shader/x-vertex">{`
            varying vec3 vXYZ;
            void main() {
              gl_FragColor = vec4(vXYZ, 1.0);
            }
          `}</script>
          <script id="stVertexShader" type="x-shader/x-vertex">{`
            attribute vec2 st;
            varying vec2 vST;
            void main() {
              vST = st;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
          `}</script>
          <script id="stFragmentShader" type="x-shader/x-vertex">{`
            varying vec2 vST;
            void main() {
              gl_FragColor = vec4(vST.x, vST.y, 0.0, 1.0);
            }
          `}</script>
        </div>
        <div id="githubLink" style={{ position: 'absolute', bottom: '0.1em', right: '0.1em', fontSize: '2.5em' }}>
          <a className="icon" target="_blank" rel="noreferrer" href="http://github.com/grepthat/libOpenDRIVE" title="github" style={{ color: 'lightgray' }}>
            <i className="fa fa-github"></i>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Editor