import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { OrbitControls } from 'three-stdlib';

export interface ViewportContextValue {
  cameraRef: MutableRefObject<PerspectiveCamera | null>;
  sceneRef: MutableRefObject<Scene | null>;
  glRef: MutableRefObject<WebGLRenderer | null>;
  controls: OrbitControls | null;
}

export const ViewportContext = createContext<ViewportContextValue | null>(null);

export function useViewportContext(): ViewportContextValue {
  const ctx = useContext(ViewportContext);
  if (ctx === null) {
    throw new Error('useViewportContext must be used within a <Viewport>');
  }
  return ctx;
}
