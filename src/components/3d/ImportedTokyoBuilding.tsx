import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface TokyoBuildingProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const MODEL_PATH = `${BASE.endsWith('/') ? BASE : BASE + '/'}models/building_interior/littlest_tokyo.glb`;

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
        Exact physics trimesh collider for the entire Tokyo building 
        (platforms, walls, bridges, and floors)
      */}
      <RigidBody type="fixed" colliders="trimesh">
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
      </RigidBody>

      {/* 
        Smooth Stair Ramps for effortless ascending and descending 
        without step catching
      */}
      <RigidBody type="fixed" colliders="cuboid" position={[1.5, 1.8, 4.2]} rotation={[-0.55, 0, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[2.2, 0.2, 5.0]} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" position={[-3.2, 3.2, 1.0]} rotation={[0, 0, 0.55]}>
        <mesh visible={false}>
          <boxGeometry args={[5.0, 0.2, 2.2]} />
        </mesh>
      </RigidBody>
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
