import { useState, useMemo } from "react";
import {
  Clock,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Package,
  Users,
  ShieldCheck,
  ShieldAlert,
  History,
  TimerReset,
} from "lucide-react";
import type { VolunteerReservation, GhostRecoveryEvent, ReservationCustodyStatus } from "./types";
import { initialReservations, DEMO_NOW } from "./seedData";

export function GhostClaimRecoveryScreen() {
  const [simTime, setSimTime] = useState<number>(DEMO_NOW);
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(15);
  const [reservations, setReservations] = useState<VolunteerReservation[]>(() => structuredClone(initialReservations));
  const [events, setEvents] = useState<GhostRecoveryEvent[]>([
    {
      id: "EV-001",
      timestamp: DEMO_NOW - 28 * 60_000,
      reservationId: "RES-905",
      riderName: "Samira Khan",
      batchId: "BATCH-240",
      previousStatus: "EXPIRED_GHOST",
      newStatus: "RECOVERED",
      quantityRecovered: 20,
      reason: "Pickup timeout exceeded 15m; 20 unpicked meals safely returned to stock.",
    },
  ]);
  const [batchInventory, setBatchInventory] = useState<number>(180);

  // Compute live status of reservations based on current simTime & timeoutMinutes
  const processedReservations = useMemo(() => {
    return reservations.map((res) => {
      if (res.custodyStatus === "RECOVERED" || res.custodyStatus === "IN_CUSTODY_PICKED_UP") {
        return res;
      }

      // Check if unpicked reservation has exceeded timeout limit
      const elapsedMinutes = (simTime - res.reservedAt) / 60_000;
      if (elapsedMinutes > timeoutMinutes && res.custodyStatus === "RESERVED_UNPICKED") {
        return {
          ...res,
          custodyStatus: "EXPIRED_GHOST" as ReservationCustodyStatus,
        };
      }
      return res;
    });
  }, [reservations, simTime, timeoutMinutes]);

  // Advance time by X minutes
  const advanceTime = (minutes: number) => {
    const nextTime = simTime + minutes * 60_000;
    setSimTime(nextTime);

    // Detect newly expired ghost claims
    processedReservations.forEach((res) => {
      const elapsed = (nextTime - res.reservedAt) / 60_000;
      if (res.custodyStatus === "RESERVED_UNPICKED" && elapsed > timeoutMinutes) {
        const timeStr = new Date(nextTime).toISOString().slice(11, 16);
        setEvents((prev) => [
          {
            id: `EV-${Date.now()}-${res.id}`,
            timestamp: nextTime,
            reservationId: res.id,
            riderName: res.riderName,
            batchId: res.batchId,
            previousStatus: "RESERVED_UNPICKED",
            newStatus: "EXPIRED_GHOST",
            quantityRecovered: 0,
            reason: `${timeStr} · Volunteer missed pickup window (${Math.round(elapsed)}m elapsed vs ${timeoutMinutes}m limit). Flagged as GHOST CLAIM.`,
          },
          ...prev,
        ]);
      }
    });
  };

  // Recover an expired ghost claim
  const handleRecover = (resId: string) => {
    const target = processedReservations.find((r) => r.id === resId);
    if (!target) return;

    if (target.custodyStatus === "IN_CUSTODY_PICKED_UP") {
      alert("CRITICAL SAFETY BLOCK: Food is already in the rider's physical custody on the road. Cannot release back to kitchen hub. Use Mid-Route Rescue.");
      return;
    }

    if (target.custodyStatus === "RECOVERED") {
      return; // Already recovered, prevent double recovery
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, custodyStatus: "RECOVERED", recoveredAt: simTime } : r)),
    );

    setBatchInventory((curr) => curr + target.quantity);

    const timeStr = new Date(simTime).toISOString().slice(11, 16);
    setEvents((prev) => [
      {
        id: `EV-${Date.now()}-${target.id}`,
        timestamp: simTime,
        reservationId: target.id,
        riderName: target.riderName,
        batchId: target.batchId,
        previousStatus: target.custodyStatus,
        newStatus: "RECOVERED",
        quantityRecovered: target.quantity,
        reason: `${timeStr} · Successfully released ${target.quantity} uncollected meals from ${target.riderName} back to ${target.batchId} stock.`,
      },
      ...prev,
    ]);
  };

  // Recover all expired ghost claims in one click
  const handleRecoverAllExpired = () => {
    const expired = processedReservations.filter((r) => r.custodyStatus === "EXPIRED_GHOST");
    if (expired.length === 0) return;

    expired.forEach((target) => {
      handleRecover(target.id);
    });
  };

  // Simulate Ghost Claim: Add a volunteer who reserves but fails to arrive
  const handleSimulateGhostClaim = () => {
    const newRes: VolunteerReservation = {
      id: `RES-${Math.floor(100 + Math.random() * 900)}`,
      riderId: "R-SIM",
      riderName: "Simulated Volunteer",
      batchId: "BATCH-240",
      commodity: "cooked-meals",
      quantity: 25,
      reservedAt: simTime - (timeoutMinutes + 2) * 60_000, // already timed out
      timeoutMinutes,
      custodyStatus: "EXPIRED_GHOST",
      notes: "Simulated no-show: Claimed 25 meals but failed to scan pickup QR.",
    };

    setReservations((prev) => [newRes, ...prev]);

    const timeStr = new Date(simTime).toISOString().slice(11, 16);
    setEvents((prev) => [
      {
        id: `EV-${Date.now()}`,
        timestamp: simTime,
        reservationId: newRes.id,
        riderName: newRes.riderName,
        batchId: newRes.batchId,
        previousStatus: "RESERVED_UNPICKED",
        newStatus: "EXPIRED_GHOST",
        quantityRecovered: 0,
        reason: `${timeStr} · Injected simulated ghost claim for 25 meals. Pickup timeout elapsed without collection.`,
      },
      ...prev,
    ]);
  };

  // Reset Simulation
  const handleReset = () => {
    setSimTime(DEMO_NOW);
    setTimeoutMinutes(15);
    setReservations(structuredClone(initialReservations));
    setBatchInventory(180);
    setEvents([
      {
        id: "EV-INIT",
        timestamp: DEMO_NOW,
        reservationId: "SYSTEM",
        riderName: "System Dispatch",
        batchId: "BATCH-240",
        previousStatus: "RESERVED_UNPICKED",
        newStatus: "RECOVERED",
        quantityRecovered: 0,
        reason: "Reset simulation to initial baseline. Custody timers synchronized.",
      },
    ]);
  };

  // Metrics
  const activeUnpicked = processedReservations.filter((r) => r.custodyStatus === "RESERVED_UNPICKED");
  const inCustody = processedReservations.filter((r) => r.custodyStatus === "IN_CUSTODY_PICKED_UP");
  const ghostClaims = processedReservations.filter((r) => r.custodyStatus === "EXPIRED_GHOST");
  const totalRecoveredQty = events.reduce((sum, e) => sum + e.quantityRecovered, 0);

  return (
    <div className="ghost-recovery-workspace">
      {/* Screen Header */}
      <div className="screen-header">
        <div>
          <div className="eyebrow">INVENTORY SAFETY · CUSTODY GUARD</div>
          <h2>Ghost-Claim Detection & Recovery Engine</h2>
          <p className="screen-description">
            Detect volunteer reservations where inventory is claimed but never collected. Automatically release
            uncollected portions back to the kitchen hub without compromising in-transit food custody.
          </p>
        </div>

        <div className="header-action-bar">
          <button className="primary-run-button" onClick={handleSimulateGhostClaim}>
            <Zap size={15} /> Simulate Ghost Claim
          </button>
          <button className="ghost-reset-button" onClick={handleRecoverAllExpired}>
            <TimerReset size={15} /> Auto-Release Expired ({ghostClaims.length})
          </button>
          <button className="ghost-reset-button" onClick={handleReset}>
            <RotateCcw size={15} /> Reset Simulation
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <section className="metrics-row">
        <div className="metric-card metric-mint">
          <div className="metric-header">
            <span className="metric-label">AVAILABLE BATCH STOCK</span>
            <div className="metric-icon-wrap"><Package size={18} /></div>
          </div>
          <strong className="metric-value">{batchInventory}</strong>
          <div className="metric-footer">
            <small className="metric-subtext">Restored for safe allocation</small>
            <span className="metric-trend text-mint">+{totalRecoveredQty} recovered</span>
          </div>
        </div>

        <div className="metric-card metric-teal">
          <div className="metric-header">
            <span className="metric-label">IN-CUSTODY PICKED UP</span>
            <div className="metric-icon-wrap"><ShieldCheck size={18} /></div>
          </div>
          <strong className="metric-value">{inCustody.reduce((s, r) => s + r.quantity, 0)}</strong>
          <div className="metric-footer">
            <small className="metric-subtext">{inCustody.length} active on delivery routes</small>
            <span className="metric-trend">Custody Locked</span>
          </div>
        </div>

        <div className="metric-card metric-amber">
          <div className="metric-header">
            <span className="metric-label">EXPIRED GHOST CLAIMS</span>
            <div className="metric-icon-wrap"><AlertTriangle size={18} /></div>
          </div>
          <strong className="metric-value">{ghostClaims.reduce((s, r) => s + r.quantity, 0)}</strong>
          <div className="metric-footer">
            <small className="metric-subtext">{ghostClaims.length} uncollected reservations</small>
            <span className={`metric-trend ${ghostClaims.length > 0 ? "badge bad" : ""}`}>
              {ghostClaims.length > 0 ? "Action Required" : "Zero Leaks"}
            </span>
          </div>
        </div>

        <div className="metric-card metric-violet">
          <div className="metric-header">
            <span className="metric-label">UNPICKED RESERVATIONS</span>
            <div className="metric-icon-wrap"><Users size={18} /></div>
          </div>
          <strong className="metric-value">{activeUnpicked.reduce((s, r) => s + r.quantity, 0)}</strong>
          <div className="metric-footer">
            <small className="metric-subtext">{activeUnpicked.length} awaiting rider arrival</small>
            <span className="metric-trend">{timeoutMinutes}m timeout</span>
          </div>
        </div>
      </section>

      {/* Control Strip: Clock Advance & Timeout Setting */}
      <section className="panel clock-control-panel">
        <div className="clock-bar">
          <div className="clock-display">
            <Clock size={16} className="text-mint" />
            <div>
              <span className="clock-label">SIMULATION CLOCK:</span>
              <strong className="mono clock-time">
                {new Date(simTime).toISOString().slice(11, 19)} UTC
              </strong>
            </div>
            <span className="micro-badge">
              +{Math.round((simTime - DEMO_NOW) / 60_000)}m from baseline
            </span>
          </div>

          <div className="time-buttons-group">
            <span className="control-label">Advance Clock:</span>
            <button className="time-step-btn" onClick={() => advanceTime(5)}>+5 min</button>
            <button className="time-step-btn" onClick={() => advanceTime(10)}>+10 min</button>
            <button className="time-step-btn" onClick={() => advanceTime(15)}>+15 min (Timeout Window)</button>
            <button className="time-step-btn" onClick={() => advanceTime(30)}>+30 min</button>
          </div>

          <div className="timeout-slider-wrap">
            <div className="label-with-value">
              <span className="control-label">Timeout Threshold:</span>
              <strong className="mono val-badge">{timeoutMinutes}m</strong>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="5"
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
              className="custom-range mini-range"
            />
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout: Reservations Countdown Table vs Event Stream */}
      <div className="workspace-layout">
        {/* Left Column: Active Reservations Table */}
        <div className="results-column">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">MONITORED RESERVATIONS</p>
                <h3>Active Custody & Reservation Ledger</h3>
              </div>
              <div className="heading-badges">
                <span className="badge teal">
                  <Package size={13} /> {processedReservations.length} Tracked
                </span>
                {ghostClaims.length > 0 && (
                  <span className="badge bad">
                    <AlertTriangle size={13} /> {ghostClaims.length} Expired Ghost Claims
                  </span>
                )}
              </div>
            </div>

            <div className="table-scroll">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>VOLUNTEER RIDER</th>
                    <th>CLAIMED</th>
                    <th>RESERVED AT</th>
                    <th>TIMEOUT COUNTDOWN</th>
                    <th>CUSTODY STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {processedReservations.map((res) => {
                    const elapsedMinutes = (simTime - res.reservedAt) / 60_000;
                    const remainingMins = Math.max(0, timeoutMinutes - elapsedMinutes);
                    const isExpired = elapsedMinutes > timeoutMinutes && res.custodyStatus !== "IN_CUSTODY_PICKED_UP" && res.custodyStatus !== "RECOVERED";

                    return (
                      <tr key={res.id} className="assignment-row">
                        <td>
                          <div className="rider-cell">
                            <div className="rider-avatar">{res.riderName[0]}</div>
                            <div>
                              <strong className="rider-name">{res.riderName}</strong>
                              <span className="rider-id-badge mono">{res.id} · {res.riderId}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="qty-cell">
                            <strong className="qty-num">{res.quantity}</strong>
                            <small className="qty-unit">meals</small>
                          </div>
                        </td>

                        <td>
                          <span className="mono text-muted">
                            {new Date(res.reservedAt).toISOString().slice(11, 16)} UTC
                          </span>
                        </td>

                        <td>
                          {res.custodyStatus === "IN_CUSTODY_PICKED_UP" ? (
                            <span className="badge good">
                              <CheckCircle2 size={12} /> In Transit
                            </span>
                          ) : res.custodyStatus === "RECOVERED" ? (
                            <span className="badge teal">
                              Recovered to Stock
                            </span>
                          ) : isExpired ? (
                            <span className="badge bad">
                              <Clock size={12} /> Expired by {Math.round(elapsedMinutes - timeoutMinutes)}m
                            </span>
                          ) : (
                            <span className="badge warn">
                              <Clock size={12} /> {Math.ceil(remainingMins)}m remaining
                            </span>
                          )}
                        </td>

                        <td>
                          {res.custodyStatus === "RESERVED_UNPICKED" && !isExpired && (
                            <span className="status-chip ready">
                              <span className="pulse-dot" /> Awaiting Pickup
                            </span>
                          )}
                          {(res.custodyStatus === "EXPIRED_GHOST" || isExpired) && (
                            <span className="severity-tag critical">
                              GHOST CLAIM
                            </span>
                          )}
                          {res.custodyStatus === "IN_CUSTODY_PICKED_UP" && (
                            <span className="status-chip ready" style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}>
                              <ShieldCheck size={12} /> IN CUSTODY
                            </span>
                          )}
                          {res.custodyStatus === "RECOVERED" && (
                            <span className="severity-tag hard_gate" style={{ background: "rgba(112, 240, 190, 0.12)", color: "#70f0be" }}>
                              RECOVERED
                            </span>
                          )}
                        </td>

                        <td>
                          {isExpired && res.custodyStatus !== "RECOVERED" ? (
                            <button
                              className="action-btn-release"
                              onClick={() => handleRecover(res.id)}
                            >
                              Release {res.quantity} Meals
                            </button>
                          ) : res.custodyStatus === "IN_CUSTODY_PICKED_UP" ? (
                            <span className="mono text-muted" title="Food is already physically on the road. Cannot release back to kitchen.">
                              Protected
                            </span>
                          ) : res.custodyStatus === "RECOVERED" ? (
                            <span className="mono text-mint">
                              Restored ✓
                            </span>
                          ) : (
                            <span className="mono text-muted">
                              Active Slot
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Custody Safety Rules & Real-time Recovery Audit Ledger */}
        <aside className="controls-column">
          {/* Custody Rule Card */}
          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">CRITICAL CUSTODY GATES</p>
                <h3>Food Release Rules</h3>
              </div>
              <ShieldAlert size={16} className="text-amber" />
            </div>
            <div className="rules-list">
              <div className="rule-item">
                <span className="rule-num">01</span>
                <div>
                  <strong>Only Unpicked Parcels Can Return to Stock</strong>
                  <p>Once a volunteer marks custody via physical QR scan, meals cannot be returned to kitchen stock.</p>
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-num">02</span>
                <div>
                  <strong>Deterministic Timeout Clock</strong>
                  <p>Reservations uncollected past {timeoutMinutes}m automatically lapse to prevent stock black holes.</p>
                </div>
              </div>
              <div className="rule-item">
                <span className="rule-num">03</span>
                <div>
                  <strong>Immediate Re-allocation Eligibility</strong>
                  <p>Released quantities are instantly available in the Smart Batch Allocation pool.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Ledger */}
          <div className="panel">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">AUDIT TRAIL</p>
                <h3>Recovery Event Log</h3>
              </div>
              <History size={15} className="text-mint" />
            </div>

            <div className="event-stream" style={{ maxHeight: "360px", overflowY: "auto" }}>
              {events.map((ev) => (
                <div key={ev.id} className="event-stream-item">
                  <div className="event-bullet" />
                  <div className="event-content">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <strong className="mono" style={{ color: "#70f0be", fontSize: 10 }}>{ev.reservationId}</strong>
                      <span className="mono" style={{ fontSize: 9, color: "#94a3b8" }}>
                        {new Date(ev.timestamp).toISOString().slice(11, 19)} UTC
                      </span>
                    </div>
                    <span className="event-text">{ev.reason}</span>
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
