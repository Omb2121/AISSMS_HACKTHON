import React from "react";
import type { AllocationAssignment, Rider, Shelter, DonationBatch } from "./types";

interface NetworkVisualizerProps {
  batch: DonationBatch;
  riders: Rider[];
  shelters: Shelter[];
  assignments: AllocationAssignment[];
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({
  batch,
  riders,
  shelters,
  assignments,
}) => {
  // Map assigned rider IDs and shelter IDs
  const assignedRiderIds = new Set(assignments.map((a) => a.riderId));
  const assignedShelterIds = new Set(assignments.map((a) => a.shelterId));

  // Shelter positions (right side)
  const shelterCoords: Record<string, { x: number; y: number }> = {
    S1: { x: 540, y: 35 },
    S2: { x: 540, y: 85 },
    S3: { x: 540, y: 135 },
    S4: { x: 540, y: 185 },
    S5: { x: 540, y: 235 },
  };

  // Rider positions (middle column)
  const riderCoords: Record<string, { x: number; y: number }> = {
    R1: { x: 290, y: 35 },
    R2: { x: 290, y: 85 },
    R3: { x: 290, y: 135 },
    R4: { x: 290, y: 185 },
    R5: { x: 290, y: 235 },
  };

  // Central Hub (Kitchen)
  const hubCoord = { x: 60, y: 135 };

  return (
    <div className="network-visualizer-container">
      <div className="network-visualizer-header">
        <div className="net-tag">
          <span className="live-dot" />
          <span>REAL-TIME DISPATCH TOPOLOGY</span>
        </div>
        <div className="net-legend">
          <span className="legend-item"><span className="legend-chip active-flow" /> Active Route</span>
          <span className="legend-item"><span className="legend-chip idle-node" /> Standby</span>
          <span className="legend-item"><span className="legend-chip blocked-node" /> Closed / Blocked</span>
        </div>
      </div>

      <div className="network-svg-wrapper">
        <svg viewBox="0 0 620 270" className="network-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#70f0be" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#70f0be" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Lines from Hub to Riders */}
          {riders.map((rider) => {
            const rCoord = riderCoords[rider.id] || { x: 290, y: 135 };
            const isAssigned = assignedRiderIds.has(rider.id);
            const isOffline = !rider.available;

            return (
              <g key={`hub-to-${rider.id}`}>
                <path
                  d={`M ${hubCoord.x + 20} ${hubCoord.y} C ${hubCoord.x + 120} ${hubCoord.y}, ${rCoord.x - 100} ${rCoord.y}, ${rCoord.x - 14} ${rCoord.y}`}
                  className={`route-line ${isAssigned ? "route-active" : isOffline ? "route-offline" : "route-standby"}`}
                  fill="none"
                  stroke={isAssigned ? "url(#routeGradient)" : isOffline ? "rgba(248, 113, 113, 0.25)" : "rgba(255, 255, 255, 0.08)"}
                  strokeWidth={isAssigned ? 2.5 : 1}
                  strokeDasharray={isAssigned ? "5,5" : "none"}
                />
              </g>
            );
          })}

          {/* Lines from Riders to Shelters based on assignments */}
          {assignments.map((assignment, idx) => {
            const rCoord = riderCoords[assignment.riderId] || { x: 290, y: 135 };
            const sCoord = shelterCoords[assignment.shelterId] || { x: 540, y: 135 };

            return (
              <g key={`route-${assignment.id}-${idx}`}>
                <path
                  d={`M ${rCoord.x + 14} ${rCoord.y} C ${rCoord.x + 80} ${rCoord.y}, ${sCoord.x - 80} ${sCoord.y}, ${sCoord.x - 16} ${sCoord.y}`}
                  className="route-line route-active pulse-animation"
                  fill="none"
                  stroke="#70f0be"
                  strokeWidth={2.5}
                />
                {/* Floating payload label */}
                <circle cx={(rCoord.x + sCoord.x) / 2} cy={(rCoord.y + sCoord.y) / 2} r="9" fill="#07110f" stroke="#70f0be" strokeWidth="1.5" />
                <text
                  x={(rCoord.x + sCoord.x) / 2}
                  y={(rCoord.y + sCoord.y) / 2 + 3}
                  textAnchor="middle"
                  fill="#70f0be"
                  fontSize="7.5"
                  fontFamily="DM Mono, monospace"
                  fontWeight="bold"
                >
                  {assignment.quantity}
                </text>
              </g>
            );
          })}

          {/* Hub Node */}
          <g transform={`translate(${hubCoord.x}, ${hubCoord.y})`}>
            <circle r="26" fill="rgba(112, 240, 190, 0.08)" className="radar-pulse" />
            <circle r="18" fill="url(#hubGradient)" filter="url(#glow)" />
            <circle r="8" fill="#07110f" />
            <text x="0" y="32" textAnchor="middle" fill="#70f0be" fontSize="9" fontWeight="700" fontFamily="Manrope, sans-serif">
              RESCUE HUB
            </text>
            <text x="0" y="42" textAnchor="middle" fill="#91a99e" fontSize="7.5" fontFamily="DM Mono, monospace">
              {batch.quantity} MEALS
            </text>
          </g>

          {/* Rider Nodes */}
          {riders.map((rider) => {
            const rCoord = riderCoords[rider.id] || { x: 290, y: 135 };
            const isAssigned = assignedRiderIds.has(rider.id);
            const isOffline = !rider.available;

            return (
              <g key={`node-${rider.id}`} transform={`translate(${rCoord.x}, ${rCoord.y})`}>
                <rect
                  x="-16"
                  y="-12"
                  width="32"
                  height="24"
                  rx="6"
                  fill={isOffline ? "#2a1417" : isAssigned ? "#0f2e23" : "#11231e"}
                  stroke={isOffline ? "#f87171" : isAssigned ? "#70f0be" : "rgba(255, 255, 255, 0.15)"}
                  strokeWidth={isAssigned ? 1.5 : 1}
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill={isOffline ? "#f87171" : isAssigned ? "#70f0be" : "#91a99e"}
                  fontSize="9"
                  fontFamily="DM Mono, monospace"
                  fontWeight="600"
                >
                  {rider.id}
                </text>
                <text x="24" y="3" fill="#e7f1ed" fontSize="8" fontFamily="Manrope, sans-serif" fontWeight="500">
                  {rider.name.split(" ")[0]}
                </text>
              </g>
            );
          })}

          {/* Shelter Nodes */}
          {shelters.map((shelter) => {
            const sCoord = shelterCoords[shelter.id] || { x: 540, y: 135 };
            const isAssigned = assignedShelterIds.has(shelter.id);
            const isClosed = shelter.status === "closed";

            return (
              <g key={`node-${shelter.id}`} transform={`translate(${sCoord.x}, ${sCoord.y})`}>
                <rect
                  x="-18"
                  y="-12"
                  width="36"
                  height="24"
                  rx="6"
                  fill={isClosed ? "#2a1417" : isAssigned ? "#0f2e23" : "#11231e"}
                  stroke={isClosed ? "#f87171" : isAssigned ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"}
                  strokeWidth={isAssigned ? 1.5 : 1}
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill={isClosed ? "#f87171" : isAssigned ? "#38bdf8" : "#91a99e"}
                  fontSize="9"
                  fontFamily="DM Mono, monospace"
                  fontWeight="600"
                >
                  {shelter.id}
                </text>
                <text x="-24" y="3" textAnchor="end" fill="#e7f1ed" fontSize="8" fontFamily="Manrope, sans-serif" fontWeight="500">
                  {shelter.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="network-flow-stats">
        <div className="flow-stat">
          <span className="flow-label">Hub Inventory:</span>
          <strong>{batch.quantity} meals</strong>
        </div>
        <div className="flow-stat">
          <span className="flow-label">In-Flow Reserved:</span>
          <strong className="text-mint">{assignments.reduce((sum, a) => sum + a.quantity, 0)} meals</strong>
        </div>
        <div className="flow-stat">
          <span className="flow-label">Active Vectors:</span>
          <strong>{assignments.length} dispatch paths</strong>
        </div>
      </div>
    </div>
  );
};
