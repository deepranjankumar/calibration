import React from 'react';
import type { BiomechanicalMeasurement, ClinicalFinding } from '../../types/examination';
import { Activity, AlertCircle } from 'lucide-react';

interface BiomechanicalPanelProps {
  measurements: BiomechanicalMeasurement[];
  findings?: ClinicalFinding[];
}

export const BiomechanicalPanel: React.FC<BiomechanicalPanelProps> = ({
  measurements,
}) => {
  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  if (!latest) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span>Biomechanical Telemetry Stream</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Awaiting movement video analysis...
        </span>
      </div>
    );
  }

  const timeseries = latest.timeseries_data || [];
  const maxFlex = latest.maximum_flexion_deg ?? 0;
  const termExt = latest.terminal_extension_deg ?? 0;
  const rom = latest.range_of_motion_deg ?? 0;

  // Render SVG Sparkline of Angle vs Time
  const svgWidth = 320;
  const svgHeight = 75;
  const points = timeseries.map((pt, i) => {
    const x = (i / Math.max(1, timeseries.length - 1)) * svgWidth;
    // Normalize angle 0 to 140 deg
    const y = svgHeight - (pt.flexion_angle_deg / 145) * svgHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Biomechanical Telemetry ({latest.joint_name})
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-mono">Quality:</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
            latest.quality_rating === 'HIGH'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
              : 'bg-amber-950 text-amber-400 border border-amber-500/40'
          }`}>
            {latest.quality_rating}
          </span>
        </div>
      </div>

      {/* Grid of Key Numerical Kinematics */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
          <div className="text-[9px] font-semibold text-slate-400 uppercase">Terminal Ext.</div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
            {termExt.toFixed(1)}°
          </div>
          <div className="text-[8px] text-slate-500">Normal: 0°-5°</div>
        </div>

        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
          <div className="text-[9px] font-semibold text-slate-400 uppercase">Max Flexion</div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
            {maxFlex.toFixed(1)}°
          </div>
          <div className="text-[8px] text-slate-500">Normal: 130°-145°</div>
        </div>

        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
          <div className="text-[9px] font-semibold text-slate-400 uppercase">Active ROM</div>
          <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
            {rom.toFixed(1)}°
          </div>
          <div className="text-[8px] text-slate-500">Peak ROM</div>
        </div>

        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
          <div className="text-[9px] font-semibold text-slate-400 uppercase">Tracking Conf.</div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {(latest.tracking_confidence_mean * 100).toFixed(0)}%
          </div>
          <div className="text-[8px] text-slate-500">{latest.frames_tracked} valid frames</div>
        </div>
      </div>

      {/* Flexion Angle vs Time Kinematic Curve */}
      {timeseries.length > 0 && (
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Flexion Angle Curve θ(t)</span>
            <span className="text-cyan-400">Peak Velocity: {latest.peak_angular_velocity_dps?.toFixed(0)}°/s</span>
          </div>

          <div className="relative w-full h-16 bg-slate-900/60 rounded overflow-hidden">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full preserve-3d">
              {/* Reference line for normal full extension (0 deg) */}
              <line x1="0" y1={svgHeight - 5} x2={svgWidth} y2={svgHeight - 5} stroke="#334155" strokeDasharray="3 3" />
              {/* Kinematic trajectory line */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Quality Warnings or Deficit Alerts */}
      {latest.quality_warnings && latest.quality_warnings.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-600/30 rounded-lg p-2.5 space-y-1">
          <div className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Biomechanical Clinical Notes
          </div>
          {latest.quality_warnings.map((warn, i) => (
            <p key={i} className="text-[11px] text-amber-200/90 leading-tight">
              • {warn}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
