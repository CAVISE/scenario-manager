import React, { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useEditorStore } from '../../../../../store/useEditorStore';
import type { SceneNode } from '../types/PanelTypes';
import { TYPE_META, css } from './types/SceneTreePanelTypes';
import type {SceneTreePanelProps} from './types/SceneTreePanelTypes'

function getTypeMeta(name: string) {
  for (const [key, val] of Object.entries(TYPE_META)) {
    if (name.startsWith(key)) return val;
  }
  return { icon: '◇', color: '#6b7280', label: 'OBJ' };
}

function countNodes(node: SceneNode): number {
  return 1 + (node.children?.reduce((a, c) => a + countNodes(c), 0) ?? 0);
}


export default function SceneTreePanel({
  sceneGraph, onDetach, sceneRef, transformControlsRef,
  onSelectObject, pointsArrRef, carMeshesRef,
}: SceneTreePanelProps) {
  const selectedId   = useEditorStore(s => s.selectedId);
  const selectObject = useEditorStore(s => s.selectObject);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    if (sceneGraph?.id) {
      setExpandedItems(prev =>
        prev.includes(sceneGraph.id) ? prev : [sceneGraph.id, ...prev],
      );
    }
  }, [sceneGraph?.id]);

  useEffect(() => {
    if (!sceneGraph) return;
    const ids: string[] = [];
    const collect = (node: SceneNode) => {
      if (node.children?.length) {
        ids.push(node.id);
        node.children.forEach(collect);
      }
    };
    collect(sceneGraph);
    setExpandedItems(ids);
  }, [sceneGraph]);

  const handleSelect = useCallback((itemId: string) => {
    const scene = sceneRef.current;
    const tc    = transformControlsRef.current;
    if (!scene || !tc) return;

    let found: THREE.Object3D | null = null;
    scene.traverse((obj: THREE.Object3D) => {
      if (obj.userData.id === itemId) found = obj;
    });

    if (!found) { onDetach(); return; }

    const obj  = found as THREE.Object3D;
    const type = obj.userData.type;
    tc.detach();

    if (type === 'point') {
      const rsuMesh = pointsArrRef.current.find(p => p.userData.id === itemId);
      if (rsuMesh) {
        tc.attach(rsuMesh);
        selectObject(itemId);
        onSelectObject({ type: 'rsu', id: itemId, position: rsuMesh.position });
        return;
      }
    }
    if (type === 'lidar') {
      let lidarMesh: THREE.Object3D | null = null;
      carMeshesRef.current.forEach(car => {
        car.traverse(child => { if (child.userData.id === itemId) lidarMesh = child; });
      });
      if (lidarMesh) {
        tc.attach(lidarMesh as THREE.Object3D);
        selectObject(itemId);
        onSelectObject({ type: 'lidar', id: itemId });
        return;
      }
    }
    if (type === 'circle') {
      tc.attach(obj);
      selectObject(null);
      onSelectObject({ type: 'point', position: obj.position });
      return;
    }
    tc.attach(obj);
    selectObject(itemId);
    onSelectObject({ type, id: itemId });
  }, [sceneRef, transformControlsRef, pointsArrRef, carMeshesRef, selectObject, onSelectObject, onDetach]);

  const renderTreeItem = useCallback((node: SceneNode): React.ReactNode => {
    const meta       = getTypeMeta(node.name);
    const isSelected = node.id === selectedId;
    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={
          <div className="stp-node">
            <div className="stp-node-left">
              <span className="stp-node-dot" style={{ background: meta.color }} />
              <span className="stp-node-icon">{meta.icon}</span>
              <span className={`stp-node-name ${isSelected ? 'selected' : ''}`}>
                {node.name}
              </span>
            </div>
            <div className="stp-node-right">
              <span
                className="stp-node-badge"
                style={{ color: meta.color, background: `${meta.color}18` }}
              >
                {meta.label}
              </span>
            </div>
          </div>
        }
      >
        {node.children?.map(renderTreeItem)}
      </TreeItem>
    );
  }, [selectedId]);

  const total = sceneGraph ? countNodes(sceneGraph) - 1 : 0;

  return (
    <div className="stp-root">
      <style>{css}</style>
      <div className="stp-header">
        <span className="stp-header-label">Scene Graph</span>
        <span className="stp-header-count">{total} objects</span>
      </div>

      {sceneGraph && total > 0 ? (
        <div className="stp-tree">
          <SimpleTreeView
            expandedItems={expandedItems}
            onExpandedItemsChange={(_, items) => setExpandedItems(items)}
            selectedItems={selectedId ?? ''}
            onSelectedItemsChange={(_, itemId) => { if (itemId) handleSelect(itemId); }}
          >
            {sceneGraph.children?.map(renderTreeItem)}
          </SimpleTreeView>
        </div>
      ) : (
        <div className="stp-empty">
          <div className="stp-empty-icon">⬡</div>
          <span className="stp-empty-text">scene is empty</span>
        </div>
      )}
    </div>
  );
}
