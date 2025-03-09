// var PARAMS = {
//     load_file : () => { document.getElementById('xodr_file_input').click(); },
//     resolution : 0.3,
//     ref_line : true,
//     roadmarks : true,
//     wireframe : false,
//     spotlight : true,
//     fitView : () => { fitViewToObj(refline_lines); },
//     lateralProfile : true,
//     laneHeight : true,
//     reload_map : () => { reloadOdrMap(); },
//     view_mode : 'Default',
// };

// const gui = new dat.GUI();
// gui.add(PARAMS, 'load_file').name('📁 Load .xodr');
// gui.add(PARAMS, 'resolution', { Low : 1.0, Medium : 0.3, High : 0.02 }).name('📏  Detail').onChange((val) => {
//     loadOdrMap(true, false);
// });
// gui.add(PARAMS, 'spotlight').name("🔦 Spotlight");
// gui.add(PARAMS, 'fitView').name("⟲ Reset Camera");

// var gui_view_folder = gui.addFolder('View');
// gui_view_folder.add(PARAMS, 'view_mode', { Default : 'Default', 'Outlines' : 'Outlines' }).name("View Mode").onChange((val) => {
//     if (val == 'Default') {
//         road_network_mesh.visible = true;
//         roadmarks_mesh.visible = PARAMS.roadmarks;
//     } else if (val == 'Outlines') {
//         road_network_mesh.visible = false;
//         roadmarks_mesh.visible = false;
//     }
// });
// gui_view_folder.add(PARAMS, 'ref_line').name("Reference Line").onChange((val) => {
//     refline_lines.visible = val;
// });
// gui_view_folder.add(PARAMS, 'roadmarks').name("Roadmarks").onChange((val) => {
//     roadmarks_mesh.visible = val;
//     roadmark_outline_lines.visible = val;
// });
// gui_view_folder.add(PARAMS, 'wireframe').name("Wireframe").onChange((val) => {
//     road_network_material.wireframe = val;
// });

// var gui_attributes_folder = gui.addFolder('Load Attributes');
// gui_attributes_folder.add(PARAMS, 'lateralProfile').name("Lateral Profile");
// gui_attributes_folder.add(PARAMS, 'laneHeight').name("Lane Height");
// gui_attributes_folder.add(PARAMS, 'reload_map').name("Reload Map");

// var ModuleOpenDrive = null;
// var OpenDriveMap = null;
// var refline_lines = null;
// var road_network_mesh = null;
// var roadmarks_mesh = null;
// var lane_outline_lines = null;
// var roadmark_outline_lines = null;
// var ground_grid = null;
// var disposable_objs = [];
// var points_objs = [];
// var cube_objs = [];
// var points_arr = [];
// var circles_objs = [];
// var circles_arr = [];
// const cubeCircles = {};
// var mouse = new THREE.Vector2();
// const raycaster = new THREE.Raycaster();
// var spotlight_info = document.getElementById('spotlight_info');
// var INTERSECTED_LANE_ID = 0xffffffff;
// var INTERSECTED_ROADMARK_ID = 0xffffffff;
// var spotlight_paused = false;
// let isAddCubeModeActive = false; 
// let isAddPointModeActive = false;
// let stIntrvl;
// let pointerIndex = -1;
// let selectedCube = null;
// let prevIndex = -1;
// let isAddedPoints = false;
// const radius = 2;
// const segments = 32;
// var temp = [];
// let ind = 0;
// let rotationInterval; 
// let isRotating = false;
// const color_arr = [0xffff00, 0xff0000];
// var ModuleOpenDrive = null;
// var OpenDriveMap = null;
// var refline_lines = null;
// var road_network_mesh = null;
// var roadmarks_mesh = null;
// var lane_outline_lines = null;
// var roadmark_outline_lines = null;
// var ground_grid = null;
// var disposable_objs = [];
// var points_objs = [];
// var cube_objs = [];
// var points_arr = [];
// var circles_objs = [];
// var circles_arr = [];
// const cubeCircles = {};
// var mouse = new THREE.Vector2();
// const raycaster = new THREE.Raycaster();
// var spotlight_info = document.getElementById('spotlight_info');
// var INTERSECTED_LANE_ID = 0xffffffff;
// var INTERSECTED_ROADMARK_ID = 0xffffffff;
// var spotlight_paused = false;
// let isAddCubeModeActive = false; 
// let isAddPointModeActive = false;
// let stIntrvl;
// let pointerIndex = -1;
// let selectedCube = null;
// let prevIndex = -1;
// let isAddedPoints = false;
// const radius = 2;
// const segments = 32;
// var temp = [];
// let ind = 0;
// let rotationInterval; 
// let isRotating = false;
// const color_arr = [0xffff00, 0xff0000];

