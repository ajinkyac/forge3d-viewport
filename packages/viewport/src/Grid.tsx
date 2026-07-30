import { useEffect, useRef } from 'react';
import type { Group, ColorRepresentation } from 'three';
import { Grid as DreiGrid } from '@react-three/drei';

export interface GridProps {
  cellSize?: number;
  sectionSize?: number;
  infinite?: boolean;
  fadeDistance?: number;
  cellColor?: ColorRepresentation;
  sectionColor?: ColorRepresentation;
}

/**
 * Adaptive infinite grid on the y=0 plane, wrapping drei's Grid with
 * sensible defaults. Flagged `viewportHelper` so fitToView/frameObject
 * exclude it from scene bounds.
 */
export function Grid({
  cellSize = 1,
  sectionSize = 10,
  infinite = true,
  fadeDistance = 100,
  cellColor = '#6b6b6b',
  sectionColor = '#3d3d3d',
}: GridProps) {
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData.viewportHelper = true;
    }
  }, []);

  return (
    <group ref={groupRef}>
      <DreiGrid
        cellSize={cellSize}
        sectionSize={sectionSize}
        infiniteGrid={infinite}
        fadeDistance={fadeDistance}
        cellColor={cellColor}
        sectionColor={sectionColor}
      />
    </group>
  );
}
