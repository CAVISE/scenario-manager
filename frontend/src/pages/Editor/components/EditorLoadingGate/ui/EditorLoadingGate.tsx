import { useEditorStore } from '../../../../../store';
import { useHooks } from '../../../context';
import { EditorErrorScreen } from '../../../Skeletons/EditorErrorScreen';
import { EditorLoadingScreen } from '../../../Skeletons/EditorLoadingScreen';

export default function EditorLoadingGate() {
  const { loadingText } = useHooks();
  const error = useEditorStore((s) => s.error);

  if (error) return <EditorErrorScreen />;

  const isLoading = loadingText !== null;

  if (isLoading) {
    return <EditorLoadingScreen />;
  }

  return null;
}
