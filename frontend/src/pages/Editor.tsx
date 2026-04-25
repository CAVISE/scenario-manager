import EditorLoadingGate from './Editor/components/EditorLoadingGate';
import EditorUI from './Editor/components/EditorUI';
import EditorSceneBootstrap from './Editor/components/EditorSceneBootstrap';
import EditorCanvas from './Editor/components/EditorCanvas';

const Editor = () => {
  return (
    <>
      <EditorLoadingGate />
      <EditorCanvas />
      <EditorUI />
      <EditorSceneBootstrap />
    </>
  );
};

export default Editor;
