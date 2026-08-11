import { useEffect } from 'react';
import { useEditorRefs } from '../../../context';

/**
 * Tracks how many editor modals are currently open, via a shared ref
 * (EditorRefs.modalOpenCountRef) rather than React state, so that opening
 * or closing a modal never triggers a scene re-render.
 *
 * The Three.js canvas and its animate loop (see useSceneAnimator /
 * useSpotlight) stay mounted underneath open modals — MUI's <Modal>
 * renders in a portal on top of the canvas, it doesn't unmount it. Call
 * this hook with the modal's `open` prop so canvas-only interactions
 * (e.g. GPU picking) can check modalOpenCountRef and skip work while any
 * modal covers the scene.
 *
 * A count (rather than a boolean) is used so that multiple modals opening
 * in quick succession — e.g. one closing while another opens in the same
 * render pass — can't prematurely mark the canvas as uncovered.
 */
export function useModalOpenTracking(open: boolean) {
  const { modalOpenCountRef } = useEditorRefs();

  useEffect(() => {
    if (!open) return;

    modalOpenCountRef.current += 1;
    return () => {
      modalOpenCountRef.current = Math.max(
        0,
        modalOpenCountRef.current - 1,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
