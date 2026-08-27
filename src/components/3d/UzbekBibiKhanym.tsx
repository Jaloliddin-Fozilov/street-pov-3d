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
        child.castShadow = false; // Disable heavy shadow maps for maximum 60 FPS
        child.receiveShadow = true;
        if (child.material) {
          child.material.roughness = 0.8;
        }
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Target monumental height: 18 meters
    // Photogrammetry model ground level is located around raw Y = -1.0 (with underground noise down to -17.9)
    const RAW_GROUND_Y = -1.0;
    const RAW_TOP_Y = bbox.max.y > 0 ? bbox.max.y : 35.6;
    const modelHeight = RAW_TOP_Y - RAW_GROUND_Y;
    const TARGET_HEIGHT = 18.0;
    const autoScale = TARGET_HEIGHT / (modelHeight > 0.1 ? modelHeight : 1);

    const group = new THREE.Group();
    // Center horizontally and align courtyard / entrance ground plane squarely at ground Y = 0
    cloned.position.set(
      -center.x * autoScale,
      -RAW_GROUND_Y * autoScale,
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
      { label: "Balandligi", value: "36 metr (Tarixiy peshtoq)" },
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
      {/* 
        High-Performance Compound Colliders 
        (Allows walk-through archway without polygon physics lag)
      */}
      <RigidBody type="fixed" colliders={false}>
        {/* Left Portal Pylon */}
        <CuboidCollider args={[2.5, 9, 3]} position={[-7.5, 9, 0]} />
        {/* Right Portal Pylon */}
        <CuboidCollider args={[2.5, 9, 3]} position={[7.5, 9, 0]} />
        {/* Arch Header Above Walkway */}
        <CuboidCollider args={[5.0, 3, 2.5]} position={[0, 15, 0]} />
        {/* Back Dome & Mosque Body */}
        <CuboidCollider args={[11, 9, 7]} position={[0, 9, -10]} />
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
