import { useState } from "react";
import { X, Building2, CheckCircle2, AlertTriangle, Clock, PlusCircle } from "lucide-react";
import { useDispatchStore } from "./DispatchContext";
import type { Shelter } from "./types";

interface ShelterManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShelterId?: string | null;
}

export function ShelterManagementModal({
  isOpen,
  onClose,
  initialShelterId,
}: ShelterManagementModalProps) {
  const { shelters, updateShelter, toggleShelterStatus, addShelter } = useDispatchStore();

  const [selectedShelterId, setSelectedShelterId] = useState<string>(
    initialShelterId || shelters[0]?.id || ""
  );
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Edit form state
  const currentShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  const [name, setName] = useState(currentShelter?.name || "");
  const [demand, setDemand] = useState(currentShelter?.requestedQuantity || 40);
  const [capacity, setCapacity] = useState(currentShelter?.capacity || 60);
  const [travelMinutes, setTravelMinutes] = useState(currentShelter?.travelMinutes || 15);
  const [handoverMinutes, setHandoverMinutes] = useState(currentShelter?.handoverMinutes || 10);
  const [status, setStatus] = useState<"open" | "closed">(currentShelter?.status || "open");

  // Keep form updated when switching shelter
  const handleSelectShelter = (s: Shelter) => {
    setIsAddingNew(false);
    setSelectedShelterId(s.id);
    setName(s.name);
    setDemand(s.requestedQuantity);
    setCapacity(s.capacity);
    setTravelMinutes(s.travelMinutes);
    setHandoverMinutes(s.handoverMinutes);
    setStatus(s.status);
  };

  const handleStartAddNew = () => {
    setIsAddingNew(true);
    setName("New Community Center");
    setDemand(40);
    setCapacity(50);
    setTravelMinutes(18);
    setHandoverMinutes(10);
    setStatus("open");
  };

  const handleSave = () => {
    if (isAddingNew) {
      const newShelter: Shelter = {
        id: `shelter-${Date.now()}`,
        name: name.trim() || "Community Shelter",
        requestedQuantity: Number(demand),
        alreadyReceivedQuantity: 0,
        capacity: Number(capacity),
        status,
        compatibleCommodities: ["cooked-meals", "produce", "ration-kit"],
        requiredResources: [],
        travelMinutes: Number(travelMinutes),
        handoverMinutes: Number(handoverMinutes),
        urgency: 0.8,
      };
      addShelter(newShelter);
      setIsAddingNew(false);
      setSelectedShelterId(newShelter.id);
    } else if (currentShelter) {
      updateShelter(currentShelter.id, {
        name,
        requestedQuantity: Number(demand),
        capacity: Number(capacity),
        travelMinutes: Number(travelMinutes),
        handoverMinutes: Number(handoverMinutes),
        status,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Building2 size={20} className="text-mint" />
            </div>
            <div>
              <h3>Shelter Destination Controls</h3>
              <p className="modal-subtitle">
                Manage destination demand, logistics timeframes, and intake operational status
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Shelter Selector Tabs */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              Select Active Shelter or Register New
            </span>
            <button
              onClick={handleStartAddNew}
              className={`pill-btn ${isAddingNew ? "pill-btn-active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", padding: "4px 10px" }}
            >
              <PlusCircle size={14} /> Add Shelter
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {shelters.map((s) => {
              const isSelected = !isAddingNew && s.id === selectedShelterId;
              const remaining = Math.max(0, s.requestedQuantity - s.alreadyReceivedQuantity);
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectShelter(s)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: isSelected ? "1px solid var(--mint)" : "1px solid var(--border-subtle)",
                    background: isSelected ? "rgba(112, 240, 190, 0.08)" : "var(--card-bg)",
                    color: isSelected ? "var(--mint)" : "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 3,
                    minWidth: 120,
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: isSelected ? "#fff" : "var(--text-primary)" }}>
                      {s.name.split(" ")[0]}
                    </span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "2px 5px",
                        borderRadius: 4,
                        background: s.status === "open" ? "rgba(112, 240, 190, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: s.status === "open" ? "var(--mint)" : "var(--coral)",
                        fontWeight: 700,
                      }}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Demand: {remaining} / {s.requestedQuantity}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Edit Body */}
        <div className="modal-body" style={{ padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Shelter Name */}
            <div className="control-group" style={{ gridColumn: "span 2" }}>
              <label className="input-label">Shelter Facility Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="custom-input"
                style={{
                  width: "100%",
                  background: "var(--surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  color: "#fff",
                }}
              />
            </div>

            {/* Requested Quantity (Demand) */}
            <div className="control-group">
              <label className="input-label">Requested Meal Demand</label>
              <input
                type="number"
                min="0"
                max="200"
                value={demand}
                onChange={(e) => setDemand(Math.max(0, Number(e.target.value)))}
                className="custom-input"
                style={{
                  width: "100%",
                  background: "var(--surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  color: "#fff",
                  fontFamily: "monospace",
                }}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Meals requested by shelter intake
              </span>
            </div>

            {/* Physical Storage Capacity */}
            <div className="control-group">
              <label className="input-label">Facility Storage Capacity</label>
              <input
                type="number"
                min="0"
                max="300"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(0, Number(e.target.value)))}
                className="custom-input"
                style={{
                  width: "100%",
                  background: "var(--surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  color: "#fff",
                  fontFamily: "monospace",
                }}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Max simultaneous meal capacity
              </span>
            </div>

            {/* Travel Time */}
            <div className="control-group">
              <label className="input-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={12} className="text-mint" /> Route Travel Time (min)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={travelMinutes}
                onChange={(e) => setTravelMinutes(Math.max(1, Number(e.target.value)))}
                className="custom-input"
                style={{
                  width: "100%",
                  background: "var(--surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  color: "#fff",
                  fontFamily: "monospace",
                }}
              />
            </div>

            {/* Handover Time */}
            <div className="control-group">
              <label className="input-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={12} className="text-mint" /> Handover Unloading (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={handoverMinutes}
                onChange={(e) => setHandoverMinutes(Math.max(1, Number(e.target.value)))}
                className="custom-input"
                style={{
                  width: "100%",
                  background: "var(--surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                  padding: "8px 12px",
                  borderRadius: 6,
                  color: "#fff",
                  fontFamily: "monospace",
                }}
              />
            </div>
          </div>

          {/* Operational Status Toggle */}
          <div
            style={{
              marginTop: 20,
              padding: 16,
              background: status === "open" ? "rgba(112, 240, 190, 0.05)" : "rgba(239, 68, 68, 0.08)",
              border: `1px solid ${status === "open" ? "rgba(112, 240, 190, 0.2)" : "rgba(239, 68, 68, 0.3)"}`,
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong style={{ display: "flex", alignItems: "center", gap: 8, color: status === "open" ? "var(--mint)" : "var(--coral)" }}>
                {status === "open" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                Intake Status: {status === "open" ? "OPEN & RECEIVING" : "CLOSED / HALTED"}
              </strong>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                {status === "open"
                  ? "Shelter accepts food allocations and dispatches."
                  : "New dispatches blocked. In-transit cargo triggers Mid-Route Rescue safeguard."}
              </p>
            </div>
            <button
              onClick={() => {
                const next = status === "open" ? "closed" : "open";
                setStatus(next);
                if (!isAddingNew && currentShelter) {
                  toggleShelterStatus(currentShelter.id);
                }
              }}
              className={`pill-btn ${status === "open" ? "pill-btn-danger" : "pill-btn-mint"}`}
              style={{ padding: "6px 14px", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}
            >
              {status === "open" ? "Close Shelter" : "Open Shelter"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
