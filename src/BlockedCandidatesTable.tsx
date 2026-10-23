import React, { useState, useMemo } from "react";
import type { RejectedCandidate, Rider, Shelter } from "./types";
import { Search, AlertTriangle, ShieldX, ChevronDown, ChevronUp, Info } from "lucide-react";

interface BlockedCandidatesTableProps {
  candidates: RejectedCandidate[];
  riders: Rider[];
  shelters: Shelter[];
}

export const BlockedCandidatesTable: React.FC<BlockedCandidatesTableProps> = ({
  candidates,
  riders,
  shelters,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const riderMap = useMemo(() => new Map(riders.map((r) => [r.id, r.name])), [riders]);
  const shelterMap = useMemo(() => new Map(shelters.map((s) => [s.id, s.name])), [shelters]);

  // Categorize candidate severity and type
  const enrichedCandidates = useMemo(() => {
    return candidates.map((c) => {
      let severity: "CRITICAL" | "HARD_GATE" | "RESOURCE" = "HARD_GATE";
      let category = "GENERAL";

      const joinedReasons = c.reasons.join(" ");

      if (joinedReasons.includes("safe-life buffer") || joinedReasons.includes("approved")) {
        severity = "CRITICAL";
        category = "EXPIRY_SAFETY";
      } else if (joinedReasons.includes("clean water") || joinedReasons.includes("fuel") || joinedReasons.includes("storage")) {
        severity = "RESOURCE";
        category = "RESOURCES";
      } else if (joinedReasons.includes("closed")) {
        severity = "HARD_GATE";
        category = "CLOSED";
      } else if (joinedReasons.includes("capacity") || joinedReasons.includes("demand is already satisfied")) {
        severity = "HARD_GATE";
        category = "CAPACITY";
      } else if (joinedReasons.includes("incompatible")) {
        severity = "HARD_GATE";
        category = "COMPATIBILITY";
      }

      return {
        ...c,
        id: `${c.riderId}-${c.shelterId}-${c.reasons[0]?.slice(0, 15)}`,
        riderName: riderMap.get(c.riderId) ?? c.riderId,
        shelterName: shelterMap.get(c.shelterId) ?? c.shelterId,
        severity,
        category,
      };
    });
  }, [candidates, riderMap, shelterMap]);

  // Filter and search
  const filteredCandidates = useMemo(() => {
    return enrichedCandidates.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.riderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shelterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.riderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shelterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reasons.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        selectedFilter === "ALL" ||
        (selectedFilter === "EXPIRY" && item.category === "EXPIRY_SAFETY") ||
        (selectedFilter === "CAPACITY" && item.category === "CAPACITY") ||
        (selectedFilter === "RESOURCES" && item.category === "RESOURCES") ||
        (selectedFilter === "CLOSED" && item.category === "CLOSED");

      return matchesSearch && matchesFilter;
    });
  }, [enrichedCandidates, searchQuery, selectedFilter]);

  const toggleExpand = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  return (
    <div className="panel blocked-candidates-panel">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow red-eyebrow">SAFETY AUDIT / STRICT REJECTIONS</p>
          <h3>Evaluated & Blocked Candidate Routes</h3>
        </div>
        <div className="badge bad">
          <ShieldX size={13} /> {filteredCandidates.length} Rejected Pairings
        </div>
      </div>

      <div className="table-controls">
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search rider, shelter, or constraint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-chips">
          <button
            className={`filter-chip ${selectedFilter === "ALL" ? "active" : ""}`}
            onClick={() => setSelectedFilter("ALL")}
          >
            All ({enrichedCandidates.length})
          </button>
          <button
            className={`filter-chip ${selectedFilter === "EXPIRY" ? "active" : ""}`}
            onClick={() => setSelectedFilter("EXPIRY")}
          >
            Expiry Buffer
          </button>
          <button
            className={`filter-chip ${selectedFilter === "CAPACITY" ? "active" : ""}`}
            onClick={() => setSelectedFilter("CAPACITY")}
          >
            Capacity / Saturation
          </button>
          <button
            className={`filter-chip ${selectedFilter === "RESOURCES" ? "active" : ""}`}
            onClick={() => setSelectedFilter("RESOURCES")}
          >
            Resources
          </button>
          <button
            className={`filter-chip ${selectedFilter === "CLOSED" ? "active" : ""}`}
            onClick={() => setSelectedFilter("CLOSED")}
          >
            Closed Dest
          </button>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="empty-state inline">
          <Info size={16} />
          <span>No rejected routes match the specified filters.</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="audit-table">
            <thead>
              <tr>
                <th>PAIRING (FROM → TO)</th>
                <th>PRIMARY VIOLATION</th>
                <th>SAFETY MARGIN</th>
                <th>SEVERITY</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.slice(0, 10).map((candidate) => {
                const isExpanded = expandedId === candidate.id;
                return (
                  <React.Fragment key={candidate.id}>
                    <tr
                      className={`audit-row ${isExpanded ? "expanded" : ""}`}
                      onClick={() => toggleExpand(candidate.id)}
                    >
                      <td>
                        <div className="pairing-cell">
                          <span className="mono-tag accent-mint">{candidate.riderId}</span>
                          <span className="pairing-arrow">→</span>
                          <span className="mono-tag accent-blue">{candidate.shelterId}</span>
                        </div>
                        <small className="cell-subtext">
                          {candidate.riderName} → {candidate.shelterName}
                        </small>
                      </td>
                      <td>
                        <span className="violation-text">{candidate.reasons[0]}</span>
                        {candidate.reasons.length > 1 && (
                          <span className="more-violations-pill">+{candidate.reasons.length - 1} more</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`margin-pill ${
                            candidate.safetyMarginMinutes < 0 ? "margin-negative" : "margin-low"
                          }`}
                        >
                          {Math.round(candidate.safetyMarginMinutes)} min
                        </span>
                      </td>
                      <td>
                        <span className={`severity-tag ${candidate.severity.toLowerCase()}`}>
                          {candidate.severity.replace("_", " ")}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button className="expand-btn" aria-label="Toggle details">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="expansion-row">
                        <td colSpan={5}>
                          <div className="expansion-card">
                            <div className="expansion-header">
                              <strong>Deterministic Safety Verification Log</strong>
                              <span className="mono">Est. Transit Duration: {candidate.completionMinutes} mins</span>
                            </div>
                            <ul className="violation-list">
                              {candidate.reasons.map((reason, idx) => (
                                <li key={idx} className="violation-item">
                                  <AlertTriangle size={13} className="text-coral" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="expansion-metrics">
                              <div className="exp-metric">
                                <span>Unmet Demand:</span>
                                <strong>{candidate.unmetDemand} meals</strong>
                              </div>
                              <div className="exp-metric">
                                <span>Rider Free Cap:</span>
                                <strong>{candidate.availableCapacity} meals</strong>
                              </div>
                              <div className="exp-metric">
                                <span>Estimated Completion:</span>
                                <strong>{new Date(candidate.completionAt).toISOString().slice(11, 16)} UTC</strong>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredCandidates.length > 10 && (
            <div className="table-footer-note">
              Showing top 10 of {filteredCandidates.length} evaluated pairings. Refine search or filter for deeper inspection.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
