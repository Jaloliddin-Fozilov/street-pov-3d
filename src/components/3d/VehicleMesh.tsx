import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface VehicleProps {
  position: [number, number, number];
  rotationY: number;
  type: 'sedan' | 'suv' | 'bus' | 'taxi';
  color?: string;
}

export const VehicleMesh: React.FC<VehicleProps> = ({ position, rotationY, type, color = '#2563eb' }) => {
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const isBus = type === 'bus';
  const isSuv = type === 'suv';
  const isTaxi = type === 'taxi';

  const bodyColor = isTaxi ? '#eab308' : color;
  const length = isBus ? 10.5 : isSuv ? 4.8 : 4.4;
  const width = isBus ? 2.6 : 1.9;
  const height = isBus ? 2.8 : isSuv ? 1.6 : 1.35;

  const inspectData: InspectableObject = useMemo(() => {
    if (isBus) {
      return {
        id: `bus_${position[0]}_${position[2]}`,
        title: "Mercedes-Benz Shahar Yo'lovchi Avtobusi",
        category: 'vehicle',
        badge: "JAMOAT TRANSPORTI",
        description: `${currentStreet?.name || 'Markaziy ko\'cha'} bo'ylab qatnovchi 58-sonli shahar avtobusi. Zamonaviy konditsioner va elektron to'lov tizimi (ATTO) bilan jihozlangan.`,
        streetName: currentStreet?.name,
        details: [
          { label: "Yo'nalish", value: "24-yo'nalish (Chorsu - Yunusobod)" },
          { label: "Sig'imi", value: "85 yo'lovchi" },
          { label: "Yoqilg'i turi", value: "CNG Siqilgan Tabiiy Gaz (Eco)" },
          { label: "Tezlik", value: "45 km/soat" },
          { label: "To'lov", value: "ATTO / NFC / QR-kod" },
          { label: "Holati", value: "Marshrut bo'ylab harakatda" },
        ],
      };
    } else if (isTaxi) {
      return {
        id: `taxi_${position[0]}_${position[2]}`,
        title: "Toshkent City Rasmiy Taksisi",
        category: 'vehicle',
        badge: "TAXI XIZMATI",
        description: `Shahar bo'ylab yo'lovchi tashish xizmatini ko'rsatuvchi rasmiy sariq taksi. Yandex Go va mahalliy ilovalar orqali chaqirish mumkin.`,
        streetName: currentStreet?.name,
        details: [
          { label: "Model", value: "Chevrolet Cobalt / Onix" },
          { label: "Tarif", value: "Standart / Komfort" },
          { label: "Holati", value: "Buyurtma kutmoqda" },
          { label: "Konditsioner", value: "Mavjud" },
          { label: "Haydovchi reytingi", value: "4.92 ★" },
        ],
      };
    } else if (isSuv) {
      return {
        id: `suv_${position[0]}_${position[2]}`,
        title: "Chevrolet Tracker / Trailblazer SUV",
        category: 'vehicle',
        badge: "SHAXSIY AVTOMOBIL",
        description: `Kross-over toifasidagi zamonaviy shahar avtomobili. Yo'l chetida qisqa muddatli to'xtash joyiga (parking) qo'yilgan.`,
        streetName: currentStreet?.name,
        details: [
          { label: "Kuzov turi", value: "Krossover (SUV)" },
          { label: "Rang", value: color },
          { label: "Dvigatel", value: "1.2L Turbo EcoTec" },
          { label: "Parking", value: "Ruxsat etilgan zonada" },
        ],
      };
    } else {
      return {
        id: `sedan_${position[0]}_${position[2]}`,
        title: "Chevrolet Lacetti / Gentra Sedan",
        category: 'vehicle',
        badge: "SHAXSIY AVTOMOBIL",
        description: `Toshkent ko'chalarida eng ommabop bo'lgan shinam shahar sedani.`,
        streetName: currentStreet?.name,
        details: [
          { label: "Model", value: "Gentra 1.5 DOHC" },
          { label: "Rang", value: color },
          { label: "Uzatish qutisi", value: "Avtomat (6-bosqichli)" },
          { label: "To'xtash holati", value: "Yo'l chetida" },
        ],
      };
    }
  }, [isBus, isTaxi, isSuv, position, currentStreet?.name, color]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[0, rotationY, 0]}>
      <group
        userData={{ inspectData }}
        onClick={handleInspect}
      >
        {/* 1. Main Car / Bus Body Chassis */}
        <mesh position={[0, height / 2 + 0.3, 0]} castShadow receiveShadow userData={{ inspectData }}>
          <boxGeometry args={[width, height * 0.55, length]} />
          <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.7} />
        </mesh>

        {/* 2. Cabin / Roof */}
        {!isBus ? (
          <mesh position={[0, height * 0.75 + 0.3, -0.2]} castShadow userData={{ inspectData }}>
            <boxGeometry args={[width * 0.85, height * 0.5, length * 0.55]} />
            <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
          </mesh>
        ) : (
          <mesh position={[0, height * 0.65 + 0.3, 0]} userData={{ inspectData }}>
            <boxGeometry args={[width * 0.96, height * 0.45, length * 0.9]} />
            <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.8} />
          </mesh>
        )}

        {/* Taxi Roof Sign */}
        {isTaxi && (
          <mesh position={[0, height + 0.4, 0]}>
            <boxGeometry args={[0.6, 0.2, 0.3]} />
            <meshStandardMaterial color="#ffffff" emissive="#fbbf24" emissiveIntensity={isNight ? 2 : 0.2} />
          </mesh>
        )}

        {/* 3. Headlights */}
        <mesh position={[-width * 0.35, 0.55, length / 2 + 0.02]}>
          <boxGeometry args={[0.35, 0.2, 0.05]} />
          <meshStandardMaterial
            color={isNight || isSunset ? '#ffffff' : '#e2e8f0'}
            emissive={isNight || isSunset ? '#ffffff' : '#000000'}
            emissiveIntensity={isNight ? 3 : 0}
          />
        </mesh>
        <mesh position={[width * 0.35, 0.55, length / 2 + 0.02]}>
          <boxGeometry args={[0.35, 0.2, 0.05]} />
          <meshStandardMaterial
            color={isNight || isSunset ? '#ffffff' : '#e2e8f0'}
            emissive={isNight || isSunset ? '#ffffff' : '#000000'}
            emissiveIntensity={isNight ? 3 : 0}
          />
        </mesh>

        {/* Night Headlight Beams */}
        {isNight && (
          <spotLight
            position={[0, 0.6, length / 2 + 0.2]}
            target-position={[0, 0, length / 2 + 15]}
            angle={0.6}
            penumbra={0.5}
            intensity={18}
            distance={25}
            color="#ffffff"
          />
        )}

        {/* 4. Taillights */}
        <mesh position={[-width * 0.35, 0.55, -length / 2 - 0.02]}>
          <boxGeometry args={[0.35, 0.18, 0.05]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={isNight ? 2.5 : 0.5}
          />
        </mesh>
        <mesh position={[width * 0.35, 0.55, -length / 2 - 0.02]}>
          <boxGeometry args={[0.35, 0.18, 0.05]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={isNight ? 2.5 : 0.5}
          />
        </mesh>

        {/* 5. 4 Wheels */}
        {[
          [-width / 2 - 0.05, 0.3, length * 0.3],
          [width / 2 + 0.05, 0.3, length * 0.3],
          [-width / 2 - 0.05, 0.3, -length * 0.3],
          [width / 2 + 0.05, 0.3, -length * 0.3],
        ].map((wPos, i) => (
          <group key={i} position={[wPos[0], wPos[1], wPos[2]]} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.2, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.21, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    </RigidBody>
  );
};
