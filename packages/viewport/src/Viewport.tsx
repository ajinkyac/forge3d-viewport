import { useRef, useEffect, useMemo } from 'react';
import type { ReactNode, CSSProperties, MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Color } from 'three';
import type { PerspectiveCamera, Scene, WebGLRenderer, ColorRepresentation } from 'three';
import type { OrbitControls } from 'three-stdlib';
import { ViewportContext } from './ViewportContext';
import type { ViewportContextValue } from './ViewportContext';
import { createControls } from './controls';
import type { ControlsMode } from './controls';

// ─── Public types ─────────────────────────────────────────────────────────────

export type { ControlsMode } from './controls';

export interface CameraConfig {
  position?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}

export interface ViewportAPI {
  fitToView: () => void;
  frameObject: () => void;
  screenshot: () => void;
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
  controlsRef: MutableRefObject<OrbitControls | null>;
}

function ControlsRig({ mode, controlsRef }: ControlsRigProps) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handle = createControls(mode, camera as PerspectiveCamera, gl.domElement);
    controlsRef.current = handle.controls;

    return () => {
      handle.dispose();
      controlsRef.current = null;
    };
  }, [mode, camera, gl]);

  useFrame(() => {
    controlsRef.current?.update();
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
  controls,
  lighting,
  onReady,
  style,
  className,
}: ViewportProps) {
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const glRef = useRef<WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const ctx = useMemo<ViewportContextValue>(() => ({ cameraRef, sceneRef, glRef }), []);

  const api = useMemo<ViewportAPI>(
    () => ({
      fitToView: () => console.warn('[Viewport] fitToView: not implemented'),
      frameObject: () => console.warn('[Viewport] frameObject: not implemented'),
      screenshot: () => console.warn('[Viewport] screenshot: not implemented'),
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

  const controlsMode = controls ?? 'cad';

  return (
    <div style={{ width: '100%', height: '100%', ...style }} className={className}>
      <Canvas gl={{ antialias: true }} dpr={[1, 2]} shadows camera={resolvedCamera}>
        <ViewportContext.Provider value={ctx}>
          <ControlsRig mode={controlsMode} controlsRef={controlsRef} />
          <ViewportBridge ctx={ctx} background={background} onReady={onReady} api={api} />
          {lighting === 'default' && <DefaultLighting />}
          {children}
        </ViewportContext.Provider>
      </Canvas>
    </div>
  );
}
