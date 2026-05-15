import { useRef, useEffect, useMemo } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Color } from 'three';
import type { PerspectiveCamera, Scene, WebGLRenderer, ColorRepresentation } from 'three';
import { ViewportContext } from './ViewportContext';
import type { ViewportContextValue } from './ViewportContext';

// ─── Public types ─────────────────────────────────────────────────────────────

export type ControlsMode = 'cad' | 'orbit' | 'fly';

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
}

export interface ViewportProps {
  children?: ReactNode;
  background?: ColorRepresentation;
  camera?: CameraConfig;
  /** Accepted but not yet implemented — controls are stubbed. */
  controls?: ControlsMode;
  lighting?: 'default' | 'none';
  onReady?: (api: ViewportAPI) => void;
  style?: CSSProperties;
  className?: string;
}

// ─── Stub imperative API ──────────────────────────────────────────────────────

const STUB_API: ViewportAPI = {
  fitToView: () => console.warn('[Viewport] fitToView: not implemented'),
  frameObject: () => console.warn('[Viewport] frameObject: not implemented'),
  screenshot: () => console.warn('[Viewport] screenshot: not implemented'),
};

// ─── Internal scene components ────────────────────────────────────────────────

interface BridgeProps {
  ctx: ViewportContextValue;
  background?: ColorRepresentation;
  onReady?: (api: ViewportAPI) => void;
}

function ViewportBridge({ ctx, background, onReady }: BridgeProps) {
  const { camera, scene, gl } = useThree();

  useEffect(() => {
    ctx.cameraRef.current = camera as PerspectiveCamera;
    ctx.sceneRef.current = scene;
    ctx.glRef.current = gl;
    onReady?.(STUB_API);
  }, []); // intentional: fire once after canvas mounts

  useEffect(() => {
    scene.background = background !== undefined ? new Color(background) : null;
    return () => {
      scene.background = null;
    };
  }, [background, scene]);

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
  lighting,
  onReady,
  style,
  className,
}: ViewportProps) {
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const glRef = useRef<WebGLRenderer | null>(null);

  const ctx = useMemo<ViewportContextValue>(() => ({ cameraRef, sceneRef, glRef }), []);

  const resolvedCamera = {
    position: camera?.position ?? ([5, 5, 5] as [number, number, number]),
    fov: camera?.fov ?? 45,
    near: camera?.near ?? 0.1,
    far: camera?.far ?? 1000,
  };

  return (
    <div style={{ width: '100%', height: '100%', ...style }} className={className}>
      <Canvas gl={{ antialias: true }} dpr={[1, 2]} shadows camera={resolvedCamera}>
        <ViewportContext.Provider value={ctx}>
          <ViewportBridge ctx={ctx} background={background} onReady={onReady} />
          {lighting === 'default' && <DefaultLighting />}
          {children}
        </ViewportContext.Provider>
      </Canvas>
    </div>
  );
}
