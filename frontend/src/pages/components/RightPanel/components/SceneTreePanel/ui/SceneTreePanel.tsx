import React, { useCallback, useEffect, useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useEditorStore } from '../../../../../../store';
import type { SceneNode } from '../../../types/PanelTypes';
import { css, extraCss } from '../types/SceneTreePanelTypes';
import { countNodes, getTypeMeta } from '../types/SceneTreePanelTypes';
import { syncPointsWithScene } from '../funcs/syncPointsWithScene';
import { collectExpandedIds } from '../funcs/collectExpandedIds';
import { handleSelect } from '../funcs/handleSelect';
import { handleClearScene } from '../funcs/handleClearScene';
import { handleDeleteNode } from '../funcs/handleDeleteNode';
import { useHooks } from '../../../../../Editor/context';
import { useEditorRefs } from '../../../../../Editor/context';

export default function SceneTreePanel() {
  const { sceneGraph, detachTransformControls } = useHooks();
  const onSelectObject = useEditorStore((s) => s.selectObject);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectObject = useEditorStore((s) => s.selectObject);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const {
    sceneRef,
    pointsArrRef,
    transformControlsRef,
    carMeshesRef,
    cubeCirclesRef,
  } = useEditorRefs();
  useEffect(() => {
    syncPointsWithScene({ sceneRef, pointsArrRef });
  }, [sceneRef, pointsArrRef]);

  useEffect(() => {
    collectExpandedIds({ sceneGraph, setExpandedItems });
  }, [sceneGraph]);

  const handle_select = useCallback(
    (itemId: string) => {
      handleSelect({
        sceneRef,
        transformControlsRef,
        detachTransformControls,
        itemId,
        pointsArrRef,
        selectObject,
        onSelectObject,
        carMeshesRef,
      });
    },
    [
      sceneRef,
      transformControlsRef,
      pointsArrRef,
      carMeshesRef,
      selectObject,
      onSelectObject,
      detachTransformControls,
    ],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string, name: string) => {
      handleDeleteNode({
        e,
        id,
        name,
        sceneRef,
        transformControlsRef,
        detachTransformControls,
        carMeshesRef,
        cubeCirclesRef,
        pointsArrRef,
      });
    },
    [
      transformControlsRef,
      carMeshesRef,
      cubeCirclesRef,
      pointsArrRef,
      sceneRef,
      detachTransformControls,
    ],
  );

  const handle_clear_scene = useCallback(() => {
    handleClearScene({
      transformControlsRef,
      carMeshesRef,
      cubeCirclesRef,
      pointsArrRef,
      sceneRef,
      detachTransformControls,
    });
  }, [
    transformControlsRef,
    carMeshesRef,
    cubeCirclesRef,
    pointsArrRef,
    sceneRef,
    detachTransformControls,
  ]);

  const renderTreeItem = useCallback(
    (node: SceneNode): React.ReactNode => {
      const meta = getTypeMeta(node.name);
      const isSelected = node.id === selectedId;

      return (
        <TreeItem
          key={node.id}
          itemId={node.id}
          label={
            <div className="stp-node">
              <div className="stp-node-left">
                <span
                  className="stp-node-dot"
                  style={{ background: meta.color }}
                />
                <span className="stp-node-icon">{meta.icon}</span>
                <span
                  className={`stp-node-name ${isSelected ? 'selected' : ''}`}
                >
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
                <button
                  className="stp-node-delete"
                  onClick={(e) => handleDelete(e, node.id, node.name)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          }
        >
          {node.children?.map(renderTreeItem)}
        </TreeItem>
      );
    },
    [selectedId, handleDelete],
  );

  const total = sceneGraph ? countNodes(sceneGraph) - 1 : 0;

  return (
    <div className="stp-root">
      <style>{css + extraCss}</style>
      <div className="stp-header">
        <span className="stp-header-label">Scene Graph</span>
        <span className="stp-header-count">{total} objects</span>
        {total > 0 && (
          <button className="stp-clear-btn" onClick={handle_clear_scene}>
            Clear all
          </button>
        )}
      </div>

      {sceneGraph && total > 0 ? (
        <div className="stp-tree">
          <SimpleTreeView
            expandedItems={expandedItems}
            onExpandedItemsChange={(_, items) => setExpandedItems(items)}
            selectedItems={selectedId ?? ''}
            onSelectedItemsChange={(_, itemId) => {
              if (itemId) handle_select(itemId);
            }}
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
