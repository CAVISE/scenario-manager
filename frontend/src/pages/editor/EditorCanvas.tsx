import { styles } from './EditorCanvas.types';
import { useEditorRefs } from './context';
export const EditorCanvas = () => {
  const { mountRef } = useEditorRefs();
  return (
    <div
      ref={mountRef}
      id="ThreeJS"
      data-testid="editor-canvas"
      style={styles}
    />
  );
};
