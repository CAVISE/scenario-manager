import { Point } from "../../../../../../../store/types/useEditorStoreTypes";
import { RightPanelProps } from "../../../types/PanelTypes";

export interface RoutePointPropertiesProps {
  point: Point,
  selectedObject: RightPanelProps['selectedObject'];
  onDelete: () => void;
}
