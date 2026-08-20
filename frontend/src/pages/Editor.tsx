import { EditorErrorBoundary } from '@editor/components/EditorErrorBoundary';
import EditorLoadingGate from '@editor/components/EditorLoadingGate';
import EditorUI from '@editor/components/EditorUI';
import EditorSceneBootstrap from '@editor/components/EditorSceneBootstrap';
import EditorScenarioBootstrap from '@editor/components/EditorScenarioBootstrap';
import EditorCanvas from '@editor/components/EditorCanvas';
import { useBeforeUnloadWarning } from '@editor/hooks/useBeforeUnloadWarning';
import { useGlobalErrorLogger } from '@editor/hooks/useGlobalErrorLogger';

const Editor = () => {
  useBeforeUnloadWarning();
  useGlobalErrorLogger();

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
