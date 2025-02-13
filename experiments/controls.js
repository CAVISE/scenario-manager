var PARAMS = {
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
};

const gui = new dat.GUI();
gui.add(PARAMS, 'load_file').name('📁 Load .xodr');
gui.add(PARAMS, 'resolution', { Low: 1.0, Medium: 0.3, High: 0.02 }).name('📏 Detail').onChange((val) => {
    loadOdrMap(true, false);
});
gui.add(PARAMS, 'spotlight').name("🔦 Spotlight");
gui.add(PARAMS, 'fitView').name("⟲ Reset Camera");

var gui_view_folder = gui.addFolder('View');
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

var gui_attributes_folder = gui.addFolder('Load Attributes');
gui_attributes_folder.add(PARAMS, 'lateralProfile').name("Lateral Profile");
gui_attributes_folder.add(PARAMS, 'laneHeight').name("Lane Height");
gui_attributes_folder.add(PARAMS, 'reload_map').name("Reload Map");


