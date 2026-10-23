import { useState, useMemo } from "react";
import {
  Package,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  RotateCcw,
  RefreshCw,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
} from "lucide-react";
import type { DonationBatch, Rider, Shelter, AllocationConfig, AllocationResult } from "./types";
import { availableBatches, initialConfig, initialRiders, initialShelters, DEMO_NOW } from "./seedData";
import { allocateBatch } from "./allocator";
import { BlockedCandidatesTable } from "./BlockedCandidatesTable";
import { NetworkVisualizer } from "./NetworkVisualizer";

export function SmartBatchAllocationScreen() {
  const [batches, setBatches] = useState<DonationBatch[]>(() => structuredClone(availableBatches));
  const [selectedBatchId, setSelectedBatchId] = useState<string>("BATCH-240");
  const [riders, setRiders] = useState<Rider[]>(() => structuredClone(initialRiders));
  const [shelters, setShelters] = useState<Shelter[]>(() => structuredClone(initialShelters));
  const [config, setConfig] = useState<AllocationConfig>(() => structuredClone(initialConfig));
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"PLAN" | "TOPOLOGY">("PLAN");
  const [runKey, setRunKey] = useState<number>(1);
  const [hoveredScoreId, setHoveredScoreId] = useState<string | null>(null);

  // Currently selected batch
  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) ?? batches[0];
  }, [batches, selectedBatchId]);

  // Execute deterministic allocation algorithm
  const allocationResult: AllocationResult = useMemo(() => {
    return allocateBatch(currentBatch, riders, shelters, DEMO_NOW, config);
  }, [currentBatch, riders, shelters, config, runKey]);

  // Handle Run Allocation / Recalculate
  const handleRunAllocation = () => {
    setRunKey((k) => k + 1);
  };

  // Reset to initial state
  const handleReset = () => {
    setBatches(structuredClone(availableBatches));
    setSelectedBatchId("BATCH-240");
    setRiders(structuredClone(initialRiders));
    setShelters(structuredClone(initialShelters));
    setConfig(structuredClone(initialConfig));
    setRunKey((k) => k + 1);
  };

  // Toggle Shelter Status (Open / Closed)
  const toggleShelterStatus = (shelterId: string) => {
    setShelters((prev) =>
      prev.map((s) => (s.id === shelterId ? { ...s, status: s.status === "open" ? "closed" : "open" } : s)),
    );
  };

  // Toggle Rider Availability
  const toggleRiderAvailable = (riderId: string) => {
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, available: !r.available } : r)),
    );
  };

  // Update batch safe until duration
  const updateBatchSafeMinutes = (mins: number) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === currentBatch.id ? { ...b, safeUntil: DEMO_NOW + mins * 60_000 } : b)),
    );
  };

  // Update batch quantity
  const updateBatchQuantity = (qty: number) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === currentBatch.id ? { ...b, quantity: qty } : b)),
    );
  };

  // Update weight parameters
  const updateWeight = (key: keyof AllocationConfig["weights"], val: number) => {
    setConfig((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: val,
      },
    }));
  };

  // Calculate live countdown string for the batch
  const getSafeLifeCountdown = (safeUntil: number) => {
    const diffMs = Math.max(0, safeUntil - DEMO_NOW);
    const totalMinutes = Math.floor(diffMs / 60_000);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m remaining`;
  };

  const safeMinutesRemaining = Math.max(0, Math.round((currentBatch.safeUntil - DEMO_NOW) / 60_000));
  const safeLifeClass = safeMinutesRemaining > 30 ? "good" : safeMinutesRemaining >= 10 ? "warn" : "bad";

  // Summary Metrics
  const totalFleetCapacity = riders.reduce((sum, r) => sum + (r.available ? r.carryingCapacity : 0), 0);
  const totalUsedCapacity = allocationResult.allocatedQuantity;
  const fleetUtilization = totalFleetCapacity > 0 ? Math.round((totalUsedCapacity / totalFleetCapacity) * 100) : 0;

  const totalDemand = shelters.reduce((sum, s) => sum + (s.status === "open" ? s.requestedQuantity : 0), 0);
  const demandSatisfaction = totalDemand > 0 ? Math.round((allocationResult.allocatedQuantity / totalDemand) * 100) : 0;

  return (
    <div className="batch-allocation-workspace">
      {/* Workspace Header */}
      <div className="screen-header">
        <div>
          <div className="eyebrow">DETERMINISTIC LOGISTICS · RESQFLOW CORE</div>
          <h2>Smart Batch Allocation Workspace</h2>
          <p className="screen-description">
            Distribute surplus perishable food batches across volunteer riders and shelters with strict food safety,
            route feasibility, and real-time capacity validation.
          </p>
        </div>

        <div className="header-action-bar">
          <button className="primary-run-button" onClick={handleRunAllocation}>
            <Zap size={16} /> Run Allocation
          </button>
          <button className="ghost-reset-button" onClick={handleRunAllocation}>
            <RefreshCw size={14} /> Recalculate
          </button>
          <button className="ghost-reset-button" onClick={handleReset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Available Food Batches Section */}
      <section className="batches-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">STAGE 01</span>
            <h3>Available Donation Batches</h3>
          </div>
          <span className="micro-badge">{batches.length} BATCHES CATALOGED</span>
        </div>

        <div className="batch-cards-grid">
          {batches.map((batch) => {
            const isSelected = batch.id === currentBatch.id;
            const batchSafeMinutes = Math.max(0, Math.round((batch.safeUntil - DEMO_NOW) / 60_000));
            const tone = batchSafeMinutes > 30 ? "good" : batchSafeMinutes >= 15 ? "warn" : "bad";
            const prepMinutesAgo = Math.round((DEMO_NOW - batch.preparedAt) / 60_000);

            return (
              <div
                key={batch.id}
                className={`batch-card ${isSelected ? "batch-card-active" : ""}`}
                onClick={() => setSelectedBatchId(batch.id)}
              >
                <div className="batch-card-top">
                  <div className="batch-id-tag mono">{batch.id}</div>
                  <span className={`badge ${tone}`}>
                    <Clock size={11} /> {getSafeLifeCountdown(batch.safeUntil)}
                  </span>
                </div>

                <div className="batch-card-body">
                  <div className="batch-qty-row">
                    <strong className="batch-qty-num">{batch.quantity}</strong>
                    <span className="batch-qty-label">{batch.commodity.replace("-", " ")}</span>
                  </div>

                  <div className="batch-meta-list">
                    <div className="meta-item">
                      <Calendar size={12} className="text-muted" />
                      <span>Prepared {prepMinutesAgo} mins ago</span>
                    </div>
                    <div className="meta-item">
                      <MapPin size={12} className="text-muted" />
                      <span>{batch.pickupLocation}</span>
                    </div>
                    <div className="meta-item">
                      <ShieldCheck size={12} className="text-mint" />
                      <span>{batch.sealed ? "Hermetic Seal Verified" : "Open Packaging"}</span>
                    </div>
                  </div>
                </div>

                <div className="batch-card-footer">
                  <span className="selection-indicator">
                    {isSelected ? "● CURRENTLY TARGETED" : "CLICK TO ALLOCATE"}
                  </span>
                  <span className="pickup-time mono">Pickup ~{batch.pickupMinutes}m</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Allocation KPI Summary Bar */}
      <section className="metrics-row">
        <div className="metric-card metric-mint">
          <div className="metric-header">
            <span className="metric-label">BATCH QUANTITY</span>
            <div className="metric-icon-wrap"><Package size={18} /></div>
          </div>
          <strong className="metric-value">{currentBatch.quantity}</strong>
          <div className="metric-footer">
            <small className="metric-subtext">{currentBatch.id} · {currentBatch.commodity}</small>
            <span className={`metric-trend badge ${safeLifeClass}`}>{safeMinutesRemaining}m safe</span>
          </div>
        </div>

        <div className="metric-card metric-teal">
          <div className="metric-header">
            <span className="metric-label">SAFELY ALLOCATED</span>
            <div className="metric-icon-wrap"><CheckCircle2 size={18} /></div>
          </div>
          <strong className="metric-value">{allocationResult.allocatedQuantity}</strong>
          <div className="metric-footer">
            <small className="metric-subtext">Across {allocationResult.assignments.length} verified routes</small>
            <span className="metric-trend text-mint">
              {Math.round((allocationResult.allocatedQuantity / Math.max(1, currentBatch.quantity)) * 100)}%
            </span>
          </div>
        </div>

        <div className="metric-card metric-amber">
          <div className="metric-header">
            <span className="metric-label">UNALLOCATED INVENTORY</span>
            <div className="metric-icon-wrap"><AlertTriangle size={18} /></div>
          </div>
          <strong className="metric-value">{allocationResult.unallocatedQuantity}</strong>
          <div className="metric-footer">
            <small className="metric-subtext">
              {allocationResult.unallocatedQuantity > 0 ? "Protected by safety gates" : "100% matched safely"}
            </small>
            <span className={`metric-trend ${allocationResult.unallocatedQuantity > 0 ? "badge bad" : ""}`}>
              {allocationResult.unallocatedQuantity > 0 ? "Held" : "Clean"}
            </span>
          </div>
        </div>

        <div className="metric-card metric-violet">
          <div className="metric-header">
            <span className="metric-label">SATISFACTION & FLEET</span>
            <div className="metric-icon-wrap"><Users size={18} /></div>
          </div>
          <strong className="metric-value">{demandSatisfaction}%</strong>
          <div className="metric-footer">
            <small className="metric-subtext">{fleetUtilization}% fleet payload capacity utilized</small>
            <span className="metric-trend">{allocationResult.availableRiderCount} riders</span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Split: Controls/Config vs Allocation Results */}
      <div className="workspace-layout">
        {/* Left Column: Batch Sliders, Config & Fleet/Shelter Controls */}
        <aside className="controls-column">
          {/* Quick Tuning Panel */}
          <div className="panel control-panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">LIVE ALLOCATION CONFIG</p>
                <h3>Target Batch Tuning</h3>
              </div>
              <SlidersHorizontal size={16} className="text-mint" />
            </div>

            <div className="control-group">
              <div className="label-with-value">
                <span className="input-label">Batch Donation Meals</span>
                <strong className="mono val-badge">{currentBatch.quantity}</strong>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={currentBatch.quantity}
                onChange={(e) => updateBatchQuantity(Number(e.target.value))}
                className="custom-range"
              />
              <div className="range-bounds">
                <span>10</span>
                <span>150</span>
                <span>300</span>
              </div>
            </div>

            <div className="control-group">
              <div className="label-with-value">
                <span className="input-label">Remaining Safe-Life</span>
                <strong className={`mono val-badge ${safeMinutesRemaining <= 15 ? "badge-critical" : ""}`}>
                  {safeMinutesRemaining} mins
                </strong>
              </div>
              <input
                type="range"
                min="5"
                max="180"
                step="5"
                value={safeMinutesRemaining}
                onChange={(e) => updateBatchSafeMinutes(Number(e.target.value))}
                className="custom-range"
              />
              <div className="range-bounds">
                <span>5m (Critical)</span>
                <span>75m (Standard)</span>
                <span>180m</span>
              </div>
            </div>

            <div className="control-group">
              <div className="label-with-value">
                <span className="input-label">Mandatory Safety Buffer</span>
                <strong className="mono val-badge">{config.safetyBufferMinutes} mins</strong>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={config.safetyBufferMinutes}
                onChange={(e) => setConfig((c) => ({ ...c, safetyBufferMinutes: Number(e.target.value) }))}
                className="custom-range"
              />
              <div className="range-bounds">
                <span>0m</span>
                <span>8m (Recommended)</span>
                <span>20m</span>
              </div>
            </div>

            {/* Configurable Multi-Factor Weight Sliders */}
            <div className="weights-accordion">
              <button
                className="accordion-toggle"
                onClick={() => setShowConfig(!showConfig)}
              >
                <div className="accordion-title">
                  <TrendingUp size={14} className="text-mint" />
                  <span>Rank Scoring Weights (0 to 1)</span>
                </div>
                {showConfig ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showConfig && (
                <div className="weights-body">
                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Urgency Weight (0.35 default)</span>
                      <strong className="mono">{Math.round(config.weights.urgency * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.urgency}
                      onChange={(e) => updateWeight("urgency", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>

                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Feasibility Weight (0.25 default)</span>
                      <strong className="mono">{Math.round(config.weights.feasibility * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.feasibility}
                      onChange={(e) => updateWeight("feasibility", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>

                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Expiry Urgency (0.20 default)</span>
                      <strong className="mono">{Math.round(config.weights.expiryUrgency * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.expiryUrgency}
                      onChange={(e) => updateWeight("expiryUrgency", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>

                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Fairness Weight (0.10 default)</span>
                      <strong className="mono">{Math.round(config.weights.fairness * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.fairness}
                      onChange={(e) => updateWeight("fairness", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>

                  <div className="weight-slider-row">
                    <div className="label-with-value">
                      <span>Reliability Weight (0.10 default)</span>
                      <strong className="mono">{Math.round(config.weights.reliability * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.weights.reliability}
                      onChange={(e) => updateWeight("reliability", Number(e.target.value))}
                      className="custom-range mini-range"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shelter Demands with Status Toggle */}
          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">DESTINATIONS</p>
                <h3>Shelter Intake & Demand</h3>
              </div>
              <span className="micro-badge">{shelters.filter((s) => s.status === "open").length} Open</span>
            </div>

            <div className="cards-list">
              {shelters.map((shelter) => {
                const remaining = allocationResult.remainingDemand[shelter.id] ?? shelter.requestedQuantity;
                const allocated = shelter.requestedQuantity - remaining;
                const pct = shelter.requestedQuantity > 0 ? Math.round((allocated / shelter.requestedQuantity) * 100) : 0;
                const isClosed = shelter.status === "closed";

                return (
                  <div key={shelter.id} className={`card-item ${isClosed ? "card-closed" : ""}`}>
                    <div className="card-top-row">
                      <div className="card-identity">
                        <div className="building-icon-badge"><Building2 size={14} /></div>
                        <div>
                          <strong className="card-name">{shelter.name}</strong>
                          <div className="card-subtext">{shelter.travelMinutes}m route · Cap: {shelter.capacity}</div>
                        </div>
                      </div>

                      <button
                        className={`status-pill ${isClosed ? "pill-bad" : "pill-need"}`}
                        onClick={() => toggleShelterStatus(shelter.id)}
                        title="Click to toggle Open/Closed status"
                      >
                        {isClosed ? "Closed (Click)" : `${remaining} Needed`}
                      </button>
                    </div>

                    <div className="progress-group">
                      <div className="progress-labels">
                        <span>Fulfillment: {allocated} / {shelter.requestedQuantity} meals</span>
                        <strong className="mono">{pct}%</strong>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${isClosed ? "fill-closed" : pct === 100 ? "fill-mint" : "fill-blue"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volunteer Riders with Availability Toggle */}
          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">FLEET</p>
                <h3>Rider Capacity & Load</h3>
              </div>
              <span className="micro-badge">{riders.filter((r) => r.available).length} Active</span>
            </div>

            <div className="cards-list">
              {riders.map((rider) => {
                const remaining = allocationResult.remainingCapacity[rider.id] ?? rider.carryingCapacity;
                const used = rider.carryingCapacity - remaining;
                const pct = Math.round((used / rider.carryingCapacity) * 100);
                const isOffline = !rider.available;

                return (
                  <div key={rider.id} className={`card-item ${isOffline ? "card-offline" : ""}`}>
                    <div className="card-top-row">
                      <div className="card-identity">
                        <div className="rider-icon-badge"><Users size={14} /></div>
                        <div>
                          <strong className="card-name">{rider.name}</strong>
                          <div className="card-subtext">{rider.id} · Reliability {Math.round(rider.reliability * 100)}%</div>
                        </div>
                      </div>

                      <button
                        className={`status-pill ${isOffline ? "pill-bad" : "pill-active"}`}
                        onClick={() => toggleRiderAvailable(rider.id)}
                        title="Click to toggle Available/Offline status"
                      >
                        {isOffline ? "Offline (Click)" : `${remaining} Free`}
                      </button>
                    </div>

                    <div className="progress-group">
                      <div className="progress-labels">
                        <span>Payload: {used} / {rider.carryingCapacity} meals</span>
                        <strong className="mono">{pct}%</strong>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${isOffline ? "fill-closed" : "fill-violet"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Column: Allocation Results Plan Table & Topology */}
        <main className="results-column">
          {/* View Tab Switcher */}
          <div className="view-switcher-bar">
            <div className="tab-group">
              <button
                className={`tab-btn ${activeTab === "PLAN" ? "active" : ""}`}
                onClick={() => setActiveTab("PLAN")}
              >
                <Package size={14} /> Allocation Results ({allocationResult.assignments.length} Routes)
              </button>
              <button
                className={`tab-btn ${activeTab === "TOPOLOGY" ? "active" : ""}`}
                onClick={() => setActiveTab("TOPOLOGY")}
              >
                <Sparkles size={14} /> Network Dispatch Topology
              </button>
            </div>
            <div className="view-meta">
              <span className="dispatch-badge">
                <span className="pulse-indicator" />
                DETERMINISTIC V2.4
              </span>
            </div>
          </div>

          {activeTab === "TOPOLOGY" ? (
            <div className="panel topology-panel">
              <NetworkVisualizer
                batch={currentBatch}
                riders={riders}
                shelters={shelters}
                assignments={allocationResult.assignments}
              />
            </div>
          ) : (
            <div className="panel panel-results">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">DISPATCH BOARD</p>
                  <h3>Deterministic Allocation Results</h3>
                </div>
                <div className="heading-badges">
                  <span className="badge good">
                    <CheckCircle2 size={13} /> {allocationResult.assignments.length} Routes Generated
                  </span>
                  <span className="badge teal">
                    <Package size={13} /> {allocationResult.allocatedQuantity} Meals Assigned
                  </span>
                </div>
              </div>

              {allocationResult.assignments.length > 0 ? (
                <div className="table-scroll">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>RIDER</th>
                        <th>DESTINATION</th>
                        <th>QTY ALLOCATED</th>
                        <th>TRANSIT ETA</th>
                        <th>SAFETY MARGIN</th>
                        <th>SCORE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocationResult.assignments.map((assignment) => {
                        const isHovered = hoveredScoreId === assignment.id;
                        const margin = assignment.safetyMarginMinutes;
                        const marginClass = margin > 15 ? "margin-high" : margin >= 5 ? "margin-medium" : "margin-low";

                        return (
                          <tr key={assignment.id} className="assignment-row">
                            <td>
                              <div className="rider-cell">
                                <div className="rider-avatar">{assignment.riderName[0]}</div>
                                <div>
                                  <strong className="rider-name">{assignment.riderName}</strong>
                                  <span className="rider-id-badge mono">{assignment.riderId}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="shelter-cell">
                                <strong className="shelter-name">{assignment.shelterName}</strong>
                                <span className="shelter-route-subtext mono">{assignment.shelterId}</span>
                              </div>
                            </td>
                            <td>
                              <div className="qty-cell">
                                <strong className="qty-num">{assignment.quantity}</strong>
                                <small className="qty-unit">meals</small>
                              </div>
                            </td>
                            <td>
                              <div className="time-cell">
                                <div className="time-primary">
                                  <Clock size={13} className="text-muted" />
                                  <span className="mono">{assignment.completionMinutes}m</span>
                                </div>
                                <small className="time-eta">
                                  ETA {new Date(assignment.completionAt).toISOString().slice(11, 16)} UTC
                                </small>
                              </div>
                            </td>
                            <td>
                              <div className="margin-cell">
                                <span className={`safety-badge ${marginClass}`}>
                                  {Math.floor(margin)}m margin
                                </span>
                                <div className="mini-margin-track">
                                  <div
                                    className={`mini-margin-fill ${marginClass}`}
                                    style={{ width: `${Math.min(100, Math.max(10, (margin / 60) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="relative-cell">
                              <div
                                className="score-cell-trigger"
                                onMouseEnter={() => setHoveredScoreId(assignment.id)}
                                onMouseLeave={() => setHoveredScoreId(null)}
                              >
                                <span className="score-pill-refined">
                                  <TrendingUp size={11} /> {Math.round(assignment.score.total * 100)}%
                                </span>
                              </div>
                              {isHovered && (
                                <div className="score-popover">
                                  <div className="popover-title">Scoring Factor Weights</div>
                                  <div className="popover-row">
                                    <span>Urgency (35%)</span>
                                    <strong>{Math.round(assignment.score.urgency * 100)}%</strong>
                                  </div>
                                  <div className="popover-row">
                                    <span>Feasibility (25%)</span>
                                    <strong>{Math.round(assignment.score.feasibility * 100)}%</strong>
                                  </div>
                                  <div className="popover-row">
                                    <span>Expiry Urgency (20%)</span>
                                    <strong>{Math.round(assignment.score.expiryUrgency * 100)}%</strong>
                                  </div>
                                  <div className="popover-row">
                                    <span>Fairness (10%)</span>
                                    <strong>{Math.round(assignment.score.fairness * 100)}%</strong>
                                  </div>
                                  <div className="popover-row">
                                    <span>Reliability (10%)</span>
                                    <strong>{Math.round(assignment.score.reliability * 100)}%</strong>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="status-chip ready">
                                <span className="pulse-dot" /> DISPATCH READY
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state large">
                  <AlertTriangle size={32} className="text-coral" />
                  <div>
                    <strong>No Feasible Delivery Routes Available</strong>
                    <p>Current safety buffers, expiry limits, or shelter closures prevent safe assignment.</p>
                  </div>
                </div>
              )}

              {allocationResult.unallocatedQuantity > 0 && (
                <div className="warning-banner">
                  <AlertTriangle size={18} className="text-amber" />
                  <div className="banner-body">
                    <strong>{allocationResult.unallocatedQuantity} Meals Held in Hub Reserve</strong>
                    <p>
                      {allocationResult.unallocatedInventory.reasons[0] ??
                        "Remaining batch inventory preserved safely at kitchen hub to avoid forced drop-offs."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Blocked Candidates Rejection Audit Table */}
          <BlockedCandidatesTable
            candidates={allocationResult.rejectedCandidates}
            riders={riders}
            shelters={shelters}
          />
        </main>
      </div>
    </div>
  );
}
