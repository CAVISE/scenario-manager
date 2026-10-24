type ObjectQuickActionsProps = {
  objectId: string;
};

const dispatch = (name: string, id: string) =>
  window.dispatchEvent(new CustomEvent(name, { detail: { id } }));

export const ObjectQuickActions = ({ objectId }: ObjectQuickActionsProps) => (
  <div className="rp-quick-actions">
    <button
      type="button"
      className="rp-quick-action"
      onClick={() => dispatch('editor-focus-object', objectId)}
    >
      <span aria-hidden="true">⌖</span>Focus on object
    </button>
    <button
      type="button"
      className="rp-quick-action"
      onClick={() => dispatch('editor-show-in-scene-graph', objectId)}
    >
      <span aria-hidden="true">☷</span>Show in Scene Graph
    </button>
  </div>
);
