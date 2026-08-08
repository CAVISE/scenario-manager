import { EditorErrorBoundary } from './Editor/components/EditorErrorBoundary';
import EditorLoadingGate from './Editor/components/EditorLoadingGate';
import EditorUI from './Editor/components/EditorUI';
import EditorSceneBootstrap from './Editor/components/EditorSceneBootstrap';
import EditorScenarioBootstrap from './Editor/components/EditorScenarioBootstrap';
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
      <EditorScenarioBootstrap />
    </EditorErrorBoundary>
  );
};

export default Editor;
