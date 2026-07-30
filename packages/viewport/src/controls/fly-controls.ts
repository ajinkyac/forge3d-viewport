import { MOUSE, TOUCH } from 'three';
import type { OrthographicCamera, PerspectiveCamera } from 'three';
import { OrbitControls } from 'three-stdlib';
import type { ControlsHandle } from './types';

/**
 * Free-look navigation: right-drag looks around, left-drag strafes/pans,
 * scroll dollies toward the cursor. Lower damping factor than cad/orbit
 * for a snappier, more direct feel.
 */
export function createFlyControls(
  camera: PerspectiveCamera | OrthographicCamera,
  domElement: HTMLElement
): ControlsHandle {
  const controls = new OrbitControls(camera, domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.15;
  controls.zoomToCursor = true;

  controls.mouseButtons = {
    LEFT: MOUSE.PAN,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.ROTATE,
  };
  controls.touches = {
    ONE: TOUCH.ROTATE,
    TWO: TOUCH.DOLLY_PAN,
  };

  return {
    controls,
    dispose: () => controls.dispose(),
  };
}
