import { MOUSE, TOUCH } from 'three';
import type { OrthographicCamera, PerspectiveCamera } from 'three';
import { OrbitControls } from 'three-stdlib';
import type { ControlsHandle } from './types';

/**
 * General-purpose orbit navigation: left-drag rotates, right-drag pans,
 * the scroll wheel dollies toward the target (not the cursor).
 */
export function createOrbitControls(
  camera: PerspectiveCamera | OrthographicCamera,
  domElement: HTMLElement
): ControlsHandle {
  const controls = new OrbitControls(camera, domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.zoomToCursor = false;

  controls.mouseButtons = {
    LEFT: MOUSE.ROTATE,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.PAN,
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
