import { EditorErrorBoundary } from './Editor/components/EditorErrorBoundary';
import EditorLoadingGate from './Editor/components/EditorLoadingGate';
import EditorUI from './Editor/components/EditorUI';
import EditorSceneBootstrap from './Editor/components/EditorSceneBootstrap';
import EditorCanvas from './Editor/components/EditorCanvas';

const Editor = () => {
  return (
    <EditorErrorBoundary>
      <EditorLoadingGate />
      <EditorErrorBoundary>
        <EditorCanvas />
      </EditorErrorBoundary>
      <EditorUI />
      <EditorSceneBootstrap />
    </EditorErrorBoundary>
  );
};

export default Editor;
