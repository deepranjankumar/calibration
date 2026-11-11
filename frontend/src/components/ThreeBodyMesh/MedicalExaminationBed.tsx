import React from 'react';
import * as THREE from 'three';

interface MedicalExaminationBedProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  visible?: boolean;
}

/**
 * 3D High-Tech Medical Examination Table / Bed
 * Features cushioned plinth, elevation headrest, metallic hydraulic frame,
 * cyber-medical cyan trim, and floor stabilizer pedestal.
 */
export const MedicalExaminationBed: React.FC<MedicalExaminationBedProps> = ({
  position = [0, -0.68, 0.15],
  rotation = [0, 0, 0],
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <group position={position} rotation={rotation} name="medical-examination-bed">
      {/* 1. Main Mattress Plinth (Navy Leatherette with slight cushioning) */}
      <mesh position={[0, 0.38, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.14, 2.15]} />
        <meshStandardMaterial
          color="#081829"
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>

      {/* 2. Cyber-Cyan Glowing Perimeter Seam / Piping Trim */}
      <mesh position={[0, 0.445, 0.05]}>
        <boxGeometry args={[0.83, 0.015, 2.16]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00b4d8"
          emissiveIntensity={0.8}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 3. Raised Headrest Section (Inclined clinical comfort pillow) */}
      <group position={[0, 0.44, -0.78]} rotation={[0.18, 0, 0]}>
        {/* Headrest Cushion */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.76, 0.09, 0.48]} />
          <meshStandardMaterial
            color="#0f263e"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Soft Sanitary Head Pillow / Sheet */}
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.55, 0.04, 0.34]} />
          <meshStandardMaterial
            color="#1e3a5f"
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* 4. Sub-Mattress Steel Bed Deck Platform */}
      <mesh position={[0, 0.28, 0.05]}>
        <boxGeometry args={[0.84, 0.06, 2.18]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* 5. Central Hydraulic Column Pedestal */}
      <mesh position={[0, 0.06, 0.05]}>
        <cylinderGeometry args={[0.16, 0.19, 0.40, 24]} />
        <meshStandardMaterial
          color="#334155"
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>
      {/* Hydraulic Piston Shaft Collar */}
      <mesh position={[0, 0.15, 0.05]}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 24]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#0891b2"
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* 6. Heavy Base Plate & Stabilizer Legs */}
      <mesh position={[0, -0.16, 0.05]}>
        <boxGeometry args={[0.72, 0.05, 1.45]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* 4 Corner Ground Level Leveling Pods with glowing indicator rings */}
      {[
        [-0.32, -0.17, -0.60],
        [0.32, -0.17, -0.60],
        [-0.32, -0.17, 0.70],
        [0.32, -0.17, 0.70],
      ].map(([x, y, z], idx) => (
        <group key={`leg-pod-${idx}`} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.045, 0.055, 0.04, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.015, 0]}>
            <ringGeometry args={[0.048, 0.065, 16]} />
            <meshBasicMaterial color="#00e5ff" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* 7. Clinical Measurement Ruler Guide along Bed Lateral Edge */}
      <mesh position={[0.422, 0.38, 0.05]}>
        <boxGeometry args={[0.005, 0.08, 1.95]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0369a1"
          emissiveIntensity={0.4}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
};

