import React, { useMemo } from 'react';
import { RoadNetworkMesh } from './RoadNetworkMesh';
import { BuildingMesh } from './BuildingMesh';
import { PropsMesh } from './PropsMesh';
import { POIMarker } from './POIMarker';
import { VehicleMesh } from './VehicleMesh';
import { ImportedTokyoBuilding } from './ImportedTokyoBuilding';
import { UzbekBibiKhanym } from './UzbekBibiKhanym';
import { UzbekOliyMajlis } from './UzbekOliyMajlis';
import { generateChunkBuildings } from '../../data/mockBuildings';
import { getStreetByChunk, CHUNK_SIZE } from '../../data/streetsData';

interface StreetChunkProps {
  chunkX: number;
  chunkZ: number;
}

const CAR_COLORS = ['#ef4444', '#2563eb', '#ffffff', '#0f172a', '#64748b', '#059669', '#d97706'];

export const StreetChunk: React.FC<StreetChunkProps> = ({ chunkX, chunkZ }) => {
  const worldX = chunkX * CHUNK_SIZE;
  const worldZ = chunkZ * CHUNK_SIZE;

  const buildings = useMemo(() => generateChunkBuildings(chunkX, chunkZ), [chunkX, chunkZ]);
  const street = useMemo(() => getStreetByChunk(chunkX, chunkZ), [chunkX, chunkZ]);

  const isCenterChunk = chunkX === 0 && chunkZ === 0;

  // Lightweight vehicle placement (avoids overloading scene with hundreds of cloned models)
  const vehicles = useMemo(() => {
    const seed = Math.abs(chunkX * 9301 + chunkZ * 49297) % 233280;
    const vList: {
      pos: [number, number, number];
      rotY: number;
      type: 'sedan' | 'suv' | 'bus' | 'taxi';
      color: string;
    }[] = [];

    // Place vehicles selectively
    if (isCenterChunk || seed % 2 === 0) {
      vList.push({
        pos: [worldX + 3.2, 0, worldZ - 14],
        rotY: 0,
        type: (seed % 3 === 0 ? 'taxi' : 'sedan'),
        color: CAR_COLORS[seed % CAR_COLORS.length],
      });
    }

    if (isCenterChunk || seed % 3 === 0) {
      vList.push({
        pos: [worldX - 16, 0, worldZ - 3.2],
        rotY: -Math.PI / 2,
        type: (seed % 5 === 0 ? 'bus' : 'sedan'),
        color: CAR_COLORS[(seed + 4) % CAR_COLORS.length],
      });
    }

    return vList;
  }, [chunkX, chunkZ, worldX, worldZ, isCenterChunk]);

  return (
    <group key={`chunk-${chunkX}-${chunkZ}`}>
      {/* 1. Road Network, Sidewalks, Crosswalks */}
      <RoadNetworkMesh chunkX={chunkX} chunkZ={chunkZ} />

      {/* 2. Monumental Uzbek & International 3D Architectural Models in Showcase Area */}
      {isCenterChunk ? (
        <>
          {/* A. Bibixonim Jome Masjidi (Samarqand 3D Monument) */}
          <UzbekBibiKhanym
            position={[worldX + 24, 0, worldZ + 24]}
            rotationY={0}
          />

          {/* B. Oliy Majlis Qonunchilik Palatasi Binosi (Toshkent 3D Palace) */}
          <UzbekOliyMajlis
            position={[worldX - 24, 0, worldZ + 24]}
            rotationY={Math.PI / 2}
          />

          {/* C. Tokyo Architectural Complex with Walkable Stairs */}
          <ImportedTokyoBuilding
            position={[worldX + 24, 0, worldZ - 24]}
            rotationY={0}
          />

          {/* D. Surrounding City Towers */}
          {buildings.slice(3).map((b) => (
            <BuildingMesh key={b.id} building={b} />
          ))}
        </>
      ) : (
        buildings.map((b) => (
          <BuildingMesh key={b.id} building={b} />
        ))
      )}

      {/* 3. Street Props: Lamps, Bus Stops, Trees, Benches */}
      <PropsMesh chunkX={chunkX} chunkZ={chunkZ} streetName={street?.name} />

      {/* 4. Realistic 3D Vehicles on Roads */}
      {vehicles.map((v, i) => (
        <VehicleMesh
          key={`veh-${chunkX}-${chunkZ}-${i}`}
          position={v.pos}
          rotationY={v.rotY}
          type={v.type}
          color={v.color}
        />
      ))}

      {/* 5. POI Markers on this street */}
      {street?.pois.map((poi) => (
        <POIMarker key={poi.id} poi={poi} />
      ))}
    </group>
  );
};
