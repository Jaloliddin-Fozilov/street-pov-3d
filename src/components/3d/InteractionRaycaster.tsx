import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

export const InteractionRaycaster: React.FC = () => {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const centerCoord = useRef(new THREE.Vector2(0, 0)); // Center of screen
  const lastCheckTime = useRef(0);

  const setHoveredObject = useWorldStore((s) => s.setHoveredObject);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);

  // Global Key & Click Listeners for interacting with focused object
  useEffect(() => {
    const handleTriggerInspect = () => {
      const hovered = useWorldStore.getState().hoveredObject;
      const isAlreadyInspecting = !!useWorldStore.getState().inspectedObject || !!useWorldStore.getState().selectedPOI;

      if (hovered && !isAlreadyInspecting) {
        soundManager.playClick();
        setInspectedObject(hovered);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      if (e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'Enter') {
        handleTriggerInspect();
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (document.pointerLockElement && e.button === 0) {
        handleTriggerInspect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [setInspectedObject]);

  // Throttled high-efficiency raycasting (runs every 100ms instead of 60 times/sec on 50,000 submeshes)
  useFrame(({ clock }) => {
    if (!camera || !scene) return;

    const now = clock.getElapsedTime();
    if (now - lastCheckTime.current < 0.1) return; // 10Hz throttle (saves 90% CPU)
    lastCheckTime.current = now;

    // Raycast from camera center
    raycaster.current.setFromCamera(centerCoord.current, camera);
    raycaster.current.far = 35; // 35m interaction distance

    // Collect inspectable root candidates in nearby range
    const inspectableMeshes: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.inspectData) {
        inspectableMeshes.push(obj);
      }
    });

    if (inspectableMeshes.length === 0) return;

    const intersects = raycaster.current.intersectObjects(inspectableMeshes, true);

    let foundInspectData: InspectableObject | null = null;

    if (intersects.length > 0) {
      let currentObj: THREE.Object3D | null = intersects[0].object;
      while (currentObj) {
        if (currentObj.userData && currentObj.userData.inspectData) {
          foundInspectData = currentObj.userData.inspectData as InspectableObject;
          break;
        }
        currentObj = currentObj.parent;
      }
    }

    const currentHovered = useWorldStore.getState().hoveredObject;
    if (foundInspectData?.id !== currentHovered?.id) {
      setHoveredObject(foundInspectData);
    }
  });

  return null;
};
