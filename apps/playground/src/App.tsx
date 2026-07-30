import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import type { Mesh } from 'three';
import { Viewport, Grid, useViewport } from '@forge3d/viewport';
import type { ControlsMode } from '@forge3d/viewport';

function RotatingBox() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.rotation.y += delta * 0.8;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

function Duck() {
  const { scene } = useGLTF('/duck.glb');
  return <primitive object={scene} position={[4, 0, 0]} />;
}

function Toolbar() {
  const { fitToView, screenshot } = useViewport();
  const [isSaving, setIsSaving] = useState(false);

  const handleScreenshot = async () => {
    setIsSaving(true);
    try {
      const blob = await screenshot({ width: 1920, height: 1080 });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'viewport-screenshot.png';
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        <button onClick={() => fitToView()}>Fit all</button>
        <button onClick={handleScreenshot} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Screenshot'}
        </button>
      </div>
    </Html>
  );
}

const CONTROLS_MODES: ControlsMode[] = ['cad', 'orbit', 'fly'];

export default function App() {
  const [controlsMode, setControlsMode] = useState<ControlsMode>('cad');

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1 }}>
        <select
          value={controlsMode}
          onChange={(event) => setControlsMode(event.target.value as ControlsMode)}
        >
          {CONTROLS_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>
      <Viewport controls={controlsMode} lighting="default">
        <Grid />
        <RotatingBox />
        <Duck />
        <Toolbar />
      </Viewport>
    </div>
  );
}
