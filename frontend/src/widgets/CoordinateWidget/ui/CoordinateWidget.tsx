import { useEditorRefs } from '@editor/context';
import { CoordinatesDisplay } from '../components/CoordinatesDisplay';
import { NoCoordinates } from '../components/NoCoordinates';
import { WidgetContainer } from '../components/WidgetContainer';
import { useCarlaOffset } from '../hooks/useCarlaOffset';
import { useCoordinatesTracking } from '../hooks/useCoordinatesTracking';

export function CoordinatesWidget() {
  const { cameraRef, roadMeshRef } = useEditorRefs();
  const { coords, onMap } = useCoordinatesTracking({ cameraRef, roadMeshRef });
  const offset = useCarlaOffset();

  return (
    <WidgetContainer onMap={onMap}>
      {coords ? (
        <CoordinatesDisplay coords={coords} onMap={onMap} offset={offset} />
      ) : (
        <NoCoordinates />
      )}
    </WidgetContainer>
  );
}
