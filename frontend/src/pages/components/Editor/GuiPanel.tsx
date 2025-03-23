import React, { useEffect } from 'react'
import * as dat from 'dat.gui'
import * as THREE from 'three'

type GuiPanelProps = {
  params: any
  road_network_mesh: THREE.Mesh | null
  roadmarks_mesh: THREE.Mesh | null
  roadmark_outline_lines: THREE.LineSegments | null
  road_network_material: THREE.MeshPhongMaterial | null
  refline_lines: THREE.LineSegments | null
  fitViewToObj: (obj: THREE.Object3D) => void
  reloadOdrMap: () => void
  loadFile: (fileText: string | ArrayBuffer | null, clearMap: boolean) => void
}

export function GuiPanel({
  params,
  road_network_mesh,
  roadmarks_mesh,
  roadmark_outline_lines,
  road_network_material,
  refline_lines,
  fitViewToObj,
  reloadOdrMap,
  loadFile
}: GuiPanelProps) {
  useEffect(() => {
    const gui = new dat.GUI()

    gui.add(params, 'load_file').name('📁 Load .xodr').onChange(() => {
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = '.xodr'
      fileInput.addEventListener('change', (event: any) => {
        const file = event.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e: any) => {
            loadFile(e.target.result, true)
          }
          reader.readAsText(file)
        }
      })
      fileInput.click()
    })

    gui.add(params, 'resolution', { Low: 1.0, Medium: 0.3, High: 0.02 })
      .name('📏 Detail')
      .onChange(() => {
        reloadOdrMap()
      })

    gui.add(params, 'spotlight').name('🔦 Spotlight')

    gui.add(params, 'fitView').name('⟲ Reset Camera').onChange(() => {
      if (refline_lines) fitViewToObj(refline_lines)
    })

    const gui_view_folder = gui.addFolder('View')
    gui_view_folder
      .add(params, 'view_mode', { Default: 'Default', Outlines: 'Outlines' })
      .name('View Mode')
      .onChange((val: string) => {
        if (road_network_mesh) road_network_mesh.visible = (val === 'Default')
        if (roadmarks_mesh) roadmarks_mesh.visible = (val === 'Default' && params.roadmarks)
      })
    gui_view_folder.add(params, 'ref_line').name('Reference Line').onChange((val: boolean) => {
      if (refline_lines) refline_lines.visible = val
    })
    gui_view_folder.add(params, 'roadmarks').name('Roadmarks').onChange((val: boolean) => {
      if (roadmarks_mesh) roadmarks_mesh.visible = val
      if (roadmark_outline_lines) roadmark_outline_lines.visible = val
      if (params.view_mode === 'Outlines') {
        if (roadmarks_mesh) roadmarks_mesh.visible = false
        if (roadmark_outline_lines) roadmark_outline_lines.visible = false
      }
    })
    gui_view_folder.add(params, 'wireframe').name('Wireframe').onChange((val: boolean) => {
      if (road_network_material) road_network_material.wireframe = val
    })

    const gui_attributes_folder = gui.addFolder('Load Attributes')
    gui_attributes_folder.add(params, 'lateralProfile').name('Lateral Profile')
    gui_attributes_folder.add(params, 'laneHeight').name('Lane Height')
    gui_attributes_folder.add(params, 'reload_map').name('Reload Map').onChange(() => {
      reloadOdrMap()
    })

    const gui_controls_folder = gui.addFolder('Controls')
    gui_controls_folder.add(params, 'addCube').name('Добавить машину')
    gui_controls_folder.add(params, 'model').name('Имя машины').onChange((val: string) => {
      params.currentCar = val
    })
    gui_controls_folder.add(params, 'color').name('Цвет машины').onChange((val: string) => {
      params.currentColor = val
    })
    gui_controls_folder.add(params, 'deleteCube').name('Удалить куб')
    gui_controls_folder.add(params, 'addPoint').name('Добавить RSU')
    gui_controls_folder.add(params, 'deletePoint').name('Удалить RSU')
    gui_controls_folder.add(params, 'rotateCube').name('Вкл поворот куба')
    gui_controls_folder.add(params, 'translateMode').name('Перемещение')
    gui_controls_folder.add(params, 'rotateMode').name('Вращение')
    gui_controls_folder.add(params, 'scaleMode').name('Масштаб')
    gui_controls_folder.add(params, 'addDirectionPoints').name('Добавить точки')

    return () => {
      gui.destroy()
    }
  }, [])

  return null
}
