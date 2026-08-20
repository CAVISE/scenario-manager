import { useEditorRefs } from '@editor/context';
import { styles } from '../types/EditorCanvasTypes';
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
