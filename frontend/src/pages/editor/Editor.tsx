import { EditorErrorBoundary } from './EditorErrorBoundary';
import EditorLoadingGate from './EditorLoadingGate';
import { EditorUI } from './EditorUI';
import { EditorSceneBootstrap } from './EditorSceneBootstrap';
import { EditorScenarioBootstrap } from './EditorScenarioBootstrap';
import { EditorCanvas } from './EditorCanvas';
import { useBeforeUnloadWarning } from './hooks/useBeforeUnloadWarning';

const Editor = () => {
  useBeforeUnloadWarning();

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
