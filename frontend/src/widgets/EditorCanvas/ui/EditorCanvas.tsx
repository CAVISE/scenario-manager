import { useEditorRefs } from '@editor/context';
import '../styles/EditorCanvas.scss';

export const EditorCanvas = () => {
  const { mountRef } = useEditorRefs();
  return (
    <div
      ref={mountRef}
      id="ThreeJS"
      data-testid="editor-canvas"
      className="editor-canvas"
    />
  );
};
