import { useState, useMemo } from "react";
import {
  Bike,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  TrendingUp,
  MapPin,
  Radio,
  Navigation,
} from "lucide-react";
import type { ActiveDelivery, Shelter, RescueCandidateShelter } from "./types";
import { initialDeliveries, initialShelters, DEMO_NOW } from "./seedData";

export function MidRouteRescueScreen() {
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>(() => structuredClone(initialDeliveries));
  const [shelters, setShelters] = useState<Shelter[]>(() => structuredClone(initialShelters));
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("DEL-401");
  const [events, setEvents] = useState<{ id: string; time: string; title: string; detail: string; type: "alert" | "success" | "reroute" }[]>([
    {
      id: "LOG-01",
      time: "07:10 UTC",
      title: "Deliveries Active on Road",
      detail: "3 volunteer riders in transit with physical custody. Safe-life monitored in real-time.",
      type: "success",
    },
  ]);

  // Selected delivery
  const selectedDelivery = useMemo(() => {
    return deliveries.find((d) => d.id === selectedDeliveryId) ?? deliveries[0];
  }, [deliveries, selectedDeliveryId]);

  // Evaluate alternative candidate shelters for the selected delivery
  const candidateEvaluations: RescueCandidateShelter[] = useMemo(() => {
    if (!selectedDelivery) return [];

    const safeLifeMinutesRemaining = Math.max(0, Math.round((selectedDelivery.safeUntil - DEMO_NOW) / 60_000));
    const safetyBuffer = 8; // minutes
    const handoverMinutes = 6; // minutes

    return shelters.map((shelter) => {
      // Distance and travel time estimation from current mid-route location
      const isOriginal = shelter.id === selectedDelivery.originalShelterId;
      // Simulated travel minutes from current vehicle location
      let travelMinutes = 12;
      if (shelter.id === "S1") travelMinutes = isOriginal ? 6 : 14;
      if (shelter.id === "S2") travelMinutes = isOriginal ? 8 : 16;
      if (shelter.id === "S3") travelMinutes = isOriginal ? 5 : 10;
      if (shelter.id === "S4") travelMinutes = 24; // further out
      if (shelter.id === "S5") travelMinutes = 35; // very far (triggers safe-life violation)

      const distanceKm = Math.round((travelMinutes * 0.45) * 10) / 10;
      const safeMarginMinutes = safeLifeMinutesRemaining - travelMinutes - handoverMinutes - safetyBuffer;
      const isClosed = shelter.status === "closed";
      const unmetDemand = Math.max(0, shelter.requestedQuantity - shelter.alreadyReceivedQuantity);
      const isDemandSatisfied = unmetDemand <= 0;

      let feasible = true;
      let rejectionReason = "";

      if (isClosed) {
        feasible = false;
        rejectionReason = "Shelter is closed to incoming dispatches.";
      } else if (isDemandSatisfied) {
        feasible = false;
        rejectionReason = "Shelter has zero unmet demand remaining.";
      } else if (safeMarginMinutes < 0) {
        feasible = false;
        rejectionReason = `Safe-life deadline would be violated (${Math.round(safeMarginMinutes)}m margin).`;
      }

      return {
        shelterId: shelter.id,
        shelterName: shelter.name,
        distanceKm,
        travelMinutes,
        unmetDemand,
        capacity: shelter.capacity,
        status: shelter.status,
        compatible: true,
        safeMarginMinutes,
        feasible,
        rejectionReason,
      };
    });
  }, [selectedDelivery, shelters]);

  // Eligible alternative candidates
  const feasibleCandidates = candidateEvaluations.filter((c) => c.feasible && c.shelterId !== selectedDelivery?.originalShelterId);

  // Simulate Rider Failure (e.g. flat tire / vehicle breakdown)
  const handleSimulateRiderFailure = () => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === selectedDelivery.id
          ? {
              ...d,
              status: "RIDER_BREAKDOWN",
              failureReason: `Mechanical vehicle breakdown at ${d.currentLocationName}. Volunteer cannot pedal further; custody secured.`,
            }
          : d,
      ),
    );

    setEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        time: new Date().toISOString().slice(11, 16) + " UTC",
        title: `Rider Breakdown: ${selectedDelivery.riderName} (${selectedDelivery.id})`,
        detail: `Vehicle failed mid-route at ${selectedDelivery.currentLocationName}. 40 meals in physical custody requiring alternate destination or backup rider.`,
        type: "alert",
      },
      ...prev,
    ]);
  };

  // Simulate Destination Shelter Closure
  const handleSimulateShelterClosure = () => {
    // Close the original shelter in state
    setShelters((prev) =>
      prev.map((s) => (s.id === selectedDelivery.originalShelterId ? { ...s, status: "closed" } : s)),
    );

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === selectedDelivery.id
          ? {
              ...d,
              status: "DESTINATION_CLOSED",
              failureReason: `Original destination (${d.originalShelterName}) locked intake due to facility emergency. In-transit cargo must be rerouted.`,
            }
          : d,
      ),
    );

    setEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        time: new Date().toISOString().slice(11, 16) + " UTC",
        title: `Destination Closed: ${selectedDelivery.originalShelterName}`,
        detail: `Emergency closure reported. ${selectedDelivery.quantity} meals in transit must be rescued to an alternative eligible shelter.`,
        type: "alert",
      },
      ...prev,
    ]);
  };

  // Simulate Route Disruption / Flash Gridlock
  const handleSimulateRouteDisruption = () => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === selectedDelivery.id
          ? {
              ...d,
              status: "ROUTE_DISRUPTED",
              safeUntil: d.safeUntil - 25 * 60_000, // drops safe life to critical
              failureReason: `Flash traffic hazard on primary corridor. Transit delay threatens safe-life margin. Rerouting required.`,
            }
          : d,
      ),
    );

    setEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        time: new Date().toISOString().slice(11, 16) + " UTC",
        title: `Corridor Hazard: ${selectedDelivery.currentLocationName}`,
        detail: `Route blocked. Safe-life margin dropped critically. Seeking closest alternative shelter.`,
        type: "alert",
      },
      ...prev,
    ]);
  };

  // Confirm Reroute to an Alternative Shelter
  const handleConfirmRescue = (candidate: RescueCandidateShelter) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === selectedDelivery.id
          ? {
              ...d,
              status: "REASSIGNED_FEASIBLE",
              rescueShelterId: candidate.shelterId,
              rescueShelterName: candidate.shelterName,
              rescueTravelMinutes: candidate.travelMinutes,
              failureReason: undefined,
            }
          : d,
      ),
    );

    // Update shelter demand
    setShelters((prev) =>
      prev.map((s) =>
        s.id === candidate.shelterId
          ? { ...s, alreadyReceivedQuantity: s.alreadyReceivedQuantity + selectedDelivery.quantity }
          : s,
      ),
    );

    setEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        time: new Date().toISOString().slice(11, 16) + " UTC",
        title: `Rescue Confirmed: Rerouted to ${candidate.shelterName}`,
        detail: `Cargo (${selectedDelivery.quantity} meals) safely re-assigned. Estimated arrival: ~${candidate.travelMinutes} mins with +${Math.round(candidate.safeMarginMinutes)}m safe-life buffer.`,
        type: "reroute",
      },
      ...prev,
    ]);
  };

  // Mark Delivery Unresolved when zero alternatives exist
  const handleMarkUnresolved = () => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === selectedDelivery.id
          ? {
              ...d,
              status: "UNRESOLVED_CRITICAL",
              unresolvedReason: "All nearby alternative shelters exceed remaining safe-life window or have zero demand. Dispatch coordinator intervention required.",
            }
          : d,
      ),
    );

    setEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        time: new Date().toISOString().slice(11, 16) + " UTC",
        title: `UNRESOLVED RESCUE: ${selectedDelivery.id}`,
        detail: `Zero safe shelters reachable within expiry window. Custody alert dispatched to supervisor.`,
        type: "alert",
      },
      ...prev,
    ]);
  };

  // Reset Rescue Simulation
  const handleResetRescue = () => {
    setDeliveries(structuredClone(initialDeliveries));
    setShelters(structuredClone(initialShelters));
    setEvents([
      {
        id: "LOG-INIT",
        time: "07:00 UTC",
        title: "Simulation Reset to Standard Dispatch",
        detail: "Restored initial delivery vectors and open shelter intake states.",
        type: "success",
      },
    ]);
  };

  const safeMinutes = Math.max(0, Math.round((selectedDelivery.safeUntil - DEMO_NOW) / 60_000));

  return (
    <div className="mid-route-rescue-workspace">
      {/* Header */}
      <div className="screen-header">
        <div>
          <div className="eyebrow">IN-TRANSIT CONTINGENCY · ZERO SPOILAGE</div>
          <h2>Mid-Route Rescue & Rerouting Command</h2>
          <p className="screen-description">
            Recover deliveries when volunteer riders face vehicle failure, roads are disrupted, or destination shelters
            close mid-route. Enforces the golden rule: Food in physical custody on the road is never dumped back to
            virtual stock.
          </p>
        </div>

        <div className="header-action-bar">
          <button className="ghost-reset-button" onClick={handleResetRescue}>
            <RotateCcw size={14} /> Reset Rescue Simulation
          </button>
        </div>
      </div>

      {/* Failure Injection Action Bar */}
      <section className="panel rescue-action-banner">
        <div className="action-banner-content">
          <div className="banner-title-group">
            <Radio size={16} className="text-amber pulse-icon" />
            <div>
              <strong>Inject Mid-Route Disruption on Selected Delivery ({selectedDelivery.id})</strong>
              <small>Simulates real-world incidents while rider is in transit</small>
            </div>
          </div>

          <div className="failure-buttons">
            <button
              className={`failure-btn ${selectedDelivery.status === "RIDER_BREAKDOWN" ? "active" : ""}`}
              onClick={handleSimulateRiderFailure}
            >
              <AlertTriangle size={14} /> Rider Breakdown
            </button>
            <button
              className={`failure-btn ${selectedDelivery.status === "DESTINATION_CLOSED" ? "active" : ""}`}
              onClick={handleSimulateShelterClosure}
            >
              <Building2 size={14} /> Shelter Closure
            </button>
            <button
              className={`failure-btn ${selectedDelivery.status === "ROUTE_DISRUPTED" ? "active" : ""}`}
              onClick={handleSimulateRouteDisruption}
            >
              <Navigation size={14} /> Route Disruption
            </button>
          </div>
        </div>
      </section>

      {/* Active Deliveries Fleet Carousel */}
      <section className="batches-section" style={{ padding: "18px 20px" }}>
        <div className="section-title-row">
          <div>
            <span className="eyebrow">ACTIVE MISSIONS</span>
            <h3>Deliveries In Transit ({deliveries.length})</h3>
          </div>
          <span className="micro-badge">SELECT MISSION TO MANAGE RESCUE</span>
        </div>

        <div className="batch-cards-grid">
          {deliveries.map((del) => {
            const isSelected = del.id === selectedDelivery.id;
            const delSafeMins = Math.max(0, Math.round((del.safeUntil - DEMO_NOW) / 60_000));
            const isEmergency = del.status === "RIDER_BREAKDOWN" || del.status === "DESTINATION_CLOSED" || del.status === "ROUTE_DISRUPTED" || del.status === "UNRESOLVED_CRITICAL";

            return (
              <div
                key={del.id}
                className={`batch-card ${isSelected ? "batch-card-active" : ""} ${isEmergency ? "card-emergency" : ""}`}
                onClick={() => setSelectedDeliveryId(del.id)}
              >
                <div className="batch-card-top">
                  <div className="batch-id-tag mono">{del.id}</div>
                  <span className={`badge ${delSafeMins > 25 ? "good" : "bad"}`}>
                    <Clock size={11} /> {delSafeMins}m safe window
                  </span>
                </div>

                <div className="batch-card-body">
                  <div className="batch-qty-row">
                    <strong className="batch-qty-num">{del.quantity}</strong>
                    <span className="batch-qty-label">meals in custody</span>
                  </div>

                  <div className="batch-meta-list">
                    <div className="meta-item">
                      <Bike size={12} className="text-mint" />
                      <span>{del.riderName} ({del.riderId})</span>
                    </div>
                    <div className="meta-item">
                      <MapPin size={12} className="text-muted" />
                      <span>At {del.currentLocationName}</span>
                    </div>
                    <div className="meta-item">
                      <Building2 size={12} className="text-muted" />
                      <span>Original Dest: {del.originalShelterName}</span>
                    </div>
                  </div>

                  <div className="progress-group" style={{ marginTop: 8 }}>
                    <div className="progress-labels">
                      <span>Transit Progress</span>
                      <strong className="mono">{del.progressPercent}%</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${isEmergency ? "fill-closed" : "fill-mint"}`}
                        style={{ width: `${del.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="batch-card-footer">
                  <span className="selection-indicator">
                    {del.status === "IN_TRANSIT" && "ON SCHEDULE"}
                    {del.status === "RIDER_BREAKDOWN" && "⚠ RIDER BREAKDOWN"}
                    {del.status === "DESTINATION_CLOSED" && "⚠ DESTINATION CLOSED"}
                    {del.status === "ROUTE_DISRUPTED" && "⚠ CORRIDOR HAZARD"}
                    {del.status === "REASSIGNED_FEASIBLE" && "✓ REROUTED SAFELY"}
                    {del.status === "UNRESOLVED_CRITICAL" && "✖ UNRESOLVED CRITICAL"}
                  </span>
                  <span className="pickup-time mono">
                    {del.status === "REASSIGNED_FEASIBLE" ? `→ ${del.rescueShelterName}` : `ETA ${del.originalTravelMinutes}m`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Split: Dynamic Route Visualizer & Alternative Dest Comparison */}
      <div className="workspace-layout">
        {/* Left Column: Route Topology & Rescue Evaluation */}
        <div className="results-column">
          {/* Active Mission Status Alert Card */}
          {selectedDelivery.status !== "IN_TRANSIT" && (
            <div className={`mission-alert-card ${selectedDelivery.status === "REASSIGNED_FEASIBLE" ? "alert-success" : "alert-danger"}`}>
              <div className="alert-header">
                <AlertTriangle size={18} />
                <div>
                  <strong>
                    {selectedDelivery.status === "REASSIGNED_FEASIBLE"
                      ? `Reroute Authorized to ${selectedDelivery.rescueShelterName}`
                      : `Incident Triggered: ${selectedDelivery.status.replace("_", " ")}`}
                  </strong>
                  <p>
                    {selectedDelivery.failureReason ??
                      `Mission safely rerouted. ${selectedDelivery.quantity} meals traveling to alternate destination.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alternative Destination Evaluation Table */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">CONTINGENCY MATRIX</p>
                <h3>Alternative Shelter Evaluator from Current Position</h3>
              </div>
              <span className="badge teal">
                {feasibleCandidates.length} Feasible Alternates
              </span>
            </div>

            <p className="panel-subtext">
              Real-time feasibility check calculated from <strong>{selectedDelivery.currentLocationName}</strong>.
              Routes exceeding safe-life margin ({safeMinutes}m safe window) are rejected automatically.
            </p>

            <div className="table-scroll">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>CANDIDATE SHELTER</th>
                    <th>DIST / TRAVEL</th>
                    <th>UNMET DEMAND</th>
                    <th>SAFE-LIFE MARGIN</th>
                    <th>STATUS</th>
                    <th>RESCUE ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateEvaluations.map((candidate) => {
                    const isOriginal = candidate.shelterId === selectedDelivery.originalShelterId;
                    const isSelectedRescue = candidate.shelterId === selectedDelivery.rescueShelterId;
                    const marginClass = candidate.safeMarginMinutes > 15 ? "margin-high" : candidate.safeMarginMinutes >= 5 ? "margin-medium" : "margin-low";

                    return (
                      <tr key={candidate.shelterId} className="assignment-row">
                        <td>
                          <div className="shelter-cell">
                            <strong className="shelter-name">
                              {candidate.shelterName} {isOriginal && <span className="mono" style={{ fontSize: 9, color: "#94a3b8" }}>(Original)</span>}
                            </strong>
                            <span className="shelter-route-subtext mono">{candidate.shelterId} · Cap {candidate.capacity}</span>
                          </div>
                        </td>

                        <td>
                          <div className="time-cell">
                            <span className="mono">{candidate.distanceKm} km</span>
                            <small className="time-eta">~{candidate.travelMinutes} mins travel</small>
                          </div>
                        </td>

                        <td>
                          <span className="mono" style={{ color: candidate.unmetDemand > 0 ? "#70f0be" : "#f87171" }}>
                            {candidate.unmetDemand} meals needed
                          </span>
                        </td>

                        <td>
                          <div className="margin-cell">
                            <span className={`safety-badge ${marginClass}`}>
                              {Math.round(candidate.safeMarginMinutes)}m margin
                            </span>
                          </div>
                        </td>

                        <td>
                          {candidate.feasible ? (
                            <span className="badge good">
                              <CheckCircle2 size={11} /> Feasible
                            </span>
                          ) : (
                            <span className="badge bad" title={candidate.rejectionReason}>
                              Blocked: {candidate.rejectionReason?.slice(0, 20)}...
                            </span>
                          )}
                        </td>

                        <td>
                          {isSelectedRescue ? (
                            <span className="mono text-mint">Rerouted Here ✓</span>
                          ) : candidate.feasible ? (
                            <button
                              className="action-btn-release"
                              onClick={() => handleConfirmRescue(candidate)}
                            >
                              Reroute Here
                            </button>
                          ) : (
                            <span className="mono text-muted" style={{ fontSize: 10 }}>
                              Unsafe Option
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {feasibleCandidates.length === 0 && selectedDelivery.status !== "REASSIGNED_FEASIBLE" && (
              <div className="empty-state inline" style={{ marginTop: 16 }}>
                <ShieldAlert size={18} className="text-coral" />
                <div style={{ flex: 1 }}>
                  <strong>Zero Feasible Destinations Reachable Within Safe Window</strong>
                  <p>All alternatives exceed the safe-life margin. Immediate supervisor resolution required.</p>
                </div>
                <button className="primary-run-button" style={{ background: "#ef4444", color: "#fff" }} onClick={handleMarkUnresolved}>
                  Flag Unresolved
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: In-Transit Custody Guard & Rescue Timeline */}
        <aside className="controls-column">
          {/* Active Cargo Custody Guard Card */}
          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">PHYSICAL CUSTODY PROTOCOL</p>
                <h3>Cargo Safeguard</h3>
              </div>
              <ShieldCheck size={16} className="text-mint" />
            </div>

            <div className="custody-card-body">
              <div className="custody-stat-row">
                <span>Rider In Possession:</span>
                <strong>{selectedDelivery.riderName}</strong>
              </div>
              <div className="custody-stat-row">
                <span>Physical Payload:</span>
                <strong className="text-mint">{selectedDelivery.quantity} Cooked Meals</strong>
              </div>
              <div className="custody-stat-row">
                <span>Safe-Life Expiry:</span>
                <strong className={safeMinutes < 20 ? "text-coral" : "text-mint"}>{safeMinutes} mins remaining</strong>
              </div>
              <div className="custody-stat-row">
                <span>Current Coordinates:</span>
                <strong>{selectedDelivery.currentLocationName}</strong>
              </div>

              <div className="golden-rule-banner">
                <ShieldAlert size={15} className="text-amber" />
                <p>
                  <strong>Golden Rule:</strong> Food on the road is physical inventory. It can only be delivered or
                  handed off to a rescue vehicle — never returned to kitchen inventory during a disruption.
                </p>
              </div>
            </div>
          </div>

          {/* Rescue Event Log */}
          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">MISSION TIMELINE</p>
                <h3>Incident & Rescue Log</h3>
              </div>
              <TrendingUp size={15} className="text-mint" />
            </div>

            <div className="event-stream" style={{ maxHeight: "380px", overflowY: "auto" }}>
              {events.map((ev) => (
                <div key={ev.id} className="event-stream-item">
                  <div className="event-bullet" />
                  <div className="event-content">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <strong style={{ color: ev.type === "alert" ? "#f87171" : "#70f0be", fontSize: 11 }}>
                        {ev.title}
                      </strong>
                      <span className="mono" style={{ fontSize: 9, color: "#94a3b8" }}>{ev.time}</span>
                    </div>
                    <span className="event-text">{ev.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
