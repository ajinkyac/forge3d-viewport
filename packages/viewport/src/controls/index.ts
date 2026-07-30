import type { OrthographicCamera, PerspectiveCamera } from 'three';
import { createCadControls } from './cad-controls';
import { createFlyControls } from './fly-controls';
import { createOrbitControls } from './orbit-controls';
import type { ControlsFactory, ControlsHandle, ControlsMode } from './types';

const factories: Record<ControlsMode, ControlsFactory> = {
  cad: createCadControls,
  orbit: createOrbitControls,
  fly: createFlyControls,
};

export function createControls(
  mode: ControlsMode,
  camera: PerspectiveCamera | OrthographicCamera,
  domElement: HTMLElement
): ControlsHandle {
  return factories[mode](camera, domElement);
}

export { createCadControls } from './cad-controls';
export { createFlyControls } from './fly-controls';
export { createOrbitControls } from './orbit-controls';
export type { ControlsFactory, ControlsHandle, ControlsMode } from './types';
