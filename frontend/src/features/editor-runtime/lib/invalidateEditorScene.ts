const EVENT_NAME = 'editor-scene-invalidated';

export const invalidateEditorScene = () => {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(EVENT_NAME));
};

export const editorSceneInvalidationEvent = EVENT_NAME;
