import { MOUSE, TOUCH } from 'three';
import type { OrthographicCamera, PerspectiveCamera } from 'three';
import { OrbitControls } from 'three-stdlib';
import type { ControlsHandle } from './types';

/**
 * Onshape-style CAD navigation: middle-drag (or Alt+left-drag) orbits,
 * shift+middle-drag pans, and the scroll wheel dollies toward the cursor.
 *
 * OrbitControls' built-in mouse-button modifier logic only recognizes
 * ctrl/meta/shift (not Alt), so Alt+left is implemented by reading
 * `event.altKey` at pointerdown and remapping `mouseButtons.LEFT` just
 * before OrbitControls' own pointerdown handler runs — our listener is
 * registered on the same element ahead of `connect()`, so it fires first.
 * Left-click is otherwise unbound, matching CAD conventions where a bare
 * left-click is reserved for selection.
 */
export function createCadControls(
  camera: PerspectiveCamera | OrthographicCamera,
  domElement: HTMLElement
): ControlsHandle {
  const handlePointerDown = (event: PointerEvent) => {
    controls.mouseButtons.LEFT = event.altKey ? MOUSE.ROTATE : undefined;
  };
  domElement.addEventListener('pointerdown', handlePointerDown);

  const controls = new OrbitControls(camera, domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;

  controls.mouseButtons = {
    MIDDLE: MOUSE.ROTATE,
  };
  controls.touches = {
    ONE: TOUCH.ROTATE,
    TWO: TOUCH.DOLLY_PAN,
  };

  return {
    controls,
    dispose: () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
    },
  };
}
