import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface BibiKhanymProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/uzbek/bibi_khanym.glb`;

export const UzbekBibiKhanym: React.FC<BibiKhanymProps> = ({
  position,
  rotationY = 0,
}) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const { scene } = useGLTF(MODEL_PATH);

  const { modelGroup } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false; // Disable expensive dynamic shadows for smooth FPS
        child.receiveShadow = true;
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Target Height: 22 meters
    const TARGET_HEIGHT = 22.0;
    const rawHeight = size.y > 0.001 ? size.y : 1;
    const autoScale = TARGET_HEIGHT / rawHeight;

    const group = new THREE.Group();
    // Center squarely and plant base firmly on the ground level (Y=0)
    cloned.position.set(
      -center.x * autoScale,
      -bbox.min.y * autoScale - 0.2, // Firmly connect to ground/sidewalk
      -center.z * autoScale
    );
    cloned.scale.set(autoScale, autoScale, autoScale);
    group.add(cloned);

    return { modelGroup: group };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: `bibi_khanym_${position[0]}_${position[2]}`,
    title: "Bibixonim Jome Masjidi (Samarqand)",
    category: 'landmark',
    badge: "XIV ASR ME'MORIY DURDONASI",
    description: "1399-1404 yillarda Sohibqiron Amir Temur tomonidan Samarqandda bunyod etilgan ulug'vor moviy gumbazli jome masjidi. O'rta asrlar sharq me'morchiligining eng yuksak cho'qqilaridan biri.",
    streetName: currentStreet?.name,
    details: [
      { label: "Asos solingan davr", value: "1399-1404 yillar" },
      { label: "Balandligi", value: "36 metr (Ulkan peshtoq)" },
      { label: "Me'moriy uslub", value: "Temuriylar davri feruza mozaikasi" },
      { label: "UNESCO maqomi", value: "Butunjahon merosi ro'yxatida" },
      { label: "Manba", value: "Global Digital Heritage Photogrammetry 3D" },
    ],
  }), [position, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Lightweight Compound Physics Collider */}
      <RigidBody type="fixed" colliders={false}>
        {/* Left Portal Pylon Pillar */}
        <CuboidCollider args={[3.2, 11, 4]} position={[-9, 11, 0]} />
        {/* Right Portal Pylon Pillar */}
        <CuboidCollider args={[3.2, 11, 4]} position={[9, 11, 0]} />
        {/* Arch Header Above Walkway */}
        <CuboidCollider args={[5.8, 3.5, 3]} position={[0, 18.5, 0]} />
        {/* Back Dome & Mosque Body */}
        <CuboidCollider args={[14, 11, 8]} position={[0, 11, -12]} />
      </RigidBody>

      <primitive
        object={modelGroup}
        userData={{ inspectData }}
        onClick={handleInspect}
        onPointerOver={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      />
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
