import { styles } from '../types/EditorCanvasTypes';
import { useEditorRefs } from '../../../context';
export const EditorCanvas = () => {
  const { mountRef } = useEditorRefs();
  return <div ref={mountRef} id="ThreeJS" style={styles} />;
};
