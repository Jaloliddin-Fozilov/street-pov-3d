import React, { useMemo } from 'react';
import { useWorldStore } from '../../stores/useWorldStore';
import { getSurroundingChunks } from '../../utils/math';
import { StreetChunk } from './StreetChunk';

export const WorldManager: React.FC = () => {
  const activeChunk = useWorldStore((s) => s.activeChunk);

  // Load 3x3 active grid (9 chunks) around current player position
  const visibleChunks = useMemo(() => {
    return getSurroundingChunks(activeChunk, 1);
  }, [activeChunk]);

  return (
    <group>
      {visibleChunks.map((c) => (
        <StreetChunk key={`chunk-${c.x}-${c.z}`} chunkX={c.x} chunkZ={c.z} />
      ))}
    </group>
  );
};
