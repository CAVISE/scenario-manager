import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { useEditorStore } from '@/store';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { resolveSelection } from '@/store/utils/sceneEntities';
import { useEditorRefs } from '@editor/context';
import { invalidateEditorScene } from '@editor/lib/invalidateEditorScene';
import {
  buildNavigationTree,
  filterNavigationTree,
  getNavigationIds,
} from '../funcs/navigationTree';
import type {
  NavigationNode,
  SceneTreePanelProps,
} from '../types/SceneTreePanelTypes';
import '../styles/SceneTreePanel.scss';
import { findObjectInScene } from '../funcs/sceneUtils';
import * as THREE from 'three';
import '../styles/navigation.scss';
import { SceneTreeNode } from './SceneTreeNode';
import { SceneTreeActions } from './SceneTreeActions';

export default function SceneTreePanel({
  readOnly = false,
}: SceneTreePanelProps) {
  const state = useEditorStore(
    useShallow((s) => ({
      cars: s.cars,
      RSUs: s.RSUs,
      buildings: s.buildings,
      pedestrians: s.pedestrians,
      points: s.points,
      lidars: s.lidars,
      selectedIds: s.selectedIds,
    }))
  );
  const { sceneRef } = useEditorRefs();
  const [query, setQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'group:car',
    'group:building',
    'group:rsu',
    'group:pedestrian',
    'group:point',
    'group:lidar',
  ]);
  const hoverHelper = useRef<THREE.BoxHelper | null>(null);
  const tree = useMemo(() => buildNavigationTree(state), [state]);
  const filtered = useMemo(
    () => filterNavigationTree(tree, query),
    [tree, query]
  );
  const allIds = getNavigationIds(tree, true);
  const visibleIds = getNavigationIds(filtered, true);
  const clearHover = () => {
    const helper = hoverHelper.current;
    if (helper) {
      helper.parent?.remove(helper);
      helper.dispose();
      hoverHelper.current = null;
      invalidateEditorScene();
    }
  };
  useEffect(() => clearHover, []);

  useEffect(() => {
    const show = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      if (!id) return;
      setQuery('');
      setExpandedItems(getNavigationIds(tree));
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(`[data-scene-id="${CSS.escape(id)}"]`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    };
    window.addEventListener('editor-show-in-scene-graph', show);
    return () => window.removeEventListener('editor-show-in-scene-graph', show);
  }, [tree]);

  const select = (ids: string[]) => {
    const current = useEditorStore.getState();
    current.selectObjects(resolveSelection(current, ids));
  };
  const showHover = (node: NavigationNode) => {
    clearHover();
    if (!node.kind || !sceneRef.current) return;
    const object = findObjectInScene({ itemId: node.id, sceneRef });
    if (!object) return;
    const helper = new THREE.BoxHelper(object, 0x54b8e8);
    helper.raycast = () => {};
    helper.update();
    sceneRef.current.add(helper);
    hoverHelper.current = helper;
    invalidateEditorScene();
  };

  return (
    <div className="stp-root">
      <div className="stp-header">
        <span className="stp-header-label">Scene Graph</span>
        <span className="stp-header-count" data-testid="scene-graph-count">
          {allIds.length} objects
        </span>
        <SceneTreeActions
          readOnly={readOnly}
          allIds={allIds}
          visibleIds={visibleIds}
          selectedIds={state.selectedIds}
          onSelect={select}
          onClearHover={clearHover}
        />
      </div>
      <div className="stp-search">
        <input
          type="search"
          aria-label="Search scene objects"
          placeholder="Search objects…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
        />
      </div>
      {allIds.length ? (
        <div className="stp-tree">
          {filtered.length ? (
            <SimpleTreeView
              multiSelect
              expansionTrigger="iconContainer"
              expandedItems={
                query.trim() ? getNavigationIds(filtered) : expandedItems
              }
              onExpandedItemsChange={(_, ids) => setExpandedItems(ids)}
              selectedItems={state.selectedIds}
              onSelectedItemsChange={(_, ids) => {
                const selected = resolveSelection(
                  useEditorStore.getState(),
                  ids
                );
                if (ids.length && !selected.length) return;
                const hidden = query.trim()
                  ? state.selectedIds.filter((id) => !visibleIds.includes(id))
                  : [];
                const nextIds = [
                  ...new Set([...hidden, ...selected.map((item) => item.id!)]),
                ];
                select(nextIds);
                if (
                  nextIds.length === 1 &&
                  useWorkspacePreferences.getState().focusOnSelection
                )
                  window.dispatchEvent(
                    new CustomEvent('editor-focus-object', {
                      detail: { id: nextIds[0] },
                    })
                  );
              }}
            >
              {filtered.map((node) => (
                <SceneTreeNode
                  key={node.id}
                  node={node}
                  onHover={showHover}
                  onLeave={clearHover}
                />
              ))}
            </SimpleTreeView>
          ) : (
            <p className="stp-empty-text">No matching objects</p>
          )}
        </div>
      ) : (
        <div className="stp-empty">
          <span className="stp-empty-text">
            Add an object to start building your scenario.
          </span>
        </div>
      )}
      <p className="stp-selection-hint">
        {state.selectedIds.length} selected · Ctrl/⌘ toggles · Shift selects a
        range
      </p>
    </div>
  );
}
