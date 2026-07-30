import { useCallback } from 'react';
import type { RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import { Box3, Object3D } from 'three';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { OrbitControls } from 'three-stdlib';
import { useViewportContext } from './ViewportContext';
import { computeVisibleBounds, frameBox, takeScreenshot } from './actions';
import type { ScreenshotOptions } from './actions';

export interface UseViewportResult {
  camera: PerspectiveCamera;
  scene: Scene;
  gl: WebGLRenderer;
  fitToView: () => Promise<void>;
  frameObject: (ref: RefObject<Object3D>) => Promise<void>;
  screenshot: (options: ScreenshotOptions) => Promise<Blob>;
  controls: OrbitControls | null;
}

/**
 * Access to the enclosing Viewport's camera/scene/renderer and its
 * imperative actions. Must be called from a component rendered inside a
 * <Viewport> (e.g. scene children, or a drei <Html> overlay) — throws via
 * useViewportContext otherwise.
 */
export function useViewport(): UseViewportResult {
  const ctx = useViewportContext();
  const { camera, scene, gl } = useThree();
  const perspectiveCamera = camera as PerspectiveCamera;

  const fitToView = useCallback(async () => {
    const box = computeVisibleBounds(scene);
    await frameBox(perspectiveCamera, ctx.controls, box);
  }, [perspectiveCamera, scene, ctx.controls]);

  const frameObject = useCallback(
    async (ref: RefObject<Object3D>) => {
      const object = ref.current;
      if (!object) return;
      const box = new Box3().setFromObject(object);
      await frameBox(perspectiveCamera, ctx.controls, box);
    },
    [perspectiveCamera, ctx.controls]
  );

  const screenshot = useCallback(
    (options: ScreenshotOptions) => takeScreenshot(scene, perspectiveCamera, gl, options),
    [scene, perspectiveCamera, gl]
  );

  return {
    camera: perspectiveCamera,
    scene,
    gl,
    fitToView,
    frameObject,
    screenshot,
    controls: ctx.controls,
  };
}
