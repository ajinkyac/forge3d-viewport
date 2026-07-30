import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import type { ReactNode, CSSProperties, MutableRefObject, RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box3, Color } from 'three';
import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer, ColorRepresentation } from 'three';
import type { OrbitControls } from 'three-stdlib';
import { ViewportContext } from './ViewportContext';
import type { ViewportContextValue } from './ViewportContext';
import { createControls } from './controls';
import type { ControlsMode } from './controls';
import { computeVisibleBounds, frameBox, takeScreenshot } from './actions';
import type { ScreenshotOptions } from './actions';

// ─── Public types ─────────────────────────────────────────────────────────────

export type { ControlsMode } from './controls';
export type { ScreenshotOptions } from './actions';

export interface CameraConfig {
  position?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}

export interface ViewportAPI {
  fitToView: () => Promise<void>;
  frameObject: (ref: RefObject<Object3D>) => Promise<void>;
  screenshot: (options: ScreenshotOptions) => Promise<Blob>;
  controlsRef: MutableRefObject<OrbitControls | null>;
}

export interface ViewportProps {
  children?: ReactNode;
  background?: ColorRepresentation;
  camera?: CameraConfig;
  controls?: ControlsMode;
  lighting?: 'default' | 'none';
  onReady?: (api: ViewportAPI) => void;
  style?: CSSProperties;
  className?: string;
}

// ─── Internal scene components ────────────────────────────────────────────────

interface BridgeProps {
  ctx: ViewportContextValue;
  background?: ColorRepresentation;
  onReady?: (api: ViewportAPI) => void;
  api: ViewportAPI;
}

function ViewportBridge({ ctx, background, onReady, api }: BridgeProps) {
  const { camera, scene, gl } = useThree();

  useEffect(() => {
    ctx.cameraRef.current = camera as PerspectiveCamera;
    ctx.sceneRef.current = scene;
    ctx.glRef.current = gl;
    onReady?.(api);
  }, []); // intentional: fire once after canvas mounts

  useEffect(() => {
    scene.background = background !== undefined ? new Color(background) : null;
    return () => {
      scene.background = null;
    };
  }, [background, scene]);

  return null;
}

interface ControlsRigProps {
  mode: ControlsMode;
  onControlsChange: (controls: OrbitControls | null) => void;
}

function ControlsRig({ mode, onControlsChange }: ControlsRigProps) {
  const { camera, gl } = useThree();
  const activeRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const handle = createControls(mode, camera as PerspectiveCamera, gl.domElement);
    activeRef.current = handle.controls;
    onControlsChange(handle.controls);

    return () => {
      handle.dispose();
      activeRef.current = null;
      onControlsChange(null);
    };
  }, [mode, camera, gl, onControlsChange]);

  useFrame(() => {
    activeRef.current?.update();
  });

  return null;
}

function DefaultLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </>
  );
}

// ─── Viewport ─────────────────────────────────────────────────────────────────

export function Viewport({
  children,
  background,
  camera,
  controls: controlsModeProp,
  lighting,
  onReady,
  style,
  className,
}: ViewportProps) {
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const glRef = useRef<WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);

  const handleControlsChange = useCallback((next: OrbitControls | null) => {
    controlsRef.current = next;
    setControls(next);
  }, []);

  const ctx = useMemo<ViewportContextValue>(
    () => ({ cameraRef, sceneRef, glRef, controls }),
    [controls]
  );

  const api = useMemo<ViewportAPI>(
    () => ({
      fitToView: async () => {
        const scene = sceneRef.current;
        const cam = cameraRef.current;
        if (!scene || !cam) return;
        const box = computeVisibleBounds(scene);
        await frameBox(cam, controlsRef.current, box);
      },
      frameObject: async (ref) => {
        const cam = cameraRef.current;
        const object = ref.current;
        if (!cam || !object) return;
        const box = new Box3().setFromObject(object);
        await frameBox(cam, controlsRef.current, box);
      },
      screenshot: (options) => {
        const scene = sceneRef.current;
        const cam = cameraRef.current;
        const gl = glRef.current;
        if (!scene || !cam || !gl) {
          return Promise.reject(new Error('[Viewport] screenshot: viewport is not ready'));
        }
        return takeScreenshot(scene, cam, gl, options);
      },
      controlsRef,
    }),
    []
  );

  const resolvedCamera = {
    position: camera?.position ?? ([5, 5, 5] as [number, number, number]),
    fov: camera?.fov ?? 45,
    near: camera?.near ?? 0.1,
    far: camera?.far ?? 1000,
  };

  const controlsMode = controlsModeProp ?? 'cad';

  return (
    <div style={{ width: '100%', height: '100%', ...style }} className={className}>
      <Canvas gl={{ antialias: true }} dpr={[1, 2]} shadows camera={resolvedCamera}>
        <ViewportContext.Provider value={ctx}>
          <ControlsRig mode={controlsMode} onControlsChange={handleControlsChange} />
          <ViewportBridge ctx={ctx} background={background} onReady={onReady} api={api} />
          {lighting === 'default' && <DefaultLighting />}
          {children}
        </ViewportContext.Provider>
      </Canvas>
    </div>
  );
}
