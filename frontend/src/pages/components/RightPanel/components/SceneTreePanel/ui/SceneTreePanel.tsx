import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
} from '@mui/material';
import { useEditorStore } from '@/store';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { resolveSelection } from '@/store/utils/sceneEntities';
import { useEditorRefs } from '@editor/context';
import { useAppToast } from '@/components/AppToast';
import { deleteSelectedObjects } from '../../MultiSelectionProperties/model/batchActions';
import {
  buildNavigationTree,
  filterNavigationTree,
  getNavigationIds,
  type NavigationNode,
} from '../funcs/navigationTree';
import { TYPE_META } from '../types/SceneTreePanelTypes';
import '../styles/SceneTreePanel.scss';
import { findObjectInScene } from '../funcs/sceneUtils';
import * as THREE from 'three';
import '../styles/navigation.scss';
import { watchHistoryEntryValidity } from '../funcs/deletionSnapshots/ui/deletionSnapshots';

const typeKeys = {
  car: 'Car',
  rsu: 'RSU',
  building: 'Building',
  pedestrian: 'Pedestrian',
  point: 'Point',
  lidar: 'Lidar',
};

export default function SceneTreePanel({
  readOnly = false,
}: {
  readOnly?: boolean;
}) {
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
  const toast = useAppToast();
  const [query, setQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'group:car',
    'group:building',
    'group:rsu',
    'group:pedestrian',
    'group:point',
    'group:lidar',
  ]);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
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
  const renderNode = (node: NavigationNode) => {
    const meta = node.kind ? TYPE_META[typeKeys[node.kind]] : null;
    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        label={
          <div
            className="stp-node"
            data-scene-id={node.id}
            onMouseEnter={() => {
              clearHover();
              if (!node.kind || !sceneRef.current) return;
              const object = findObjectInScene({ itemId: node.id, sceneRef });
              if (object) {
                const helper = new THREE.BoxHelper(object, 0x54b8e8);
                helper.raycast = () => {};
                sceneRef.current.add(helper);
                hoverHelper.current = helper;
              }
            }}
            onMouseLeave={clearHover}
          >
            <span className="stp-node-icon" aria-hidden="true">
              {meta?.icon ?? '▤'}
            </span>
            <span className="stp-node-name">{node.name}</span>
            {meta && (
              <span className="stp-node-badge" style={{ color: meta.color }}>
                {meta.label}
              </span>
            )}
          </div>
        }
      >
        {node.children?.map(renderNode)}
      </TreeItem>
    );
  };

  return (
    <div className="stp-root">
      <div className="stp-header">
        <span className="stp-header-label">Scene Graph</span>
        <span className="stp-header-count" data-testid="scene-graph-count">
          {allIds.length} objects
        </span>
        <button
          type="button"
          className="stp-menu-button"
          aria-label="Scene actions"
          aria-haspopup="menu"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
        >
          ⋯
        </button>
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
              {filtered.map(renderNode)}
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
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          disabled={!visibleIds.length}
          onClick={() => {
            select(visibleIds);
            setMenuAnchor(null);
          }}
        >
          Select all shown
        </MenuItem>
        <MenuItem
          disabled={!state.selectedIds.length}
          onClick={() => {
            select([]);
            setMenuAnchor(null);
          }}
        >
          Clear selection
        </MenuItem>
        <MenuItem
          disabled={readOnly || !state.selectedIds.length}
          onClick={() => {
            setMenuAnchor(null);
            const result = deleteSelectedObjects();
            if (result) {
              toast.undo(
                `${result.count} objects deleted`,
                () => useEditorStore.getState().undo(),
                undefined,
                watchHistoryEntryValidity(result.entryId)
              );
            }
          }}
        >
          Delete selected
        </MenuItem>
        <MenuItem
          disabled={readOnly || !allIds.length}
          onClick={() => {
            setMenuAnchor(null);
            setClearOpen(true);
          }}
        >
          Clear scene…
        </MenuItem>
      </Menu>
      <Dialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        aria-labelledby="clear-scene-title"
      >
        <DialogTitle id="clear-scene-title">Clear scene?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove all {allIds.length} objects and their routes and sensors? You
            can restore them with Undo.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearOpen(false)}>Cancel</Button>
          <Button
            color="error"
            disabled={readOnly}
            onClick={() => {
              if (
                readOnly ||
                useEditorStore.getState().simulationSession.phase === 'running'
              )
                return;
              select(allIds);
              const result = deleteSelectedObjects();
              setClearOpen(false);
              if (result) {
                toast.undo(
                  'Scene cleared',
                  () => useEditorStore.getState().undo(),
                  undefined,
                  watchHistoryEntryValidity(result.entryId)
                );
              }
            }}
          >
            Clear scene
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
