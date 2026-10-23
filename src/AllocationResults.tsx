import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Truck,
  Building2,
  Bike,
  Sparkles,
  TrendingUp,
  Check,
  Package,
} from "lucide-react";
import type { AllocationResult, DonationBatch, Rider, Shelter } from "./types";
import { BlockedCandidatesTable } from "./BlockedCandidatesTable";
import { NetworkVisualizer } from "./NetworkVisualizer";

interface AllocationResultsProps {
  result: AllocationResult;
  batch: DonationBatch;
  riders: Rider[];
  shelters: Shelter[];
  onSelectShelter?: (shelterId: string) => void;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

function scoreLabel(score: number) {
  return `${Math.round(score * 100)}%`;
}

export function AllocationResults({
  result,
  batch,
  riders,
  shelters,
}: AllocationResultsProps) {
  const [activeTab, setActiveTab] = useState<"PLAN" | "TOPOLOGY">("PLAN");
  const [hoveredScoreId, setHoveredScoreId] = useState<string | null>(null);

  // Group deliveries by destination for summary insights
  const totalAllocated = result.allocatedQuantity;
  const deliveryPct = Math.round((totalAllocated / Math.max(1, batch.quantity)) * 100);

  return (
    <section className="results-stack">
      {/* View Switcher Bar */}
      <div className="view-switcher-bar">
        <div className="tab-group">
          <button
            className={`tab-btn ${activeTab === "PLAN" ? "active" : ""}`}
            onClick={() => setActiveTab("PLAN")}
          >
            <Truck size={14} /> Feasible Delivery Plan ({result.assignments.length} Routes)
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
            {deliveryPct}% BATCH ASSIGNED
          </span>
        </div>
      </div>

      {activeTab === "TOPOLOGY" ? (
        <div className="panel topology-panel">
          <NetworkVisualizer
            batch={batch}
            riders={riders}
            shelters={shelters}
            assignments={result.assignments}
          />
        </div>
      ) : (
        /* Feasible Delivery Board */
        <div className="panel panel-results">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">02 / DISPATCH BOARD</p>
              <h3>Optimized Safe Delivery Plan</h3>
            </div>
            <div className="heading-badges">
              <span className="badge good">
                <CheckCircle2 size={13} /> {result.assignments.length} Routes Authorized
              </span>
              <span className="badge teal">
                <Package size={13} /> {result.allocatedQuantity} Meals Dispatched
              </span>
            </div>
          </div>

          {result.assignments.length > 0 ? (
            <div className="table-scroll">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>VOLUNTEER RIDER</th>
                    <th>DESTINATION SHELTER</th>
                    <th>QTY ALLOCATED</th>
                    <th>TRANSIT / ETA</th>
                    <th>SAFETY MARGIN</th>
                    <th>SCORE RANK</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {result.assignments.map((assignment) => {
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
                              <div className="rider-id-badge mono">{assignment.riderId}</div>
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
                              <Clock3 size={13} className="text-muted" />
                              <span className="mono">{assignment.completionMinutes} min</span>
                            </div>
                            <small className="time-eta">ETA {formatTime(assignment.completionAt)}</small>
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
                              <TrendingUp size={11} /> {scoreLabel(assignment.score.total)}
                            </span>
                          </div>
                          {isHovered && (
                            <div className="score-popover">
                              <div className="popover-title">5-Factor Scoring Breakdown</div>
                              <div className="popover-row">
                                <span>Urgency (35%)</span>
                                <strong>{scoreLabel(assignment.score.urgency)}</strong>
                              </div>
                              <div className="popover-row">
                                <span>Feasibility (25%)</span>
                                <strong>{scoreLabel(assignment.score.feasibility)}</strong>
                              </div>
                              <div className="popover-row">
                                <span>Expiry Urgency (20%)</span>
                                <strong>{scoreLabel(assignment.score.expiryUrgency)}</strong>
                              </div>
                              <div className="popover-row">
                                <span>Fairness (10%)</span>
                                <strong>{scoreLabel(assignment.score.fairness)}</strong>
                              </div>
                              <div className="popover-row">
                                <span>Reliability (10%)</span>
                                <strong>{scoreLabel(assignment.score.reliability)}</strong>
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
              <ShieldAlert size={32} className="text-coral" />
              <div>
                <strong>Zero Safe Routes Found</strong>
                <p>The engine refused every candidate to protect against critical safety or capacity violations.</p>
              </div>
            </div>
          )}

          {result.unallocatedQuantity > 0 && (
            <div className="warning-banner">
              <AlertTriangle size={18} className="text-amber" />
              <div className="banner-body">
                <strong>{result.unallocatedQuantity} Meals Held in Reserve</strong>
                <p>
                  {result.unallocatedInventory.reasons[0] ??
                    "Inventory preserved safely at kitchen hub; delivery constraints prevented forced drop-off."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delivery Progress Timeline */}
      <div className="panel timeline-panel">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">OPERATIONAL LIFECYCLE</p>
            <h3>Mission Execution Timeline</h3>
          </div>
          <span className="mono-tag">{batch.safeUntil ? Math.max(0, Math.round((batch.safeUntil - Date.now()) / 60000)) : 75}m safe window</span>
        </div>
        <div className="timeline-stages">
          <div className="stage active">
            <div className="stage-icon"><Check size={14} /></div>
            <div className="stage-info">
              <strong>T+00m · Safe-Life Verified</strong>
              <small>Hermetic seal checked & temperature approved</small>
            </div>
          </div>
          <div className="timeline-connector active" />
          <div className="stage active">
            <div className="stage-icon"><Bike size={14} /></div>
            <div className="stage-info">
              <strong>T+12m · Fleet Pickup</strong>
              <small>5 riders assigned & custody logged</small>
            </div>
          </div>
          <div className="timeline-connector active" />
          <div className="stage current">
            <div className="stage-icon"><Truck size={14} /></div>
            <div className="stage-info">
              <strong>T+24m–34m · Transit Corridor</strong>
              <small>Live GPS tracking & safe margin guardrails</small>
            </div>
          </div>
          <div className="timeline-connector" />
          <div className="stage">
            <div className="stage-icon"><Building2 size={14} /></div>
            <div className="stage-info">
              <strong>T+30m–40m · Verified Handover</strong>
              <small>Shelter receipt signed & inventory updated</small>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Split: Shelter Demand vs Fleet Capacity */}
      <div className="two-column-panels">
        {/* Shelter Demand Board */}
        <div className="panel cards-panel">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">03 / SHELTER NEED</p>
              <h3>Destinations & Unmet Demand</h3>
            </div>
            <span className="micro-badge">{result.eligibleShelterCount} Eligible</span>
          </div>

          <div className="cards-list">
            {shelters.map((shelter) => {
              const remaining = result.remainingDemand[shelter.id] ?? 0;
              const delivered = Math.max(
                0,
                Math.min(shelter.requestedQuantity, shelter.requestedQuantity - remaining - shelter.alreadyReceivedQuantity),
              );
              const percent = shelter.requestedQuantity === 0 ? 0 : Math.round((delivered / shelter.requestedQuantity) * 100);
              const isClosed = shelter.status === "closed";

              return (
                <div className={`card-item ${isClosed ? "card-closed" : ""}`} key={shelter.id}>
                  <div className="card-top-row">
                    <div className="card-identity">
                      <div className="building-icon-badge">
                        <Building2 size={15} />
                      </div>
                      <div>
                        <strong className="card-name">{shelter.name}</strong>
                        <div className="card-subtext">
                          {shelter.travelMinutes}m travel · Cap: {shelter.capacity} meals
                        </div>
                      </div>
                    </div>
                    <span className={`status-pill ${isClosed ? "pill-bad" : percent === 100 ? "pill-complete" : "pill-need"}`}>
                      {isClosed ? "Closed" : percent === 100 ? "Fulfilled" : `${remaining} Needed`}
                    </span>
                  </div>

                  <div className="progress-group">
                    <div className="progress-labels">
                      <span>Delivery Fulfillment</span>
                      <strong className="mono">{delivered} / {shelter.requestedQuantity} ({percent}%)</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${isClosed ? "fill-closed" : percent === 100 ? "fill-mint" : "fill-blue"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rider Fleet Board */}
        <div className="panel cards-panel">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">04 / FLEET CAPACITY</p>
              <h3>Volunteer Rider Payload</h3>
            </div>
            <span className="micro-badge">{result.availableRiderCount} Online</span>
          </div>

          <div className="cards-list">
            {riders.map((rider) => {
              const remaining = result.remainingCapacity[rider.id] ?? 0;
              const used = rider.carryingCapacity - remaining;
              const percent = Math.round((used / Math.max(1, rider.carryingCapacity)) * 100);
              const isOffline = !rider.available;

              return (
                <div className={`card-item ${isOffline ? "card-offline" : ""}`} key={rider.id}>
                  <div className="card-top-row">
                    <div className="card-identity">
                      <div className="rider-icon-badge">
                        <Bike size={15} />
                      </div>
                      <div>
                        <strong className="card-name">{rider.name}</strong>
                        <div className="card-subtext">
                          {rider.id} · Reliability {Math.round(rider.reliability * 100)}%
                        </div>
                      </div>
                    </div>
                    <span className={`status-pill ${isOffline ? "pill-bad" : percent === 100 ? "pill-full" : "pill-active"}`}>
                      {isOffline ? "Offline" : percent === 100 ? "Full Load" : `${remaining} Free`}
                    </span>
                  </div>

                  <div className="progress-group">
                    <div className="progress-labels">
                      <span>Carrying Load Utilization</span>
                      <strong className="mono">{used} / {rider.carryingCapacity} ({percent}%)</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${isOffline ? "fill-closed" : "fill-violet"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Safety Gates Rejections Table */}
      <BlockedCandidatesTable
        candidates={result.rejectedCandidates}
        riders={riders}
        shelters={shelters}
      />
    </section>
  );
}
