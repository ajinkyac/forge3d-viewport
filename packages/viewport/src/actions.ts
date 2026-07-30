import { Box3, Object3D, Vector3, WebGLRenderer } from 'three';
import type { Mesh, PerspectiveCamera, Scene } from 'three';
import type { OrbitControls } from 'three-stdlib';

export interface ScreenshotOptions {
  width: number;
  height: number;
  format?: 'png' | 'jpeg';
}

const FRAME_MARGIN = 1.2;
const FRAME_DURATION_MS = 400;
const MIN_FRAME_SIZE = 0.01;

/**
 * World-space bounds of everything under `root` with renderable geometry,
 * skipping subtrees flagged `userData.viewportHelper` (grid, gizmos, etc).
 * Lights and cameras have no geometry, so they're excluded automatically.
 */
export function computeVisibleBounds(root: Object3D): Box3 {
  const box = new Box3();

  const collect = (object: Object3D) => {
    if (object.userData.viewportHelper) return;

    const geometry = (object as Mesh).geometry;
    if (geometry) {
      object.updateWorldMatrix(true, false);
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        box.union(geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
      }
    }

    for (const child of object.children) collect(child);
  };

  collect(root);
  return box;
}

function animateCamera(
  camera: PerspectiveCamera,
  controls: OrbitControls | null,
  targetPosition: Vector3,
  targetLookAt: Vector3,
  duration = FRAME_DURATION_MS
): Promise<void> {
  const startPosition = camera.position.clone();
  const startTarget = controls ? controls.target.clone() : targetLookAt.clone();
  const startTime = performance.now();

  return new Promise((resolve) => {
    function step(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startPosition, targetPosition, eased);

      if (controls) {
        controls.target.lerpVectors(startTarget, targetLookAt, eased);
        controls.update();
      } else {
        camera.lookAt(targetLookAt);
      }

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

/** Animates the camera to frame `box` with `margin` headroom over ~400ms. */
export function frameBox(
  camera: PerspectiveCamera,
  controls: OrbitControls | null,
  box: Box3,
  margin = FRAME_MARGIN
): Promise<void> {
  if (box.isEmpty()) return Promise.resolve();

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const maxSize = Math.max(size.x, size.y, size.z, MIN_FRAME_SIZE);

  const fitHeightDistance = maxSize / (2 * Math.tan((camera.fov * Math.PI) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = margin * Math.max(fitHeightDistance, fitWidthDistance);

  const currentTarget = controls ? controls.target : center;
  const direction = camera.position.clone().sub(currentTarget);
  if (direction.lengthSq() < 1e-8) direction.set(0, 0, 1);
  direction.normalize();

  const newPosition = center.clone().addScaledVector(direction, distance);

  return animateCamera(camera, controls, newPosition, center);
}

/**
 * Renders `scene` off-screen at the requested resolution and resolves a
 * Blob — uses a throwaway renderer/camera so the live canvas never sees it.
 */
export function takeScreenshot(
  scene: Scene,
  camera: PerspectiveCamera,
  gl: WebGLRenderer,
  { width, height, format = 'png' }: ScreenshotOptions
): Promise<Blob> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = gl.outputColorSpace;
  renderer.toneMapping = gl.toneMapping;
  renderer.toneMappingExposure = gl.toneMappingExposure;
  renderer.shadowMap.enabled = gl.shadowMap.enabled;
  renderer.shadowMap.type = gl.shadowMap.type;

  const snapshotCamera = camera.clone();
  snapshotCamera.aspect = width / height;
  snapshotCamera.updateProjectionMatrix();

  renderer.render(scene, snapshotCamera);

  return new Promise((resolve, reject) => {
    renderer.domElement.toBlob((blob) => {
      renderer.dispose();
      renderer.forceContextLoss();
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('[Viewport] screenshot: failed to encode image'));
      }
    }, `image/${format}`);
  });
}
