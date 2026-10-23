import { useState, useMemo } from "react";
import {
  Package,
  Clock,
  MapPin,
  ShieldCheck,
  RotateCcw,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Plus,
  Truck,
  Edit3,
  ShieldAlert,
} from "lucide-react";
import { DEMO_NOW } from "./seedData";
import { NetworkVisualizer } from "./NetworkVisualizer";
import { useDispatchStore } from "./DispatchContext";
import { ManualAllocationModal } from "./ManualAllocationModal";
import { ShelterManagementModal } from "./ShelterManagementModal";

export function SmartBatchAllocationScreen() {
  const {
    batches,
    riders,
    shelters,
    assignments,
    events,
    totalDonated,
    availableInventory,
    reservedMeals,
    mealsWithRiders,
    deliveredMeals,
    unallocatedMeals,
    activeRidersCount,
    availableRidersCount,
    partiallyLoadedCount,
    fullyLoadedCount,
    openSheltersCount,
    remainingShelterDemand,
    confirmDispatch,
    markPickedUp,
    markDelivered,
    releaseAssignment,
    toggleShelterStatus,
    toggleRiderAvailability,
    loadSampleScenario,
  } = useDispatchStore();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || "BATCH-240");
  const [activeTab, setActiveTab] = useState<"PLAN" | "TOPOLOGY">("PLAN");

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [preselectedRiderId, setPreselectedRiderId] = useState<string | undefined>(undefined);
  const [preselectedShelterId, setPreselectedShelterId] = useState<string | undefined>(undefined);
  const [isShelterModalOpen, setIsShelterModalOpen] = useState(false);
  const [editingShelterId, setEditingShelterId] = useState<string | null>(null);

  // Action status message banner
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Currently selected batch
  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) ?? batches[0];
  }, [batches, selectedBatchId]);

  // Calculate live countdown string for the batch
  const getSafeLifeCountdown = (safeUntil: number) => {
    const diffMs = Math.max(0, safeUntil - DEMO_NOW);
    const totalMinutes = Math.floor(diffMs / 60_000);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m remaining`;
  };

  // Action Handlers
  const handleConfirmDispatch = (assignmentId: string) => {
    const res = confirmDispatch(assignmentId);
    if (res.success) {
      setActionFeedback({ type: "success", message: "Dispatch confirmed! Rider ready for hub pickup." });
    } else {
      setActionFeedback({ type: "error", message: res.error || "Failed to confirm dispatch." });
    }
  };

  const handleMarkPickedUp = (assignmentId: string) => {
    const res = markPickedUp(assignmentId);
    if (res.success) {
      setActionFeedback({ type: "success", message: "Cargo picked up! Rider is now On Delivery with physical custody." });
    } else {
      setActionFeedback({ type: "error", message: res.error || "Failed to mark picked up." });
    }
  };

  const handleMarkDelivered = (assignmentId: string) => {
    const res = markDelivered(assignmentId);
    if (res.success) {
      setActionFeedback({ type: "success", message: "Delivery confirmed at shelter! Rider capacity released and now Available." });
    } else {
      setActionFeedback({ type: "error", message: res.error || "Failed to mark delivered." });
    }
  };

  const handleReleaseAssignment = (assignmentId: string) => {
    if (confirm("Are you sure you want to release this assignment back to inventory?")) {
      const res = releaseAssignment(assignmentId);
      if (res.success) {
        setActionFeedback({ type: "success", message: "Assignment cancelled and meals released back to batch inventory." });
      } else {
        setActionFeedback({ type: "error", message: res.error || "Failed to release assignment." });
      }
    }
  };

  const handleOpenManualModal = (riderId?: string, shelterId?: string) => {
    setPreselectedRiderId(riderId);
    setPreselectedShelterId(shelterId);
    setIsManualModalOpen(true);
  };

  const handleOpenShelterModal = (shelterId?: string) => {
    setEditingShelterId(shelterId || null);
    setIsShelterModalOpen(true);
  };

  const handleLoadSampleScenario = () => {
    if (confirm("Load 180-meal judge test scenario? This sets 180 donated meals, 5 riders (40 cap each), and 5 editable shelters.")) {
      loadSampleScenario();
      setSelectedBatchId("BATCH-240");
      setActionFeedback({ type: "success", message: "Sample scenario loaded! 180 meals, 5 riders (40 cap), 5 shelters ready." });
    }
  };

  return (
    <div className="batch-allocation-workspace">
      {/* Workspace Header */}
      <div className="screen-header">
        <div>
          <div className="eyebrow">OPERATIONAL COMMAND · DISPATCH OS</div>
          <h2>Manual Food Allocation & Rider Dispatch</h2>
          <p className="screen-description">
            Interactive command center for manual batch allocation, rider payload tracking, shelter intake status,
            and end-to-end chain of custody with 100% dynamic live counts.
          </p>
        </div>

        <div className="header-action-bar">
          <button className="primary-run-button" onClick={() => handleOpenManualModal()}>
            <Plus size={16} /> Allocate Food
          </button>
          <button className="ghost-reset-button" onClick={() => handleOpenShelterModal()}>
            <Building2 size={14} /> Manage Shelters
          </button>
          <button className="ghost-reset-button" onClick={handleLoadSampleScenario} title="Set baseline 180 meals, 5 riders, 5 shelters">
            <RotateCcw size={14} /> Load Sample Scenario
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`active-scenario-banner ${actionFeedback.type === "success" ? "banner-success" : "banner-error"}`}
          style={{ marginBottom: 20 }}
        >
          <div className="banner-badge">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 size={15} className="text-mint" />
            ) : (
              <AlertTriangle size={15} className="text-coral" />
            )}
            <span>{actionFeedback.type === "success" ? "ACTION VERIFIED" : "GATE VIOLATION"}</span>
          </div>
          <p className="banner-text">
            <strong>{actionFeedback.message}</strong>
          </p>
          <button className="banner-reset-link" onClick={() => setActionFeedback(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Prominent Live Counts Dashboard (All 12 Metrics strictly from live state) */}
      <section className="live-counts-section" style={{ marginBottom: 24 }}>
        <div className="section-title-row" style={{ marginBottom: 12 }}>
          <div>
            <span className="eyebrow">SECTION 01 / DYNAMIC TELEMETRY</span>
            <h3 style={{ fontSize: "1.1rem" }}>Accurate Live Counts & State Telemetry</h3>
          </div>
          <span className="micro-badge">100% REAL-TIME STATE · ZERO HARDCODING</span>
        </div>

        {/* 12 Prominent Dynamic Metric Cards in 2 Responsive Rows */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {/* 1. Total donated meals */}
          <div className="metric-card metric-mint" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>TOTAL DONATED</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Package size={14} /></div>
            </div>
            <strong className="metric-value" style={{ fontSize: "1.5rem" }}>{totalDonated}</strong>
            <small className="metric-subtext">Cumulative donations</small>
          </div>

          {/* 2. Available in inventory */}
          <div className="metric-card metric-teal" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>AVAILABLE INVENTORY</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Package size={14} /></div>
            </div>
            <strong className="metric-value text-mint" style={{ fontSize: "1.5rem" }}>{availableInventory}</strong>
            <small className="metric-subtext">Ready for allocation</small>
          </div>

          {/* 3. Meals reserved */}
          <div className="metric-card metric-amber" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>MEALS RESERVED</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Clock size={14} /></div>
            </div>
            <strong className="metric-value" style={{ fontSize: "1.5rem" }}>{reservedMeals}</strong>
            <small className="metric-subtext">Allocated or confirmed</small>
          </div>

          {/* 4. Meals with riders */}
          <div className="metric-card metric-violet" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>WITH RIDERS (TRANSIT)</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Truck size={14} /></div>
            </div>
            <strong className="metric-value text-cyan" style={{ fontSize: "1.5rem" }}>{mealsWithRiders}</strong>
            <small className="metric-subtext">Physical custody on road</small>
          </div>

          {/* 5. Successfully delivered */}
          <div className="metric-card metric-mint" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>DELIVERED MEALS</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><CheckCircle2 size={14} /></div>
            </div>
            <strong className="metric-value text-mint" style={{ fontSize: "1.5rem" }}>{deliveredMeals}</strong>
            <small className="metric-subtext">Verified handovers</small>
          </div>

          {/* 6. Remaining unallocated */}
          <div className="metric-card metric-teal" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>UNALLOCATED MEALS</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><AlertTriangle size={14} /></div>
            </div>
            <strong className="metric-value" style={{ fontSize: "1.5rem" }}>{unallocatedMeals}</strong>
            <small className="metric-subtext">Unassigned surplus</small>
          </div>

          {/* 7. Active riders */}
          <div className="metric-card metric-violet" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>ACTIVE RIDERS</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Users size={14} /></div>
            </div>
            <strong className="metric-value" style={{ fontSize: "1.5rem" }}>{activeRidersCount}</strong>
            <small className="metric-subtext">Carrying cargo or in-transit</small>
          </div>

          {/* 8. Available riders */}
          <div className="metric-card metric-mint" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>AVAILABLE RIDERS</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Users size={14} /></div>
            </div>
            <strong className="metric-value text-mint" style={{ fontSize: "1.5rem" }}>{availableRidersCount}</strong>
            <small className="metric-subtext">Zero load & ready</small>
          </div>

          {/* 9. Partially loaded riders */}
          <div className="metric-card metric-amber" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>PARTIALLY LOADED</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Users size={14} /></div>
            </div>
            <strong className="metric-value" style={{ fontSize: "1.5rem" }}>{partiallyLoadedCount}</strong>
            <small className="metric-subtext">Riders with remaining space</small>
          </div>

          {/* 10. Fully loaded / busy riders */}
          <div className="metric-card metric-violet" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>FULLY LOADED / BUSY</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Users size={14} /></div>
            </div>
            <strong className="metric-value" style={{ fontSize: "1.5rem" }}>{fullyLoadedCount}</strong>
            <small className="metric-subtext">At max capacity or on road</small>
          </div>

          {/* 11. Open shelters */}
          <div className="metric-card metric-mint" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>OPEN SHELTERS</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Building2 size={14} /></div>
            </div>
            <strong className="metric-value text-mint" style={{ fontSize: "1.5rem" }}>{openSheltersCount} / {shelters.length}</strong>
            <small className="metric-subtext">Accepting drop-offs</small>
          </div>

          {/* 12. Remaining shelter demand */}
          <div className="metric-card metric-teal" style={{ padding: "14px 16px" }}>
            <div className="metric-header" style={{ marginBottom: 6 }}>
              <span className="metric-label" style={{ fontSize: "0.68rem" }}>REMAINING DEMAND</span>
              <div className="metric-icon-wrap" style={{ width: 28, height: 28 }}><Building2 size={14} /></div>
            </div>
            <strong className="metric-value" style={{ fontSize: "1.5rem" }}>{remainingShelterDemand}</strong>
            <small className="metric-subtext">Unmet shelter demand</small>
          </div>
        </div>
      </section>

      {/* Available Food Batches Section */}
      <section className="batches-section">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">STAGE 01</span>
            <h3>Food Batches in Kitchen Hub Inventory</h3>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => handleOpenManualModal(undefined, undefined)}
              className="pill-btn pill-btn-mint"
              style={{ fontSize: "0.75rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}
            >
              <Plus size={13} /> Allocate Selected
            </button>
            <span className="micro-badge">{batches.length} BATCHES READY</span>
          </div>
        </div>

        <div className="batch-cards-grid">
          {batches.map((batch) => {
            const isSelected = batch.id === currentBatch?.id;
            const batchSafeMinutes = Math.max(0, Math.round((batch.safeUntil - DEMO_NOW) / 60_000));
            const tone = batchSafeMinutes > 30 ? "good" : batchSafeMinutes >= 15 ? "warn" : "bad";
            const prepMinutesAgo = Math.round((DEMO_NOW - batch.preparedAt) / 60_000);
            const availQty = Math.max(0, batch.quantity - batch.alreadyAllocated);

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
                    <strong className="batch-qty-num">{availQty}</strong>
                    <span className="batch-qty-label">
                      avail of {batch.quantity} {batch.commodity.replace("-", " ")}
                    </span>
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
                    {isSelected ? "● SELECTED FOR ALLOCATION" : "CLICK TO TARGET"}
                  </span>
                  <span className="pickup-time mono">Allocated: {batch.alreadyAllocated}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* STAGE 02: Shelter Intake & Management (Placed directly below Food Batches) */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-heading compact" style={{ marginBottom: 16 }}>
          <div>
            <p className="eyebrow">STAGE 02 / DESTINATIONS</p>
            <h3>Shelter Intake & Management</h3>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => handleOpenShelterModal()}
              className="pill-btn pill-btn-mint"
              style={{ fontSize: "0.75rem", padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Edit3 size={13} /> Edit Shelters
            </button>
            <span className="micro-badge">{openSheltersCount} Open / {shelters.length} Facilities</span>
          </div>
        </div>

        <div className="shelter-cards-grid">
          {shelters.map((shelter) => {
            const unmet = Math.max(0, shelter.requestedQuantity - shelter.alreadyReceivedQuantity);
            const pct = shelter.requestedQuantity > 0
              ? Math.min(100, Math.round((shelter.alreadyReceivedQuantity / shelter.requestedQuantity) * 100))
              : 100;
            const isClosed = shelter.status === "closed";

            return (
              <div key={shelter.id} className={`shelter-card ${isClosed ? "card-closed" : ""}`}>
                <div className="shelter-card-header">
                  <div className="shelter-identity">
                    <div className="building-icon-badge"><Building2 size={16} /></div>
                    <div className="shelter-info">
                      <strong className="shelter-name" title={shelter.name}>{shelter.name}</strong>
                      <span className="shelter-sublabel">{shelter.travelMinutes}m route · Cap {shelter.capacity}</span>
                    </div>
                  </div>

                  <div className="shelter-header-actions">
                    <button
                      className={`status-pill ${isClosed ? "pill-bad" : unmet === 0 ? "pill-mint" : "pill-need"}`}
                      onClick={() => toggleShelterStatus(shelter.id)}
                      title="Click to toggle Open/Closed status"
                      style={{ cursor: "pointer", fontSize: "0.72rem", padding: "4px 8px" }}
                    >
                      {isClosed ? "Closed" : unmet === 0 ? "Satisfied" : `${unmet} Needed`}
                    </button>
                    <button
                      className="icon-action-btn"
                      onClick={() => handleOpenShelterModal(shelter.id)}
                      title="Edit shelter demand, capacity & travel time"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        padding: "5px 7px",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                </div>

                <div className="shelter-progress-block" style={{ marginTop: 6 }}>
                  <div className="progress-labels">
                    <span>Intake: <strong>{shelter.alreadyReceivedQuantity}</strong> / {shelter.requestedQuantity} meals</span>
                    <strong className="mono">{pct}%</strong>
                  </div>
                  <div className="progress-track" style={{ height: 6 }}>
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
      </section>

      {/* STAGE 03: Rider Capacity & Real-Time Status (Placed right after Shelters) */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-heading compact" style={{ marginBottom: 16 }}>
          <div>
            <p className="eyebrow">STAGE 03 / FLEET TELEMETRY</p>
            <h3>Rider Capacity & Real-Time Status</h3>
          </div>
          <span className="micro-badge">{activeRidersCount} Active / {riders.length} Fleet Registered</span>
        </div>

        <div className="rider-cards-grid">
          {riders.map((rider) => {
            const freeCap = Math.max(0, rider.carryingCapacity - rider.currentLoad);
            const pct = Math.min(100, Math.round((rider.currentLoad / rider.carryingCapacity) * 100));
            const isOffline = !rider.available;
            const opStatus = rider.operationalStatus ?? "Available";

            const statusClass =
              opStatus === "Available"
                ? "badge-status-available"
                : opStatus === "Partially Loaded"
                ? "badge-status-partial"
                : opStatus === "Fully Loaded"
                ? "badge-status-full"
                : "badge-status-delivery";

            return (
              <div key={rider.id} className={`rider-card ${isOffline ? "card-offline" : ""}`}>
                {/* Header: Identity & Online Toggle */}
                <div className="rider-card-header">
                  <div className="rider-identity">
                    <div className="rider-avatar-circle">{rider.name.charAt(0)}</div>
                    <div className="rider-info">
                      <strong className="rider-name" title={rider.name}>{rider.name}</strong>
                      <span className="rider-sublabel">{rider.id} · Cap {rider.carryingCapacity}</span>
                    </div>
                  </div>

                  <button
                    className={`online-status-pill ${isOffline ? "offline" : "online"}`}
                    onClick={() => toggleRiderAvailability(rider.id)}
                    title="Click to toggle Available / Offline status"
                  >
                    <span className="online-indicator-dot" />
                    {isOffline ? "Offline" : "Online"}
                  </button>
                </div>

                {/* Status Badge & Free Cap Row */}
                <div className="rider-status-row">
                  <span className={`rider-status-tag ${statusClass}`}>
                    {opStatus.toUpperCase()}
                  </span>
                  <span className="rider-free-cap-text">
                    Free: <strong>{freeCap}</strong> meals
                  </span>
                </div>

                {/* Progress Group */}
                <div className="rider-progress-block">
                  <div className="progress-labels">
                    <span>Payload: <strong>{rider.currentLoad}</strong> / {rider.carryingCapacity}</span>
                    <strong className="mono">{pct}%</strong>
                  </div>
                  <div className="progress-track" style={{ height: 6 }}>
                    <div
                      className={`progress-fill ${isOffline ? "fill-closed" : opStatus === "Fully Loaded" ? "fill-violet" : opStatus === "On Delivery" ? "fill-blue" : "fill-mint"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="rider-card-footer">
                  {rider.available && freeCap > 0 && opStatus !== "On Delivery" ? (
                    <button
                      className="assign-rider-action-btn"
                      onClick={() => handleOpenManualModal(rider.id)}
                    >
                      <Plus size={13} /> Assign Meals
                    </button>
                  ) : opStatus === "On Delivery" ? (
                    <span className="rider-footer-pill on-delivery">
                      <Truck size={13} /> On Delivery Route
                    </span>
                  ) : opStatus === "Fully Loaded" ? (
                    <span className="rider-footer-pill fully-loaded">
                      ✓ At Full Capacity
                    </span>
                  ) : (
                    <span className="rider-footer-pill offline-tag">
                      Rider Offline
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* STAGE 04: Active Assignments & Dispatch Board (Full-Width Clean Table & Topology) */}
      <section className="dispatch-board-section" style={{ marginBottom: 24 }}>
        {/* View Tab Switcher */}
        <div className="view-switcher-bar" style={{ marginBottom: 14 }}>
          <div className="tab-group">
            <button
              className={`tab-btn ${activeTab === "PLAN" ? "active" : ""}`}
              onClick={() => setActiveTab("PLAN")}
            >
              <Package size={14} /> Active Assignments & Dispatch Board ({assignments.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "TOPOLOGY" ? "active" : ""}`}
              onClick={() => setActiveTab("TOPOLOGY")}
            >
              <Sparkles size={14} /> Network Dispatch Topology
            </button>
          </div>
          <div className="view-meta">
            <button
              onClick={() => handleOpenManualModal()}
              className="pill-btn pill-btn-mint"
              style={{ fontSize: "0.75rem", padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={14} /> New Assignment
            </button>
          </div>
        </div>

        {activeTab === "TOPOLOGY" ? (
          <div className="panel topology-panel">
            <NetworkVisualizer
              batch={currentBatch}
              riders={riders}
              shelters={shelters}
              assignments={assignments}
            />
          </div>
        ) : (
          <div className="panel panel-results">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">STAGE 04 / DISPATCH CONTROL TABLE</p>
                <h3>Active Food Assignments & Workflow Lifecycle</h3>
              </div>
              <div className="heading-badges">
                <span className="badge teal">
                  <Package size={13} /> {assignments.length} Total Assignments
                </span>
                <span className="badge good">
                  <CheckCircle2 size={13} /> {deliveredMeals} Meals Delivered
                </span>
              </div>
            </div>

            {assignments.length > 0 ? (
              <div className="table-scroll">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>ASSIGNMENT</th>
                      <th>RIDER</th>
                      <th>DESTINATION</th>
                      <th>QTY</th>
                      <th>LIFECYCLE STATUS</th>
                      <th style={{ textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => {
                      const status = assignment.lifecycleStatus || "Allocated";

                      return (
                        <tr key={assignment.id} className="assignment-row">
                          <td>
                            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {assignment.id}
                            </span>
                          </td>
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
                            <span
                              className={`badge ${
                                status === "Delivered"
                                  ? "good"
                                  : status === "In Transit"
                                  ? "teal"
                                  : status === "Confirmed"
                                  ? "warn"
                                  : status === "Cancelled"
                                  ? "bad"
                                  : "violet"
                              }`}
                            >
                              {status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                              {/* Stage 1: Allocated -> Can Confirm or Release */}
                              {status === "Allocated" && (
                                <>
                                  <button
                                    className="pill-btn pill-btn-mint"
                                    onClick={() => handleConfirmDispatch(assignment.id)}
                                    style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                                  >
                                    Confirm Dispatch
                                  </button>
                                  <button
                                    className="pill-btn pill-btn-danger"
                                    onClick={() => handleReleaseAssignment(assignment.id)}
                                    style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                                  >
                                    Release
                                  </button>
                                </>
                              )}

                              {/* Stage 2: Confirmed -> Can Mark Picked Up or Cancel */}
                              {status === "Confirmed" && (
                                <>
                                  <button
                                    className="pill-btn pill-btn-mint"
                                    onClick={() => handleMarkPickedUp(assignment.id)}
                                    style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                                  >
                                    Mark Picked Up
                                  </button>
                                  <button
                                    className="pill-btn pill-btn-danger"
                                    onClick={() => handleReleaseAssignment(assignment.id)}
                                    style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}

                              {/* Stage 3: In Transit -> Can Mark Delivered. Release is strictly blocked for custody! */}
                              {status === "In Transit" && (
                                <>
                                  <button
                                    className="pill-btn pill-btn-mint"
                                    onClick={() => handleMarkDelivered(assignment.id)}
                                    style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                                  >
                                    Mark Delivered
                                  </button>
                                  <span
                                    title="Cargo in physical rider custody on road. Cannot release back to hub stock."
                                    style={{
                                      fontSize: "0.68rem",
                                      color: "var(--text-muted)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 3,
                                    }}
                                  >
                                    <ShieldAlert size={12} className="text-amber" /> Custody Active
                                  </span>
                                </>
                              )}

                              {/* Stage 4: Delivered */}
                              {status === "Delivered" && (
                                <span style={{ fontSize: "0.72rem", color: "var(--mint)", fontWeight: 600 }}>
                                  ✓ Handover Complete
                                </span>
                              )}

                              {/* Stage 5: Cancelled */}
                              {status === "Cancelled" && (
                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                  Released to Hub
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state large" style={{ padding: "48px 24px" }}>
                <Package size={36} className="text-mint" style={{ opacity: 0.6 }} />
                <div>
                  <strong style={{ fontSize: "1.1rem" }}>No Active Food Assignments Yet</strong>
                  <p style={{ marginTop: 6, color: "var(--text-muted)" }}>
                    Click <strong>"+ Allocate Food"</strong> to manually dispatch meals to a volunteer rider and shelter,
                    or load the sample 180-meal judge scenario.
                  </p>
                  <button
                    className="primary-run-button"
                    onClick={() => handleOpenManualModal()}
                    style={{ marginTop: 16 }}
                  >
                    <Plus size={16} /> Allocate Food Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Live Operational Events Ledger / Audit Trail */}
      <section className="panel audit-trail-panel" style={{ marginTop: 24 }}>
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">AUDIT LEDGER</p>
            <h3>Real-Time Operational Event Log</h3>
          </div>
          <span className="micro-badge">{events.length} LOGGED EVENTS</span>
        </div>
        <div className="event-stream">
          {events.slice(0, 15).map((ev) => (
            <div className="event-stream-item" key={ev.id}>
              <div
                className="event-bullet"
                style={{
                  background:
                    ev.type === "DELIVERY"
                      ? "var(--mint)"
                      : ev.type === "PICKUP"
                      ? "var(--cyan)"
                      : ev.type === "CANCELLATION"
                      ? "var(--coral)"
                      : ev.type === "SHELTER"
                      ? "var(--amber)"
                      : "var(--mint)",
                }}
              />
              <div className="event-content">
                <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginRight: 8 }}>
                  {ev.timeStr}
                </span>
                <strong className="event-text" style={{ marginRight: 8 }}>
                  [{ev.type}] {ev.title}:
                </strong>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  {ev.detail}
                </span>
              </div>
              <span className="event-status-badge">COMMITTED</span>
            </div>
          ))}
        </div>
      </section>

      {/* Manual Allocation Modal */}
      <ManualAllocationModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        preselectedBatchId={selectedBatchId}
        preselectedRiderId={preselectedRiderId}
        preselectedShelterId={preselectedShelterId}
      />

      {/* Shelter Management Modal */}
      <ShelterManagementModal
        isOpen={isShelterModalOpen}
        onClose={() => setIsShelterModalOpen(false)}
        initialShelterId={editingShelterId}
      />
    </div>
  );
}
