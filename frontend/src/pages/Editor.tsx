import React, { useEffect } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three-stdlib';
import { TransformControls } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';
import * as dat from 'dat.gui';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';


declare function libOpenDrive(): Promise<never>;

const Editor = () => {
  useEffect(() => {
    const PARAMS = {
      load_file: () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xodr';
        fileInput.addEventListener('change', (event) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              loadFile(e.target.result, true);
            };
            reader.readAsText(file);
          }
        });
        fileInput.click();
      },
      model: '',
      color: '',
      resolution: 0.3,
      ref_line: true,
      roadmarks: true,
      wireframe: false,
      spotlight: true,
      fitView: () => { fitViewToObj(refline_lines); },
      lateralProfile: true,
      laneHeight: true,
      reload_map: () => { reloadOdrMap(); },
      view_mode: 'Default',
      addCube: () => {
        isRotating = false;
        isAddCubeModeActive = true;
        isAddPointModeActive = false;
        isAddedPoints = false;
      },
      deleteCube: () => {
        isRotating = false;
        if (pointerIndex >= 0) {
          const index = cube_objs.indexOf(selectedCube);
          if (index > -1) {
            if (temp[index] && Array.isArray(temp[index])) {
              temp[index].forEach(line => {
                if (line.parent) scene.remove(line);
                if (line.geometry) line.geometry.dispose();
                if (line.material) line.material.dispose();
              });
              temp.splice(index, 1);
            }
            if (cubeCircles[index] && Array.isArray(cubeCircles[index])) {
              cubeCircles[index].forEach(circle => {
                if (circle.parent) scene.remove(circle);
                if (circle.geometry) circle.geometry.dispose();
                if (circle.material) circle.material.dispose();
              });
              cubeCircles.splice(index, 1);
            }
            if (aaa[index] && Array.isArray(aaa[index])) {
              aaa.splice(index, 1);
            }
            if (selectedCube) {
              scene.remove(selectedCube);
              if (selectedCube.geometry) selectedCube.geometry.dispose();
              if (selectedCube.material) selectedCube.material.dispose();
            }
            cube_objs.splice(index, 1);
            xxx.splice(index, 1);
            scenarioSettings.color_arr.splice(pointerIndex, 1);
            scenarioSettings.arr_car.splice(pointerIndex, 1);
            selectedCube = null;
            pointerIndex = -1;
            prevIndex = -1;
            isAddedPoints = false;
            console.log(xxx, aaa, temp);
          }
        }
      },
      addPoint: () => {
        isRotating = false;
        isAddPointModeActive = true;
        isAddCubeModeActive = false;
        isAddedPoints = false;
      },
      deletePoint: () => {
        isRotating = false;
        if (points_objs.length > 0) {
          const lastObj = points_objs[points_objs.length - 1];
          yyy.pop();
          if (lastObj && !lastObj.isDisposing) {
            lastObj.isDisposing = true;
            scene.remove(lastObj);
            points_objs.pop();
            if (lastObj.geometry) lastObj.geometry.dispose();
            if (lastObj.material) lastObj.material.dispose();
          }
        }
      },
      rotateCube: () => {
        selectedCube.rotation.z += Math.PI / 18;
      },
      rotatePosCube: function() {
        if (disposable_objs.length === 0) return;
        const lstCb = disposable_objs[disposable_objs.length - 1];
        lstCb.rotation.z += Math.PI / 18;
      },
      translateMode: function() {
        transformControls.setMode('translate');
      },
      rotateMode: function() {
        transformControls.setMode('rotate');
      },
      scaleMode: function() {
        transformControls.setMode('scale');
      },
      addDirectionPoints: () => {
        isRotating = false;
        isAddedPoints = !isAddedPoints;
        isAddCubeModeActive = false;
        isAddPointModeActive = false;
      }
    };
    const gui = new dat.GUI();

    gui.add(PARAMS, 'load_file').name('📁 Load .xodr');
    gui.add(PARAMS, 'resolution', { Low: 1.0, Medium: 0.3, High: 0.02 }).name('📏 Detail').onChange((val) => {
      loadOdrMap(true, false);
    });
    gui.add(PARAMS, 'spotlight').name("🔦 Spotlight");
    gui.add(PARAMS, 'fitView').name("⟲ Reset Camera");
    const gui_view_folder = gui.addFolder('View');
    gui_view_folder.add(PARAMS, 'view_mode', { Default: 'Default', 'Outlines': 'Outlines' }).name("View Mode").onChange((val) => {
      road_network_mesh.visible = (val === 'Default');
      roadmarks_mesh.visible = (val === 'Default' && PARAMS.roadmarks);
    });
    gui_view_folder.add(PARAMS, 'ref_line').name("Reference Line").onChange((val) => {
      refline_lines.visible = val;
    });
    gui_view_folder.add(PARAMS, 'roadmarks').name("Roadmarks").onChange((val) => {
      roadmarks_mesh.visible = val;
      roadmark_outline_lines.visible = val;
      if (PARAMS.view_mode === 'Outlines') {
        roadmarks_mesh.visible = false;
        roadmark_outline_lines.visible = false;
      }
    });
    gui_view_folder.add(PARAMS, 'wireframe').name("Wireframe").onChange((val) => {
      road_network_material.wireframe = val;
    });
    const gui_attributes_folder = gui.addFolder('Load Attributes');
    gui_attributes_folder.add(PARAMS, 'lateralProfile').name("Lateral Profile");
    gui_attributes_folder.add(PARAMS, 'laneHeight').name("Lane Height");
    gui_attributes_folder.add(PARAMS, 'reload_map').name("Reload Map");
    const gui_controls_folder = gui.addFolder('Controls');
    gui_controls_folder.add(PARAMS, 'addCube').name('Добавить машину');
    gui_controls_folder.add(PARAMS, 'model').name("Имя машины").onChange((val) => currentCar = val);
    gui_controls_folder.add(PARAMS, 'color').name("Цвет машины").onChange((val) => currentColor = val);
    gui_controls_folder.add(PARAMS, 'deleteCube').name('Удалить куб');
    gui_controls_folder.add(PARAMS, 'addPoint').name('Добавить RSU');
    gui_controls_folder.add(PARAMS, 'deletePoint').name('Удалить RSU');
    gui_controls_folder.add(PARAMS, 'rotateCube').name('Вкл поворот куба');
    gui_controls_folder.add(PARAMS, 'translateMode').name('Перемещение');
    gui_controls_folder.add(PARAMS, 'rotateMode').name('Вращение');
    gui_controls_folder.add(PARAMS, 'scaleMode').name('Масштаб');
    gui_controls_folder.add(PARAMS, 'addDirectionPoints').name('Добавить точки');
    let ModuleOpenDrive = null;
    let OpenDriveMap = null;
    var refline_lines = null;
    var road_network_mesh = null;
    var roadmarks_mesh = null;
    let lane_outline_lines = null;
    var roadmark_outline_lines = null;
    let ground_grid = null;
    var disposable_objs = [];
    var points_objs = [];
    var cube_objs = [];
    const points_arr = [];
    let circles_objs = [];
    let circles_arr = [];
    const cubeCircles = [];
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const spotlight_info = document.getElementById('spotlight_info');
    let INTERSECTED_LANE_ID = 0xffffffff;
    let INTERSECTED_ROADMARK_ID = 0xffffffff;
    let spotlight_paused = false;
    let isAddCubeModeActive = false;
    let isAddPointModeActive = false;
    let stIntrvl;
    let pointerIndex = -1;
    let selectedCube = null;
    let prevIndex = -1;
    let isAddedPoints = false;
    const radius = 2;
    const segments = 32;
    var temp: any[] = [];
    const ind = 0;
    let currentCar = '';
    let currentColor = '00ff00';
    let rotationInterval;
    let isRotating = false;
    const xxx = [{x: -82.25002685501826, y: 78.50328235312159, z: 2.842170943040401e-14}];
    const aaa = [[{x: -111.04339870008958, y: 81.25687140209173, z: 0}, {x: -124.13687116589833, y: 81.40780136061142, z: 0}]];
    const yyy = [];
    const buildings = [];
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
    window.addEventListener('click', onDocumentMouseClick);
    const notyf = new Notyf({
      duration: 3000,
      position: { x: 'left', y: 'bottom' },
      types: [{ type: 'info', background: '#607d8b', icon: false }]
    });
    const renderer = new THREE.WebGLRenderer({ antialias: true, sortObjects: false });
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('ThreeJS').appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    const transformControls = new TransformControls(camera, renderer.domElement);
    scene.add(transformControls);

    transformControls.addEventListener('change', () => renderer.render(scene, camera));
    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        transformControls.detach();
      }
    });


    camera.up.set(0, 0, 1);
    const controls = new MapControls(camera, renderer.domElement);
    controls.addEventListener('start', () => { spotlight_paused = true; controls.autoRotate = false; });
    controls.addEventListener('end', () => { spotlight_paused = false; });
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
    const idVertexShader = document.getElementById('idVertexShader').textContent;
    const idFragmentShader = document.getElementById('idFragmentShader').textContent;
    const xyzVertexShader = document.getElementById('xyzVertexShader').textContent;
    const xyzFragmentShader = document.getElementById('xyzFragmentShader').textContent;
    const stVertexShader = document.getElementById('stVertexShader').textContent;
    const stFragmentShader = document.getElementById('stFragmentShader').textContent;
    const refline_material = new THREE.LineBasicMaterial({
      color: COLORS.ref_line,
    });
    const road_network_material = new THREE.MeshPhongMaterial({
      vertexColors: THREE.VertexColors,
      wireframe: PARAMS.wireframe,
      shininess: 20.0,
      transparent: true,
      opacity: 0.4
    });
    const lane_outlines_material = new THREE.LineBasicMaterial({
      color: COLORS.lane_outline,
    });
    const roadmark_outlines_material = new THREE.LineBasicMaterial({
      color: COLORS.roadmark_outline,
    });
    const id_material = new THREE.ShaderMaterial({
      vertexShader: idVertexShader,
      fragmentShader: idFragmentShader,
    });
    const xyz_material = new THREE.ShaderMaterial({
      vertexShader: xyzVertexShader,
      fragmentShader: xyzFragmentShader,
    });
    const st_material = new THREE.ShaderMaterial({
      vertexShader: stVertexShader,
      fragmentShader: stFragmentShader,
    });
    const roadmarks_material = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
    });
    libOpenDrive().then(Module => {
      ModuleOpenDrive = Module;
      fetch("./data.xodr").then((file_data) => {
        file_data.text().then((file_text) => {
          loadFile(file_text, false);
        });
      });
    });
    function onFileSelect(file) {
      const file_reader = new FileReader();
      file_reader.onload = () => { loadFile(file_reader.result, true); };
      file_reader.readAsText(file);
    }
    function loadFile(file_text, clear_map) {
      if (clear_map)
        ModuleOpenDrive['FS_unlink']('./data.xodr');
      ModuleOpenDrive['FS_createDataFile'](".", "data.xodr", file_text, true, true);
      if (OpenDriveMap)
        OpenDriveMap.delete();
      let odr_map_config;
      odr_map_config = {
        with_lateralProfile: PARAMS.lateralProfile,
        with_laneHeight: PARAMS.laneHeight,
        with_road_objects: false,
        center_map: true,
        abs_z_for_for_local_road_obj_outline: true
      };
      OpenDriveMap = new ModuleOpenDrive.OpenDriveMap("./data.xodr", odr_map_config);
      loadOdrMap(clear_map);
    }
    function reloadOdrMap() {
      if (OpenDriveMap)
        OpenDriveMap.delete();
      let odr_map_config;
      odr_map_config = {
        with_lateralProfile: PARAMS.lateralProfile,
        with_laneHeight: PARAMS.laneHeight,
        with_road_objects: false,
        center_map: true,
        abs_z_for_for_local_road_obj_outline: true
      };
      OpenDriveMap = new ModuleOpenDrive.OpenDriveMap("./data.xodr", odr_map_config);
      loadOdrMap(true, false);
    }
    function loadOdrMap(clear_map = true, fit_view = true) {
      const t0 = performance.now();
      if (clear_map) {
        road_network_mesh.userData.odr_road_network_mesh.delete();
        scene.remove(road_network_mesh, roadmarks_mesh, refline_lines, lane_outline_lines, roadmark_outline_lines, ground_grid);
        lane_picking_scene.remove(...lane_picking_scene.children);
        roadmark_picking_scene.remove(...roadmark_picking_scene.children);
        xyz_scene.remove(...xyz_scene.children);
        st_scene.remove(...st_scene.children);
        for (const obj of disposable_objs) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
          if (obj.parent) obj.parent.remove(obj);
        }
        for (const obj of points_objs) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
          if (obj.parent) obj.parent.remove(obj);
        }
        for (const obj of circles_objs) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
          if (obj.parent) obj.parent.remove(obj);
        }
        for (const obj of temp) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
          if (obj.parent) obj.parent.remove(obj);
        }
        temp = [];
        disposable_objs = [];
        points_objs = [];
        circles_arr = [];
        circles_objs = [];
        cube_objs = [];
        selectedCube = null;
        currentColor = '00ff00';
        currentCar = '';
        scenarioSettings.arr_car = [];
        scenarioSettings.color_arr = [];
      }
      const reflines_geom = new THREE.BufferGeometry();
      const odr_refline_segments = ModuleOpenDrive.get_refline_segments(OpenDriveMap, parseFloat(PARAMS.resolution));
      reflines_geom.setAttribute('position', new THREE.Float32BufferAttribute(getStdVecEntries(odr_refline_segments.vertices).flat(), 3));
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
      for (const [vert_start_idx, _] of getStdMapEntries(odr_lanes_mesh.lane_start_indices)) {
        const vert_idx_interval = odr_lanes_mesh.get_idx_interval_lane(vert_start_idx);
        const vert_count = vert_idx_interval[1] - vert_idx_interval[0];
        const vert_start_idx_encoded = encodeUInt32(vert_start_idx);
        const attr_arr = new Float32Array(vert_count * 4);
        for (let i = 0; i < vert_count; i++)
          attr_arr.set(vert_start_idx_encoded, i * 4);
        road_network_geom.attributes.id.array.set(attr_arr, vert_idx_interval[0] * 4);
      }
      disposable_objs.push(road_network_geom);
      points_objs.push(road_network_geom);
      road_network_mesh = new THREE.Mesh(road_network_geom, road_network_material);
      road_network_mesh.renderOrder = 0;
      road_network_mesh.userData = { odr_road_network_mesh };
      road_network_mesh.matrixAutoUpdate = false;
      road_network_mesh.visible = !(PARAMS.view_mode == 'Outlines');
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
      for (const [vert_start_idx, _] of getStdMapEntries(odr_roadmarks_mesh.roadmark_type_start_indices)) {
        const vert_idx_interval = odr_roadmarks_mesh.get_idx_interval_roadmark(vert_start_idx);
        const vert_count = vert_idx_interval[1] - vert_idx_interval[0];
        const vert_start_idx_encoded = encodeUInt32(vert_start_idx);
        const attr_arr = new Float32Array(vert_count * 4);
        for (let i = 0; i < vert_count; i++)
          attr_arr.set(vert_start_idx_encoded, i * 4);
        roadmarks_geom.attributes.id.array.set(attr_arr, vert_idx_interval[0] * 4);
      }
      disposable_objs.push(roadmarks_geom);
      points_objs.push(road_network_geom);
      roadmarks_mesh = new THREE.Mesh(roadmarks_geom, roadmarks_material);
      roadmarks_mesh.matrixAutoUpdate = false;
      roadmarks_mesh.visible = !(PARAMS.view_mode == 'Outlines') && PARAMS.roadmarks;
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
      if (fit_view)
        fitViewToBbox(bbox_reflines);
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
      spotlight_info.style.display = "none";
      animate();
    }
    function animate() {
      setTimeout(function() {
        requestAnimationFrame(animate);
      }, 1000 / 30);
      controls.update();
      if (PARAMS.spotlight && !spotlight_paused) {
        camera.setViewOffset(renderer.getContext().drawingBufferWidth, renderer.getContext().drawingBufferHeight, mouse.x * renderer.getPixelRatio() | 0, mouse.y * renderer.getPixelRatio() | 0, 1, 1);
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
          if (INTERSECTED_LANE_ID != decoded_lane_id) {
            if (INTERSECTED_LANE_ID != 0xffffffff) {
              const prev_lane_vert_idx_interval = odr_lanes_mesh.get_idx_interval_lane(INTERSECTED_LANE_ID);
              road_network_mesh.geometry.attributes.color.array.fill(COLORS.road, prev_lane_vert_idx_interval[0] * 3, prev_lane_vert_idx_interval[1] * 3);
            }
            INTERSECTED_LANE_ID = decoded_lane_id;
            const lane_vert_idx_interval = odr_lanes_mesh.get_idx_interval_lane(INTERSECTED_LANE_ID);
            const vert_count = (lane_vert_idx_interval[1] - lane_vert_idx_interval[0]);
            applyVertexColors(road_network_mesh.geometry.attributes.color, new THREE.Color(COLORS.lane_highlight), lane_vert_idx_interval[0], vert_count);
            road_network_mesh.geometry.attributes.color.needsUpdate = true;
            spotlight_info.style.display = "block";
          }
          odr_lanes_mesh.delete();
        } else {
          if (INTERSECTED_LANE_ID != 0xffffffff) {
            const odr_lanes_mesh = road_network_mesh.userData.odr_road_network_mesh.lanes_mesh;
            const lane_vert_idx_interval = odr_lanes_mesh.get_idx_interval_lane(INTERSECTED_LANE_ID);
            road_network_mesh.geometry.attributes.color.array.fill(COLORS.road, lane_vert_idx_interval[0] * 3, lane_vert_idx_interval[1] * 3);
            road_network_mesh.geometry.attributes.color.needsUpdate = true;
            odr_lanes_mesh.delete();
          }
          INTERSECTED_LANE_ID = 0xffffffff;
          spotlight_info.style.display = "none";
        }
        if (isValid(roadmark_id_pixel_buffer)) {
          const decoded_roadmark_id = decodeUInt32(roadmark_id_pixel_buffer);
          const odr_roadmarks_mesh = road_network_mesh.userData.odr_road_network_mesh.roadmarks_mesh;
          if (INTERSECTED_ROADMARK_ID != decoded_roadmark_id) {
            if (INTERSECTED_ROADMARK_ID != 0xffffffff) {
              const prev_roadmark_vert_idx_interval = odr_roadmarks_mesh.get_idx_interval_roadmark(INTERSECTED_ROADMARK_ID);
              roadmarks_mesh.geometry.attributes.color.array.fill(COLORS.roadmark, prev_roadmark_vert_idx_interval[0] * 3, prev_roadmark_vert_idx_interval[1] * 3);
            }
            INTERSECTED_ROADMARK_ID = decoded_roadmark_id;
            const roadmark_vert_idx_interval = odr_roadmarks_mesh.get_idx_interval_roadmark(INTERSECTED_ROADMARK_ID);
            const vert_count = (roadmark_vert_idx_interval[1] - roadmark_vert_idx_interval[0]);
            applyVertexColors(roadmarks_mesh.geometry.attributes.color, new THREE.Color(COLORS.roadmark_highlight), roadmark_vert_idx_interval[0], vert_count);
            roadmarks_mesh.geometry.attributes.color.needsUpdate = true;
          }
          odr_roadmarks_mesh.delete();
        } else {
          if (INTERSECTED_ROADMARK_ID != 0xffffffff) {
            const odr_roadmarks_mesh = road_network_mesh.userData.odr_road_network_mesh.roadmarks_mesh;
            const roadmark_vert_idx_interval = odr_roadmarks_mesh.get_idx_interval_lane(INTERSECTED_ROADMARK_ID);
            roadmarks_mesh.geometry.attributes.color.array.fill(COLORS.roadmark, roadmark_vert_idx_interval[0] * 3, roadmark_vert_idx_interval[1] * 3);
            roadmarks_mesh.geometry.attributes.color.needsUpdate = true;
            odr_roadmarks_mesh.delete();
          }
          INTERSECTED_ROADMARK_ID = 0xffffffff;
        }
        if (INTERSECTED_LANE_ID != 0xffffffff) {
          const odr_lanes_mesh = road_network_mesh.userData.odr_road_network_mesh.lanes_mesh;
          const road_id = odr_lanes_mesh.get_road_id(INTERSECTED_LANE_ID);
          const lanesec_s0 = odr_lanes_mesh.get_lanesec_s0(INTERSECTED_LANE_ID);
          const lane_id = odr_lanes_mesh.get_lane_id(INTERSECTED_LANE_ID);
          odr_lanes_mesh.delete();
          spotlight_info.innerHTML = `
                    <table>
                        <tr><th>road id</th><th>${road_id}</th></tr>
                        <tr><th>section s0</th><th>${lanesec_s0.toFixed(2)}</th></tr>
                        <tr><th>lane</th><th>${lane_id}</th></tr>
                        <tr><th>s/t</th><th>[${st_pixel_buffer[0].toFixed(2)}, ${st_pixel_buffer[1].toFixed(2)}]</th>
                        <tr><th>world</th><th>[${xyz_pixel_buffer[0].toFixed(2)}, ${xyz_pixel_buffer[1].toFixed(2)}, ${xyz_pixel_buffer[2].toFixed(2)}]</th></tr>
                    </table>`;
        }
      }
      renderer.render(scene, camera);
    }
    function get_geometry(odr_meshunion) {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(getStdVecEntries(odr_meshunion.vertices, true).flat(), 3));
      geom.setAttribute('st', new THREE.Float32BufferAttribute(getStdVecEntries(odr_meshunion.st_coordinates, true).flat(), 2));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geom.attributes.position.count * 3), 3));
      geom.setAttribute('id', new THREE.Float32BufferAttribute(new Float32Array(geom.attributes.position.count * 4), 4));
      geom.setIndex(getStdVecEntries(odr_meshunion.indices, true));
      geom.computeVertexNormals();
      return geom;
    }
    function fitViewToBbox(bbox, restrict_zoom = true) {
      const center_pt = new THREE.Vector3();
      bbox.getCenter(center_pt);
      const l2xy = 0.5 * Math.sqrt(Math.pow(bbox.max.x - bbox.min.x, 2.0) + Math.pow(bbox.max.y - bbox.min.y, 2));
      const fov2r = (camera.fov * 0.5) * (Math.PI / 180.0);
      const dz = l2xy / Math.tan(fov2r);
      camera.position.set(bbox.min.x, center_pt.y, bbox.max.z + dz);
      controls.target.set(center_pt.x, center_pt.y, center_pt.z);
      if (restrict_zoom)
        controls.maxDistance = center_pt.distanceTo(bbox.max) * 1.2;
      controls.update();
    }
    function fitViewToObj(obj) {
      const bbox = new THREE.Box3().setFromObject(obj);
      fitViewToBbox(bbox);
    }
    function applyVertexColors(buffer_attribute, color, offset, count) {
      const colors = new Float32Array(count * buffer_attribute.itemSize);
      for (let i = 0; i < (count * buffer_attribute.itemSize); i += buffer_attribute.itemSize) {
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
      buffer_attribute.array.set(colors, offset * buffer_attribute.itemSize);
    }
    function getStdMapKeys(std_map, delete_map = false) {
      const map_keys = [];
      const map_keys_vec = std_map.keys();
      for (let idx = 0; idx < map_keys_vec.size(); idx++)
        map_keys.push(map_keys_vec.get(idx));
      map_keys_vec.delete();
      if (delete_map)
        std_map.delete();
      return map_keys;
    }
    function getStdMapEntries(std_map) {
      const map_entries = [];
      for (const key of getStdMapKeys(std_map))
        map_entries.push([key, std_map.get(key)]);
      return map_entries;
    }
    function getStdVecEntries(std_vec, delete_vec = false, ArrayType = null) {
      const entries = ArrayType ? new ArrayType(std_vec.size()) : new Array(std_vec.size());
      for (let idx = 0; idx < std_vec.size(); idx++)
        entries[idx] = std_vec.get(idx);
      if (delete_vec)
        std_vec.delete();
      return entries;
    }
    function isValid(rgba) {
      return !(rgba[0] == 1 && rgba[1] == 1 && rgba[2] == 1 && rgba[3] == 1);
    }
    function encodeUInt32(ui32: number) {
      let rgba;
      rgba = new Float32Array(4);
      rgba[0] = (Math.trunc(ui32) % 256) / 255.;
      rgba[1] = (Math.trunc(ui32 / 256) % 256) / 255.;
      rgba[2] = (Math.trunc(ui32 / 256 / 256) % 256) / 255.;
      rgba[3] = (Math.trunc(ui32 / 256 / 256 / 256) % 256) / 255.;
      return rgba;
    }
    function decodeUInt32(rgba) {
      return Math.round(rgba[0] * 255) + Math.round(rgba[1] * 255) * 256 + Math.round(rgba[2] * 255) * 256 * 256 + Math.round(rgba[3] * 255) * 256 * 256 * 256;
    }
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function onDocumentMouseMove(event) {
      event.preventDefault();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    function onDocumentMouseDbClick(event) {
      event.preventDefault();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      if (!currentCar) {
        currentCar = 'car_' + Math.floor(Math.random() * 1000);
      }

      const intersects = raycaster.intersectObjects([...cube_objs, ...points_arr, road_network_mesh], true);
      if (intersects.length > 0 && isAddCubeModeActive && currentCar && currentColor && intersects[0].object === road_network_mesh) {
        const intersectionPoint = intersects[0].point;
        scenarioSettings.arr_car.push(currentCar);
        scenarioSettings.color_arr.push(Number('0x' + currentColor));
        // @ts-ignore
        for (const cube of cube_objs) {
          if (cube.geometry) cube.geometry.dispose();
          if (cube.material) cube.material.dispose();
          scene.remove(cube);
        }
        xxx.push(JSON.parse(JSON.stringify(intersectionPoint)));
        cube_objs = [];
        disposable_objs = [];
        aaa.push([]);
        xxx.map((cube, i) => {
          const geometry = new THREE.BoxGeometry(3, 6, 3);
          const material = new THREE.MeshBasicMaterial({ color: scenarioSettings.color_arr[i] });
          cube = new THREE.Mesh(geometry, material);
          cube.isDisposing = false;
          cube.position.set(xxx[i].x, xxx[i].y, xxx[i].z);
          cube.position.z += geometry.parameters.width / 2 + 0.01;
          scene.add(cube);
          cube_objs.push(cube);
          disposable_objs.push(cube);
          isAddCubeModeActive = false;
        });
      }
      if (intersects.length > 0 && isAddPointModeActive && intersects[0].object === road_network_mesh) {
        const intersectionPoint = intersects[0].point;
        yyy.push(JSON.parse(JSON.stringify(intersectionPoint)));
        for (const point of points_arr) {
          if (point.geometry) point.geometry.dispose();
          if (point.material) point.material.dispose();
          scene.remove(point);
        }
        yyy.map((point, i) => {
          const geometry = new THREE.BoxGeometry(5, 5, 5);
          const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
          point = new THREE.Mesh(geometry, material);
          point.isDisposing = false;
          point.position.set(yyy[i].x, yyy[i].y, yyy[i].z);
          point.position.z += geometry.parameters.height / 2 + 0.01;
          const iconSize = 4;
          const iconGeometry = new THREE.PlaneGeometry(iconSize, iconSize);
          const iconTexture = new THREE.TextureLoader().load('./globe-solid.svg');
          const iconMaterial = new THREE.MeshBasicMaterial({ map: iconTexture, side: THREE.DoubleSide, transparent: true });
          const icon = new THREE.Mesh(iconGeometry, iconMaterial);
          icon.position.set(0, 0, geometry.parameters.height / 2);
          icon.quaternion.copy(point.quaternion);
          point.add(icon);
          scene.add(point);
          points_objs.push(point);
          points_arr.push(point);
          isAddPointModeActive = false;
        });
      } else if (isAddPointModeActive && intersects.length === 0) {
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersectionPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
          yyy.push(JSON.parse(JSON.stringify(intersectionPoint)));
          yyy.map((point, i) => {
            const geometry = new THREE.BoxGeometry(5, 5, 5);
            const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
            point = new THREE.Mesh(geometry, material);
            point.isDisposing = false;
            point.position.set(yyy[i].x, yyy[i].y, yyy[i].z);
            point.position.z += geometry.parameters.height / 2 + 0.01;
            const iconSize = 4;
            const iconGeometry = new THREE.PlaneGeometry(iconSize, iconSize);
            const iconTexture = new THREE.TextureLoader().load('./globe-solid.svg');
            const iconMaterial = new THREE.MeshBasicMaterial({ map: iconTexture, side: THREE.DoubleSide, transparent: true });
            const icon = new THREE.Mesh(iconGeometry, iconMaterial);
            icon.position.set(0, 0, geometry.parameters.height / 2);
            icon.quaternion.copy(point.quaternion);
            point.add(icon);
            scene.add(point);
            points_objs.push(point);
            points_arr.push(point);
            isAddPointModeActive = false;
          });
        }
      } else if (intersects.length === 0) {
        /*const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersectionPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
          buildings.push(JSON.parse(JSON.stringify(intersectionPoint)));
          buildings.map((building, i) => {
            const geometry = new THREE.BoxGeometry(25, 25, 50);
            const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
            building = new THREE.Mesh(geometry, material);
            building.position.set(buildings[i].x, buildings[i].y, buildings[i].z);
            building.position.z += geometry.parameters.height / 2 + 0.01;
            scene.add(building);
          });
        }*/
      }
    }

    function isRoadObject(object) {
      return object === road_network_mesh || road_network_mesh.children.includes(object);
    }

    function onDocumentMouseClick(event) {
      // Если не в режиме добавления кубов/точек
      if (!isAddCubeModeActive && !isAddPointModeActive && !isAddedPoints) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);


        const intersects = raycaster.intersectObjects([...cube_objs]);
        let minDistance = Infinity;
        if (intersects.length > 0) {
          const intersectionPoint = intersects[0].point;

          if (isRoadObject(intersects[0].object)) return;

          for (let i = 0; i < cube_objs.length; i++) {
            const dist = cube_objs[i].position.distanceTo(intersectionPoint);
            if (dist < minDistance) {
              minDistance = dist;
              pointerIndex = i;
              selectedCube = cube_objs[i];
            }
          }

          transformControls.attach(selectedCube);
          //changeColor();
          prevIndex = pointerIndex;
        }
      }

      else if (selectedCube && pointerIndex >= 0 && isAddedPoints) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersectsRoad = raycaster.intersectObjects([...cube_objs, ...points_arr, road_network_mesh], true);

        if (intersectsRoad.length > 0 && intersectsRoad[0].object === road_network_mesh) {
          const intersectionRoad = intersectsRoad[0];
          const cubeIndex = cube_objs.indexOf(selectedCube);

          if (cubeCircles[cubeIndex]) {
            cubeCircles[cubeIndex].forEach(circle => {
              if (circle.parent) scene.remove(circle);
              if (circle.geometry) circle.geometry.dispose();
              if (circle.material) circle.material.dispose();
            });
            cubeCircles[cubeIndex] = [];
          }
          const intersectionPointRoad = intersectionRoad.point;

          aaa[cubeIndex].push(intersectionPointRoad.clone());

          aaa[cubeIndex].forEach((pt, ptIndex) => {
            const intersectionNormalRoad = intersectionRoad.face.normal
              .clone()
              .transformDirection(intersectionRoad.object.matrixWorld);
            const offsetDistance = 0.5;
            const offsetVector = intersectionNormalRoad.clone().multiplyScalar(offsetDistance);
            const geometry = new THREE.CircleGeometry(radius, segments);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const circle = new THREE.Mesh(geometry, material);
            circle.isDisposing = false;
            circle.position.copy(pt).add(offsetVector);
            circle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), intersectionNormalRoad);
            scene.add(circle);
            if (!cubeCircles[cubeIndex]) cubeCircles[cubeIndex] = [];
            cubeCircles[cubeIndex].push(circle);

            const canvas = document.createElement("canvas");
            const size = 64;
            canvas.width = size;
            canvas.height = size;
            const context = canvas.getContext("2d");
            context.fillStyle = "black";
            context.font = "bold 72px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText((ptIndex + 1).toString(), size / 2, size / 2);
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(2, 2, 1);
            sprite.position.set(0, 0, 1);
            circle.add(sprite);
          });
        }
      }
    }

    function changeColor() {
      for (let i = 0; i < cube_objs.length; i++) {
        if (i === pointerIndex && prevIndex != pointerIndex) {
          cube_objs[i].material.color.set(0xffff00);
        } else if (i === pointerIndex && prevIndex == pointerIndex) {
          cube_objs[i].material.color.set(scenarioSettings.color_arr[i]);
          pointerIndex = -1;
        } else {
          cube_objs[i].material.color.set(scenarioSettings.color_arr[i]);
        }
        cube_objs[i].material.needsUpdate = true;
      }
    }
    function loadCar(position, normal) {
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
          car.traverse((child) => {
            if (child.isMesh) {
              child.material.transparent = true;
              child.material.opacity = 0.5;
            }
          });
          scene.add(car);
          transformControls.attach(car);
          disposable_objs.push(car);
        }
      );
    }
    function connectCirclesWithLines() {
      if (temp) {
        temp.flat().forEach(line => {
          if (line.parent) scene.remove(line);
          if (line.geometry) line.geometry.dispose();
          if (line.material) line.material.dispose();
        });
      }
      if (!temp || temp.length !== xxx.length) {
        temp = new Array(xxx.length).fill(null).map(() => []);
      }
      function createAndAddLine(start, end, index) {
        const startVec = new THREE.Vector3(start.x, start.y, start.z);
        const endVec = new THREE.Vector3(end.x, end.y, end.z);
        const geometry = new THREE.BufferGeometry().setFromPoints([startVec, endVec]);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        temp[index].push(line);
      }
      aaa.forEach((pointsArray, ind) => {
        if (ind >= xxx.length) return;
        if (!temp[ind]) temp[ind] = [];
        temp[ind].forEach(line => {
          if (line.parent) scene.remove(line);
          if (line.geometry) line.geometry.dispose();
          if (line.material) line.material.dispose();
        });
        temp[ind] = [];
        if (pointsArray.length < 1) return;
        createAndAddLine(xxx[ind], pointsArray[0], ind);
        for (let i = 1; i < pointsArray.length; i++) {
          createAndAddLine(pointsArray[i - 1], pointsArray[i], ind);
        }
        console.log(temp);
        console.log(xxx);
      });
    }
    const scenarioSettings = {
      scenario_id: "",
      scenario_name: "Default Scenario",
      vehicle: "car",
      weather: "ClearNoon",
      arr_car: [],
      color_arr: [Number('0x800000')],
    };
    const handleSaveScenario = () => {
      console.log(scenarioSettings.arr_car);
      const scenario = {
        scenario_id: scenarioSettings.scenario_id || null,
        scenario_name: scenarioSettings.scenario_name,
        weather: scenarioSettings.weather,
        scenario: [
          {
            vehicle: scenarioSettings.vehicle,
            path: cube_objs.filter(obj => obj.position && obj.position.x !== undefined).map((obj, index) => ({
              x: obj.position.x,
              y: obj.position.y,
              z: obj.position.z,
              model: scenarioSettings.arr_car[index],
              color: scenarioSettings.color_arr[index],
              rotation: Math.floor(obj.rotation.z * 57.32, 0),
              selected: pointerIndex == index ? true : false,
              points: cubeCircles[index] ? cubeCircles[index].map((point, point_id) => ({
                id: point_id,
                x: point.position.x,
                y: point.position.y,
                z: point.position.z
              })) : []
            })),
          },
          {
            vehicle: "RSU",
            path: points_objs.filter(obj => obj.position && obj.position.x !== undefined).map(obj => ({
              x: obj.position.x,
              y: obj.position.y,
              z: obj.position.z
            })),
            active: false,
            color: { r: 127, g: 127, b: 127 }
          }
        ]
      };
      console.log(JSON.stringify(scenario, null, 2));
    };
    function showModeLabel() {
      const lbl = document.getElementById('modeLabel');
      if (lbl) lbl.style.display = 'block';
    }
    function hideModeLabel() {
      const lbl = document.getElementById('modeLabel');
      if (lbl) lbl.style.display = 'none';
    }
    window.addEventListener('resize', onWindowResize, false);
    return () => {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onDocumentMouseMove);
      window.removeEventListener('dblclick', onDocumentMouseDbClick);
      window.removeEventListener('click', onDocumentMouseClick);
      gui.destroy();
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

export default Editor;
