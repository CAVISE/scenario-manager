import { useHooks } from '@editor/context';
import { EditorErrorScreen } from '@editor/Skeletons/EditorErrorScreen';
import { EditorLoadingScreen } from '@editor/Skeletons/EditorLoadingScreen';
import { useEditorStore } from '@/store';

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
