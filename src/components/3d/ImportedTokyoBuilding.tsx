import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface TokyoBuildingProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/building_interior/littlest_tokyo.glb`;

export const ImportedTokyoBuilding: React.FC<TokyoBuildingProps> = ({
  position,
  rotationY = 0,
}) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  // Load the Tokyo 3D Model with dynamic base URL support
  const { scene } = useGLTF(MODEL_PATH);

  // Compute exact bounding box and scale to realistic multi-story architectural proportions
  const { modelGroup } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Target Height: 15 meters
    const TARGET_HEIGHT = 15.0;
    const rawHeight = size.y > 0.001 ? size.y : 1;
    const autoScale = TARGET_HEIGHT / rawHeight;

    const group = new THREE.Group();
    // Center model squarely and place base at Y=0
    cloned.position.set(
      -center.x * autoScale,
      -bbox.min.y * autoScale,
      -center.z * autoScale
    );
    cloned.scale.set(autoScale, autoScale, autoScale);
    group.add(cloned);

    return { modelGroup: group };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: 'imported_tokyo_complex',
    title: "Tokio Me'moriy Majmuasi (Littlest Tokyo)",
    category: 'building',
    badge: "3D ARXITEKTURA MODELI",
    description: `${currentStreet?.name || "Markaziy ko'cha"} chorrahasida joylashgan, zinapoyalari, terrasalari, do'konlari va platformalariga piyoda ko'tarilish mumkin bo'lgan me'moriy shahar majmuasi.`,
    streetName: currentStreet?.name,
    details: [
      { label: "Manba", value: "Three.js Showcase (Littlest Tokyo)" },
      { label: "Balandligi", value: "15 metr (Ko'p qavatli)" },
      { label: "Zinapoya", value: "Piyoda chiqish va tushish to'liq silliq" },
      { label: "Xususiyati", value: "Do'konlar, kafelar, poyezd yo'lagi" },
      { label: "Holati", value: "Faol" },
    ],
  }), [currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 
        High-Speed Lightweight Physics Colliders
      */}
      <RigidBody type="fixed" colliders={false}>
        {/* Main Base & Ground Shops */}
        <CuboidCollider args={[6.5, 2.5, 6.5]} position={[0, 2.5, 0]} />
        {/* 2nd Tier Platform Floor */}
        <CuboidCollider args={[5.5, 0.2, 5.5]} position={[0, 5.0, 0]} />
        {/* 2nd Tier Tower */}
        <CuboidCollider args={[4.5, 3.5, 4.5]} position={[0, 8.5, 0]} />
        {/* Staircase Incline Ramp */}
        <CuboidCollider args={[1.2, 0.15, 3.0]} position={[1.5, 2.5, 4.0]} rotation={[-0.55, 0, 0]} />
        {/* Upper Staircase Ramp */}
        <CuboidCollider args={[3.0, 0.15, 1.2]} position={[-3.2, 3.8, 1.0]} rotation={[0, 0, 0.55]} />
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
