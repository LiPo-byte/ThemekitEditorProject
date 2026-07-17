import DraggableGrid from './DraggableGrid';
import { DesktopDndProvider } from './desktop-dnd';

export default function Preview() {
  return (
    <DesktopDndProvider>
      <DraggableGrid />
    </DesktopDndProvider>
  );
}
