import React, { useMemo, useState, useEffect } from "react";
import {
  Activity,
  AlertOctagon,
  Box,
  ChevronRight,
  Clock3,
  Gauge,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Zap,
  Sparkles,
  Radio,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";
import { AllocationResults } from "./AllocationResults";
import { SmartBatchAllocationScreen } from "./SmartBatchAllocationScreen";
import { GhostClaimRecoveryScreen } from "./GhostClaimRecoveryScreen";
import { MidRouteRescueScreen } from "./MidRouteRescueScreen";
import { NetworkVisualizer } from "./NetworkVisualizer";
import { BlockedCandidatesTable } from "./BlockedCandidatesTable";
import { applySimulationAction, runSimulation, type SimulationAction } from "./simulator";
import { createInitialSimulation } from "./seedData";
import type { CommodityType, SimulationState } from "./types";

interface MetricProps {
  label: string;
  value: string | number;
  subtext: string;
  trend?: string;
  tone: "mint" | "teal" | "amber" | "violet";
  icon: React.ReactNode;
}

function MetricCard({ label, value, subtext, trend, tone, icon }: MetricProps) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        <div className="metric-icon-wrap">{icon}</div>
      </div>
      <div className="metric-body">
        <strong className="metric-value">{value}</strong>
        <div className="metric-footer">
          <small className="metric-subtext">{subtext}</small>
          {trend && <span className="metric-trend">{trend}</span>}
        </div>
      </div>
    </div>
  );
}

function formatClock(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

export function SmartAllocationDashboard() {
  const [simulation, setSimulation] = useState<SimulationState>(() => createInitialSimulation());
  const [runCount, setRunCount] = useState(1);
  const [activeTabNav, setActiveTabNav] = useState("allocation");
  const [showWeightsTuner, setShowWeightsTuner] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Keep a live second tick for the clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const result = useMemo(() => runSimulation(simulation), [simulation, runCount]);
  const expiryMinutes = Math.max(0, Math.round((simulation.batch.safeUntil - simulation.now) / 60_000));

  const dispatchAction = (action: SimulationAction) => {
    setSimulation((current) => applySimulationAction(current, action));
  };

  const updateBatch = (updates: Partial<SimulationState["batch"]>) => {
    setSimulation((current) => ({
      ...current,
      batch: { ...current.batch, ...updates },
    }));
  };

  const updateConfig = (updates: Partial<SimulationState["config"]>) => {
    setSimulation((current) => ({
      ...current,
      config: { ...current.config, ...updates },
    }));
  };

  const updateWeight = (key: keyof SimulationState["config"]["weights"], value: number) => {
    setSimulation((current) => ({
      ...current,
      config: {
        ...current.config,
        weights: {
          ...current.config.weights,
          [key]: value,
        },
      },
    }));
  };

  const handleRunAllocation = () => {
    setRunCount((count) => count + 1);
    const timeStr = new Date().toISOString().slice(11, 19);
    setSimulation((current) => ({
      ...current,
      events: [
        `${timeStr} · [DISPATCH RECALCULATED] Deterministic run #${runCount + 1} finalized with 100% hard safety gates applied.`,
        ...current.events,
      ].slice(0, 10),
    }));
  };

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand-lockup">
            <div className="brand-mark">
              <Activity size={20} />
            </div>
            <div className="brand-text">
              <h1>
                ResQFlow <span className="brand-divider">/</span> <span className="brand-sub">Dispatch OS</span>
              </h1>
              <p className="brand-tagline">SMART BATCH ALLOCATION ENGINE</p>
            </div>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-link ${activeTabNav === "allocation" ? "active" : ""}`}
              onClick={() => setActiveTabNav("allocation")}
            >
              Batch Allocation
            </button>
            <button
              className={`nav-link ${activeTabNav === "ghost-claim" ? "active" : ""}`}
              onClick={() => setActiveTabNav("ghost-claim")}
            >
              Ghost-Claim Recovery
            </button>
            <button
              className={`nav-link ${activeTabNav === "mid-route" ? "active" : ""}`}
              onClick={() => setActiveTabNav("mid-route")}
            >
              Mid-Route Rescue
            </button>
            <button
              className={`nav-link ${activeTabNav === "dispatch" ? "active" : ""}`}
              onClick={() => setActiveTabNav("dispatch")}
            >
              Dispatch Board
            </button>
            <button
              className={`nav-link ${activeTabNav === "topology" ? "active" : ""}`}
              onClick={() => setActiveTabNav("topology")}
            >
              Network Topology
            </button>
            <button
              className={`nav-link ${activeTabNav === "audit" ? "active" : ""}`}
              onClick={() => setActiveTabNav("audit")}
            >
              Safety Audit
            </button>
          </nav>
        </div>

        <div className="topbar-right">
          <div className="status-pill-online">
            <span className="live-pulse" />
            <span className="engine-status">ENGINE ONLINE · DETERMINISTIC V2.4</span>
          </div>
          <div className="topbar-timestamp">
            <Clock3 size={13} className="text-mint" />
            <span className="mono">{formatClock(currentTime)}</span>
          </div>
        </div>
      </header>

      {/* Dedicated Smart Batch Allocation Screen */}
      {activeTabNav === "allocation" && <SmartBatchAllocationScreen />}

      {/* Dedicated Ghost-Claim Recovery Screen */}
      {activeTabNav === "ghost-claim" && <GhostClaimRecoveryScreen />}

      {/* Dedicated Mid-Route Rescue Screen */}
      {activeTabNav === "mid-route" && <MidRouteRescueScreen />}

      {/* Network Topology Standalone View */}
      {activeTabNav === "topology" && (
        <section className="panel topology-view-panel" style={{ marginBottom: 24 }}>
          <NetworkVisualizer
            batch={simulation.batch}
            riders={simulation.riders}
            shelters={simulation.shelters}
            assignments={result.assignments}
          />
        </section>
      )}

      {/* Safety Audit Standalone View */}
      {activeTabNav === "audit" && (
        <section style={{ marginBottom: 24 }}>
          <BlockedCandidatesTable
            candidates={result.rejectedCandidates}
            riders={simulation.riders}
            shelters={simulation.shelters}
          />
        </section>
      )}

      {/* Full Dispatch Command View */}
      {activeTabNav === "dispatch" && (
        <>
          {/* Redesigned Hero Section */}
          <section className="hero-section">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <Sparkles size={12} className="text-mint" />
            <span>CIVIC LOGISTICS · ZERO-SPOILAGE GUARANTEE</span>
          </div>
          <h2>
            Deterministic Food Redistribution <em>at Scale</em>
          </h2>
          <p className="hero-description">
            Safely orchestrating surplus donations to vulnerable communities. Guarantees safe-life expiry
            compliance, volunteer payload limits, and shelter utility compatibility before a single mile is ridden.
          </p>
        </div>

        <div className="hero-actions">
          <button className="primary-run-button" onClick={handleRunAllocation}>
            <Zap size={16} />
            <span>Run Allocation</span>
            <span className="key-hint">#{runCount}</span>
            <ChevronRight size={15} />
          </button>
          <button className="ghost-reset-button" onClick={() => dispatchAction("reset")}>
            <RotateCcw size={15} />
            <span>Reset Demo</span>
          </button>
        </div>
      </section>

      {/* Four KPI Cards */}
      <section className="metrics-row">
        <MetricCard
          label="DONATED MEALS"
          value={simulation.batch.quantity}
          subtext={`${simulation.batch.commodity.replace("-", " ")} · ${simulation.batch.sealed ? "sealed packaging" : "open pack"}`}
          tone="mint"
          icon={<Box size={18} />}
        />
        <MetricCard
          label="ALLOCATED SAFELY"
          value={result.allocatedQuantity}
          subtext={`${Math.round((result.allocatedQuantity / Math.max(1, simulation.batch.quantity)) * 100)}% batch coverage`}
          trend={`${result.assignments.length} authorized routes`}
          tone="teal"
          icon={<ShieldCheck size={18} />}
        />
        <MetricCard
          label="HELD IN RESERVE"
          value={result.unallocatedQuantity}
          subtext={result.unallocatedQuantity > 0 ? "Protected by safety limits" : "100% safely assigned"}
          trend={result.unallocatedQuantity > 0 ? "Hard Gate Active" : "Optimal"}
          tone={result.unallocatedQuantity > 0 ? "amber" : "mint"}
          icon={<AlertOctagon size={18} />}
        />
        <MetricCard
          label="FLEET & SHELTERS"
          value={`${result.availableRiderCount} / ${simulation.riders.length}`}
          subtext={`${result.eligibleShelterCount} shelters ready for intake`}
          trend={`${result.averageScore > 0 ? Math.round(result.averageScore * 100) : 0}% avg score`}
          tone="violet"
          icon={<Users size={18} />}
        />
      </section>

      {/* Active Resilience Scenario Banner */}
      {simulation.activeScenario && (
        <div className="active-scenario-banner">
          <div className="banner-badge">
            <Radio size={14} className="pulse-icon text-amber" />
            <span>FAILURE SIMULATION ACTIVE</span>
          </div>
          <p className="banner-text">
            <strong>Active Trigger: </strong>
            {simulation.activeScenario === "close-shelter" && "Shelter intake closed unexpectedly. In-transit & unpicked cargo rerouted."}
            {simulation.activeScenario === "disable-rider" && "Volunteer rider offline. Reservations released; chain-of-custody protected."}
            {simulation.activeScenario === "critical-expiry" && "Safe-life dropped to 10 minutes. Cutoff gate enforced."}
            {simulation.activeScenario === "missing-resources" && "Clean water & cooking fuel unavailable. Ration-kit routes rejected."}
          </p>
          <button className="banner-reset-link" onClick={() => dispatchAction("reset")}>
            Clear Simulation <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      {/* Main Workspace 2-Column Grid */}
      <div className="workspace-layout">
        {/* Left Column: Control Panel & Resilience Lab */}
        <aside className="controls-column">
          {/* Batch Configuration Panel */}
          <div className="panel control-panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">01 / DISPATCH PARAMETERS</p>
                <h3>Donation & Buffer Controls</h3>
              </div>
              <SlidersHorizontal size={16} className="text-mint" />
            </div>

            {/* Commodity Selector */}
            <div className="control-group">
              <label className="input-label">Commodity Classification</label>
              <div className="chip-selector">
                {(["cooked-meals", "ration-kit", "produce"] as CommodityType[]).map((type) => (
                  <button
                    key={type}
                    className={`selector-chip ${simulation.batch.commodity === type ? "active" : ""}`}
                    onClick={() => updateBatch({ commodity: type })}
                  >
                    {type.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Donation Quantity Slider */}
            <div className="control-group">
              <div className="label-with-value">
                <span className="input-label">Batch Volume</span>
                <strong className="mono val-badge">{simulation.batch.quantity} meals</strong>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={simulation.batch.quantity}
                onChange={(e) => updateBatch({ quantity: Number(e.target.value) })}
                className="custom-range"
              />
              <div className="range-bounds">
                <span>0</span>
                <span>150</span>
                <span>300 meals</span>
              </div>
            </div>

            {/* Safe-Life Expiry Slider */}
            <div className="control-group">
              <div className="label-with-value">
                <span className="input-label">Approved Safe-Life</span>
                <strong className={`mono val-badge ${expiryMinutes <= 15 ? "badge-critical" : ""}`}>
                  {expiryMinutes} minutes
                </strong>
              </div>
              <input
                type="range"
                min="5"
                max="180"
                step="5"
                value={expiryMinutes}
                onChange={(e) => updateBatch({ safeUntil: simulation.now + Number(e.target.value) * 60_000 })}
                className="custom-range"
              />
              <div className="range-bounds">
                <span>5 min (Critical)</span>
                <span>75 min (Standard)</span>
                <span>180 min</span>
              </div>
            </div>

            {/* Safety Reserve Buffer */}
            <div className="control-group">
              <div className="label-with-value">
                <span className="input-label">Safety Buffer Reserve</span>
                <strong className="mono val-badge">{simulation.config.safetyBufferMinutes} minutes</strong>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={simulation.config.safetyBufferMinutes}
                onChange={(e) => updateConfig({ safetyBufferMinutes: Number(e.target.value) })}
                className="custom-range"
              />
              <div className="range-bounds">
                <span>0 min</span>
                <span>8 min (Safe)</span>
                <span>25 min</span>
              </div>
            </div>

            {/* Sealed Package Toggle */}
            <div className="toggle-row">
              <div className="toggle-info">
                <strong>Hermetic Seal Verified</strong>
                <small>Enforces zero-tamper packaging protocol</small>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={simulation.batch.sealed}
                  onChange={(e) => updateBatch({ sealed: e.target.checked })}
                />
                <span className="switch-slider" />
              </label>
            </div>

            {/* Expandable Scoring Weights Tuner */}
            <div className="weights-accordion">
              <button
                className="accordion-toggle"
                onClick={() => setShowWeightsTuner(!showWeightsTuner)}
              >
                <div className="accordion-title">
                  <Gauge size={14} className="text-mint" />
                  <span>Configurable Multi-Factor Weights</span>
                </div>
                {showWeightsTuner ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showWeightsTuner && (
                <div className="weights-body">
                  <p className="weights-hint">
                    Adjust algorithm priority balance (sum dynamically normalized):
                  </p>
                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Urgency:</span>
                      <strong className="mono">{Math.round(simulation.config.weights.urgency * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={simulation.config.weights.urgency}
                      onChange={(e) => updateWeight("urgency", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>
                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Feasibility:</span>
                      <strong className="mono">{Math.round(simulation.config.weights.feasibility * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={simulation.config.weights.feasibility}
                      onChange={(e) => updateWeight("feasibility", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>
                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Expiry Urgency:</span>
                      <strong className="mono">{Math.round(simulation.config.weights.expiryUrgency * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={simulation.config.weights.expiryUrgency}
                      onChange={(e) => updateWeight("expiryUrgency", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>
                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Fairness:</span>
                      <strong className="mono">{Math.round(simulation.config.weights.fairness * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={simulation.config.weights.fairness}
                      onChange={(e) => updateWeight("fairness", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>
                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Reliability:</span>
                      <strong className="mono">{Math.round(simulation.config.weights.reliability * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={simulation.config.weights.reliability}
                      onChange={(e) => updateWeight("reliability", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resilience Lab (Failure Simulations) */}
          <div className="panel simulation-panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">06 / RESILIENCE LAB</p>
                <h3>Stress-Test Simulations</h3>
              </div>
              <AlertOctagon size={16} className="text-amber" />
            </div>
            <p className="panel-subtext">
              Inject real-world operational disruptions. Engine adapts live and preserves safety boundaries.
            </p>

            <div className="simulation-cards-grid">
              <button
                className={`sim-action-card ${simulation.activeScenario === "close-shelter" ? "sim-active" : ""}`}
                onClick={() => dispatchAction("close-shelter")}
              >
                <div className="sim-header">
                  <span className="sim-code">SIM 01</span>
                  <span className="sim-tag">IN-TRANSIT REROUTE</span>
                </div>
                <strong>Shelter Demand Closes</strong>
                <small>Recovers unpicked cargo and finds feasible alternate shelters.</small>
              </button>

              <button
                className={`sim-action-card ${simulation.activeScenario === "disable-rider" ? "sim-active" : ""}`}
                onClick={() => dispatchAction("disable-rider")}
              >
                <div className="sim-header">
                  <span className="sim-code">SIM 02</span>
                  <span className="sim-tag">CUSTODY GUARD</span>
                </div>
                <strong>Volunteer Unavailable</strong>
                <small>Releases safe reservations and protects picked-up payload.</small>
              </button>

              <button
                className={`sim-action-card ${simulation.activeScenario === "critical-expiry" ? "sim-active" : ""}`}
                onClick={() => dispatchAction("critical-expiry")}
              >
                <div className="sim-header">
                  <span className="sim-code">SIM 03</span>
                  <span className="sim-tag">10M CUTOFF</span>
                </div>
                <strong>Expiry Drops to 10m</strong>
                <small>Recalculates feasibility and hard-blocks tight routes.</small>
              </button>

              <button
                className={`sim-action-card ${simulation.activeScenario === "missing-resources" ? "sim-active" : ""}`}
                onClick={() => dispatchAction("missing-resources")}
              >
                <div className="sim-header">
                  <span className="sim-code">SIM 04</span>
                  <span className="sim-tag">RESOURCE GATE</span>
                </div>
                <strong>Missing Clean Water & Fuel</strong>
                <small>Blocks ration-kit allocations until utilities are restored.</small>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column: Allocation Results, Boards & Safety Tables */}
        <main className="results-column">
          <AllocationResults
            result={result}
            batch={simulation.batch}
            riders={simulation.riders}
            shelters={simulation.shelters}
          />
        </main>
      </div>

      {/* Audit Trail & Operational Events Log */}
      <section className="panel audit-trail-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">07 / DETERMINISTIC AUDIT LEDGER</p>
            <h3>Live Operational Events</h3>
          </div>
          <span className="micro-badge">IMMUTABLE LOG · RUN #{runCount}</span>
        </div>
        <div className="event-stream">
          {simulation.events.map((event, idx) => (
            <div className="event-stream-item" key={`${event}-${idx}`}>
              <div className="event-bullet" />
              <div className="event-content">
                <span className="event-text">{event}</span>
              </div>
              <span className="event-status-badge">VERIFIED</span>
            </div>
          ))}
        </div>
      </section>
        </>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <strong>ResQFlow Dispatch OS</strong> · Civic Logistics & Surplus Food Redistribution Engine
          </div>
          <div className="footer-right">
            <span>Deterministic pure algorithm</span> · Zero forced unsafe deliveries
          </div>
        </div>
      </footer>
    </div>
  );
}
