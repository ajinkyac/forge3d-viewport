import type { OrthographicCamera, PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three-stdlib';

export type ControlsMode = 'cad' | 'orbit' | 'fly';

export interface ControlsHandle {
  controls: OrbitControls;
  dispose: () => void;
}

export type ControlsFactory = (
  camera: PerspectiveCamera | OrthographicCamera,
  domElement: HTMLElement
) => ControlsHandle;
