import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { DenseHumanMesh } from './DenseHumanMesh';
import type { BiomechanicalMeasurement, ClinicalFinding } from '../../types/examination';
import { RotateCcw, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface BodyMeshViewerProps {
  selectedRegion: string;
  onSelectRegion?: (region: string, side: 'RIGHT' | 'LEFT') => void;
  affectedSide: 'RIGHT' | 'LEFT' | 'BILATERAL';
  measurements?: BiomechanicalMeasurement[];
  findings?: ClinicalFinding[];
  isExamActive: boolean;
}

export const BodyMeshViewer: React.FC<BodyMeshViewerProps> = ({
  selectedRegion,
  onSelectRegion,
  affectedSide,
  measurements = [],
  findings = [],
  isExamActive,
}) => {
  const controlsRef = useRef<OrbitControlsType>(null);

  const setView = (x: number, y: number, z: number) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(x, y, z);
      controlsRef.current.target.set(0, -0.2, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header Controls & Camera Presets */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* Anatomical Status Badge */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">
            {selectedRegion.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-cyan-400/90 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
            {affectedSide} SIDE
          </span>
        </div>

        {/* Camera Views Preset Toolbar */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/60 p-1 rounded-xl shadow-lg backdrop-blur-md pointer-events-auto">
          <button
            onClick={() => setView(0, 0.2, 3.8)}
            title="Frontal (Coronal) View"
            className="text-xs px-2.5 py-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            Front
          </button>
          <button
            onClick={() => setView(-3.6, 0.1, 0.4)}
            title="Right Sagittal View (Lateral)"
            className="text-xs px-2.5 py-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            Right Profile
          </button>
          <button
            onClick={() => setView(3.6, 0.1, 0.4)}
            title="Left Sagittal View (Lateral)"
            className="text-xs px-2.5 py-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            Left Profile
          </button>
          <button
            onClick={() => setView(0, 0.2, -3.8)}
            title="Posterior View"
            className="text-xs px-2.5 py-1 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => setView(0, 0.2, 3.8)}
            title="Reset Camera"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="flex-1 w-full h-full">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0.2, 3.8]} fov={45} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <pointLight position={[0, 0, 2]} intensity={0.6} color="#06b6d4" />

          {/* Holographic Pedestal Grid */}
          <Grid
            position={[0, -1.8, 0]}
            args={[10, 10]}
            cellSize={0.5}
            cellThickness={0.6}
            cellColor="#0e7490"
            sectionSize={2.0}
            sectionThickness={1.2}
            sectionColor="#06b6d4"
            fadeDistance={12}
            fadeStrength={1.5}
          />

          {/* Interactive Dense Anatomical Body Mesh */}
          <DenseHumanMesh
            selectedRegion={selectedRegion}
            onSelectRegion={onSelectRegion}
            affectedSide={affectedSide}
            measurements={measurements}
            findings={findings}
            isExamActive={isExamActive}
          />

          <OrbitControls
            ref={controlsRef}
            target={[0, -0.2, 0]}
            minDistance={1.5}
            maxDistance={6.0}
            enablePan={true}
            maxPolarAngle={Math.PI / 2 + 0.15}
          />
        </Canvas>
      </div>

      {/* Operator Guidance Header HUD */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        {!isExamActive ? (
          <div className="bg-cyan-950/95 border-2 border-cyan-400 text-cyan-100 text-xs font-bold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>👈 STEP 1: CLICK PAINFUL LOCATION ON 3D BODY MESH TO START AI EXAMINATION</span>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">ANATOMICAL REGION ACTIVE: {selectedRegion.replace('_', ' ')}</span>
            <span className="text-slate-400">• Real-Time 3D Mesh Kinematics</span>
          </div>
        )}
      </div>

      {/* Mandatory Regulatory & Biomechanical Disclaimer Footer */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 backdrop-blur-md shadow-xl flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight text-slate-300">
            <span className="font-semibold text-amber-400 uppercase tracking-wider block mb-0.5">
              Provisional Biomechanical Visualization
            </span>
            Standardized anatomical wireframe (non-patient-specific reconstruction). Joint angles and range-of-motion metrics are computed in real time from MediaPipe kinematic tracking.
          </div>
        </div>
      </div>
    </div>
  );
};
