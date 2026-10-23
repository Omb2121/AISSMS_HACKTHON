import React, { useState, useMemo } from "react";
import {
  X,
  Package,
  Bike,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useDispatchStore } from "./DispatchContext";

interface ManualAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBatchId?: string;
  preselectedRiderId?: string;
  preselectedShelterId?: string;
}

export const ManualAllocationModal: React.FC<ManualAllocationModalProps> = ({
  isOpen,
  onClose,
  preselectedBatchId,
  preselectedRiderId,
  preselectedShelterId,
}) => {
  const { batches, riders, shelters, allocateFood } = useDispatchStore();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    preselectedBatchId || batches[0]?.id || "BATCH-240",
  );
  const [selectedRiderId, setSelectedRiderId] = useState<string>(
    preselectedRiderId || riders.find((r) => r.available && r.currentLoad < r.carryingCapacity)?.id || riders[0]?.id || "R1",
  );
  const [selectedShelterId, setSelectedShelterId] = useState<string>(
    preselectedShelterId || shelters.find((s) => s.status === "open")?.id || shelters[0]?.id || "S1",
  );
  const [quantity, setQuantity] = useState<number>(40);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Selected Entities
  const selectedBatch = useMemo(() => batches.find((b) => b.id === selectedBatchId) ?? batches[0], [batches, selectedBatchId]);
  const selectedRider = useMemo(() => riders.find((r) => r.id === selectedRiderId) ?? riders[0], [riders, selectedRiderId]);
  const selectedShelter = useMemo(() => shelters.find((s) => s.id === selectedShelterId) ?? shelters[0], [shelters, selectedShelterId]);

  // Derived limits
  const batchAvailable = Math.max(0, (selectedBatch?.quantity ?? 0) - (selectedBatch?.alreadyAllocated ?? 0));
  const riderRemainingCap = Math.max(0, (selectedRider?.carryingCapacity ?? 0) - (selectedRider?.currentLoad ?? 0));
  const shelterUnmetDemand = Math.max(0, (selectedShelter?.requestedQuantity ?? 0) - (selectedShelter?.alreadyReceivedQuantity ?? 0));
  const isShelterClosed = selectedShelter?.status === "closed";

  const maxAllowedQuantity = Math.min(
    batchAvailable,
    riderRemainingCap,
    isShelterClosed ? 0 : shelterUnmetDemand,
  );

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (quantity <= 0) errors.push("Quantity must be greater than zero.");
    if (quantity > batchAvailable) errors.push(`Exceeds batch inventory (Only ${batchAvailable} meals available).`);
    if (quantity > riderRemainingCap) errors.push(`Exceeds rider remaining space (Rider can only carry ${riderRemainingCap} more meals).`);
    if (isShelterClosed) errors.push(`Destination ${selectedShelter?.name} is CLOSED to intake.`);
    if (quantity > shelterUnmetDemand) errors.push(`Exceeds shelter unmet demand (Only ${shelterUnmetDemand} meals needed).`);
    return errors;
  }, [quantity, batchAvailable, riderRemainingCap, isShelterClosed, shelterUnmetDemand, selectedShelter]);

  if (!isOpen) return null;

  const handleMaxClick = () => {
    if (maxAllowedQuantity > 0) {
      setQuantity(maxAllowedQuantity);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = allocateFood({
      batchId: selectedBatchId,
      riderId: selectedRiderId,
      shelterId: selectedShelterId,
      quantity,
    });

    if (res.success) {
      setFeedback({
        type: "success",
        message: `Successfully allocated ${quantity} meals to ${selectedRider?.name} for ${selectedShelter?.name}!`,
      });
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1200);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Failed to allocate food.",
      });
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="eyebrow">DISPATCH CONTROL</span>
            <h3>Manual Food Allocation & Rider Assignment</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {feedback && (
            <div className={`modal-feedback ${feedback.type === "success" ? "feedback-success" : "feedback-error"}`}>
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* 1. Select Food Batch */}
          <div className="form-group">
            <label className="form-label">
              <Package size={14} className="text-mint" /> 1. Select Food Batch
            </label>
            <div className="select-grid">
              {batches.map((b) => {
                const avail = b.quantity - b.alreadyAllocated;
                const isSelected = b.id === selectedBatchId;
                return (
                  <div
                    key={b.id}
                    className={`select-card ${isSelected ? "select-card-active" : ""}`}
                    onClick={() => {
                      setSelectedBatchId(b.id);
                      setFeedback(null);
                    }}
                  >
                    <div className="select-card-top">
                      <strong className="mono">{b.id}</strong>
                      <span className={`badge ${avail > 0 ? "good" : "bad"}`}>{avail} avail</span>
                    </div>
                    <small className="select-card-sub">
                      {b.commodity.replace("-", " ")} · Total {b.quantity}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Select Volunteer Rider */}
          <div className="form-group">
            <label className="form-label">
              <Bike size={14} className="text-violet" /> 2. Select Volunteer Rider
            </label>
            <div className="select-grid">
              {riders.map((r) => {
                const freeCap = r.carryingCapacity - r.currentLoad;
                const isSelected = r.id === selectedRiderId;
                const isOffline = !r.available;
                return (
                  <div
                    key={r.id}
                    className={`select-card ${isSelected ? "select-card-active" : ""} ${isOffline ? "select-card-disabled" : ""}`}
                    onClick={() => {
                      if (!isOffline) {
                        setSelectedRiderId(r.id);
                        setFeedback(null);
                      }
                    }}
                  >
                    <div className="select-card-top">
                      <strong>{r.name.split(" ")[0]} ({r.id})</strong>
                      <span className={`badge ${isOffline ? "bad" : freeCap === 0 ? "warn" : "good"}`}>
                        {isOffline ? "Offline" : `${freeCap} free`}
                      </span>
                    </div>
                    <small className="select-card-sub">
                      Load: {r.currentLoad}/{r.carryingCapacity} · {r.operationalStatus}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Select Destination Shelter */}
          <div className="form-group">
            <label className="form-label">
              <Building2 size={14} className="text-teal" /> 3. Select Destination Shelter
            </label>
            <div className="select-grid">
              {shelters.map((s) => {
                const unmet = Math.max(0, s.requestedQuantity - s.alreadyReceivedQuantity);
                const isSelected = s.id === selectedShelterId;
                const isClosed = s.status === "closed";
                return (
                  <div
                    key={s.id}
                    className={`select-card ${isSelected ? "select-card-active" : ""} ${isClosed ? "select-card-disabled" : ""}`}
                    onClick={() => {
                      setSelectedShelterId(s.id);
                      setFeedback(null);
                    }}
                  >
                    <div className="select-card-top">
                      <strong>{s.name}</strong>
                      <span className={`badge ${isClosed ? "bad" : unmet === 0 ? "warn" : "good"}`}>
                        {isClosed ? "Closed" : `${unmet} needed`}
                      </span>
                    </div>
                    <small className="select-card-sub">
                      {s.travelMinutes}m travel · Cap: {s.capacity}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Meal Quantity Input */}
          <div className="form-group">
            <div className="label-with-value">
              <label className="form-label">4. Meal Quantity to Allocate</label>
              <button type="button" className="max-qty-btn" onClick={handleMaxClick}>
                Max Safe Quantity: {maxAllowedQuantity}
              </button>
            </div>
            <div className="qty-input-row">
              <button
                type="button"
                className="qty-step-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 5))}
              >
                -5
              </button>
              <button
                type="button"
                className="qty-step-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -1
              </button>
              <input
                type="number"
                min="1"
                max="300"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="qty-numeric-input mono"
              />
              <button
                type="button"
                className="qty-step-btn"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +1
              </button>
              <button
                type="button"
                className="qty-step-btn"
                onClick={() => setQuantity((q) => q + 5)}
              >
                +5
              </button>
            </div>
          </div>

          {/* Live Validation Summary */}
          {validationErrors.length > 0 && (
            <div className="validation-error-box">
              <ShieldAlert size={15} className="text-coral" />
              <div>
                <strong>Allocation Blocked:</strong>
                <ul>
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="ghost-reset-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-run-button"
              disabled={validationErrors.length > 0}
              style={{ opacity: validationErrors.length > 0 ? 0.5 : 1, cursor: validationErrors.length > 0 ? "not-allowed" : "pointer" }}
            >
              <Sparkles size={15} /> Confirm & Allocate {quantity} Meals
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
