import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface OliyMajlisProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/uzbek/oliy_majlis_binosi.glb`;

export const UzbekOliyMajlis: React.FC<OliyMajlisProps> = ({
  position,
  rotationY = 0,
}) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const { scene } = useGLTF(MODEL_PATH);

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

    // Target Height: 18 meters
    const TARGET_HEIGHT = 18.0;
    const rawHeight = size.y > 0.001 ? size.y : 1;
    const autoScale = TARGET_HEIGHT / rawHeight;

    const group = new THREE.Group();
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
    id: `oliy_majlis_${position[0]}_${position[2]}`,
    title: "Oliy Majlis Qonunchilik Palatasi Binosi (Toshkent)",
    category: 'building',
    badge: "DAVLAT ARXITEKTURASI",
    description: "O'zbekiston Respublikasi parlamenti va qonun chiqaruvchi oliy organi saroyi. Oq marmar peshtoqlar, salobatli ustunlar va zangori gumbaz uyg'unligida barpo etilgan.",
    streetName: currentStreet?.name,
    details: [
      { label: "Bino vazifasi", value: "Qonunchilik Palatasi Saroyi" },
      { label: "Balandligi", value: "18 metr (Gumbaz cho'qqisi)" },
      { label: "Me'moriy uslub", value: "Milliy mumtoz va neoklassika" },
      { label: "Joylashuvi", value: "Toshkent shahri, Mustaqillik maydoni yaqinida" },
      { label: "Holati", value: "Faol davlat arxitekturasi" },
    ],
  }), [position, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Exact Trimesh physics collider for palace stairs and columns */}
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

      {/* Grand Architectural Spotlighting */}
      {(isNight || isSunset) && (
        <>
          <spotLight
            position={[0, 22, 16]}
            target-position={[0, 8, 0]}
            color={isNight ? '#ffffff' : '#fed7aa'}
            intensity={isNight ? 50 : 25}
            distance={45}
            angle={0.6}
            penumbra={0.5}
          />
          <pointLight
            position={[0, 16, 0]}
            color="#38bdf8"
            intensity={isNight ? 30 : 12}
            distance={28}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
