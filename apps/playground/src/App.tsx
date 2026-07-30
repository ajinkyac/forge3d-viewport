import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { Viewport } from '@forge3d/viewport';
import type { ControlsMode } from '@forge3d/viewport';

function RotatingBox() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.rotation.y += delta * 0.8;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
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
        <RotatingBox />
      </Viewport>
    </div>
  );
}
