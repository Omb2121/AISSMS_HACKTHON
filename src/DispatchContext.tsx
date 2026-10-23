import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type {
  DonationBatch,
  Rider,
  Shelter,
  AllocationAssignment,
  VolunteerReservation,
  ActiveDelivery,
  RiderOperationalStatus,
} from "./types";
import {
  initialBatch,
  availableBatches,
  initialRiders,
  initialShelters,
  initialReservations,
  initialDeliveries,
  DEMO_NOW,
} from "./seedData";

export interface LoggedEvent {
  id: string;
  timestamp: number;
  timeStr: string;
  type: "ALLOCATION" | "DISPATCH" | "PICKUP" | "DELIVERY" | "CANCELLATION" | "RECOVERY" | "SHELTER" | "INFO";
  title: string;
  detail: string;
}

export interface ManualAllocateParams {
  batchId: string;
  riderId: string;
  shelterId: string;
  quantity: number;
}

interface DispatchContextType {
  // Entities
  batches: DonationBatch[];
  riders: Rider[];
  shelters: Shelter[];
  assignments: AllocationAssignment[];
  reservations: VolunteerReservation[];
  deliveries: ActiveDelivery[];
  events: LoggedEvent[];

  // Dynamic Live Counts
  totalDonated: number;
  availableInventory: number;
  reservedMeals: number;
  mealsWithRiders: number;
  deliveredMeals: number;
  unallocatedMeals: number;
  activeRidersCount: number;
  availableRidersCount: number;
  partiallyLoadedCount: number;
  fullyLoadedCount: number;
  openSheltersCount: number;
  remainingShelterDemand: number;

  // Actions
  allocateFood: (params: ManualAllocateParams) => { success: boolean; error?: string };
  confirmDispatch: (assignmentId: string) => { success: boolean; error?: string };
  markPickedUp: (assignmentId: string) => { success: boolean; error?: string };
  markDelivered: (assignmentId: string) => { success: boolean; error?: string };
  releaseAssignment: (assignmentId: string) => { success: boolean; error?: string };
  cancelAssignment: (assignmentId: string) => { success: boolean; error?: string };

  // Shelter Management
  updateShelter: (shelterId: string, updates: Partial<Shelter>) => void;
  toggleShelterStatus: (shelterId: string) => void;
  addShelter: (shelter: Shelter) => void;

  // Rider Management
  toggleRiderAvailability: (riderId: string) => void;

  // Scenarios & Reset
  loadSampleScenario: () => void;
  resetToBaseline: () => void;

  // Mid-Route & Ghost Claim updates
  recoverGhostClaim: (reservationId: string) => { success: boolean; error?: string };
  rerouteMidRouteDelivery: (deliveryId: string, newShelterId: string) => { success: boolean; error?: string };
}

const STORAGE_KEY = "resqflow_dispatch_state_v2";

const DispatchContext = createContext<DispatchContextType | undefined>(undefined);

// Helper to compute rider operational status from their actual load and active delivery status
export function computeRiderStatus(rider: Rider, hasInTransitDelivery: boolean): RiderOperationalStatus {
  if (hasInTransitDelivery || rider.pickedUpQuantity > 0) {
    return "On Delivery";
  }
  if (rider.currentLoad <= 0) {
    return "Available";
  }
  if (rider.currentLoad >= rider.carryingCapacity) {
    return "Fully Loaded";
  }
  return "Partially Loaded";
}

export const DispatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from localStorage if available, or fall back to baseline seed data
  const [batches, setBatches] = useState<DonationBatch[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_batches`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return structuredClone(availableBatches);
  });

  const [riders, setRiders] = useState<Rider[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_riders`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return structuredClone(initialRiders);
  });

  const [shelters, setShelters] = useState<Shelter[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_shelters`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return structuredClone(initialShelters);
  });

  const [assignments, setAssignments] = useState<AllocationAssignment[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_assignments`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [reservations, setReservations] = useState<VolunteerReservation[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_reservations`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return structuredClone(initialReservations);
  });

  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_deliveries`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return structuredClone(initialDeliveries);
  });

  const [events, setEvents] = useState<LoggedEvent[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_events`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: "INIT-01",
        timestamp: DEMO_NOW,
        timeStr: "07:00 UTC",
        type: "INFO",
        title: "System Initialized",
        detail: "Live dispatch engine online. Sample inventory ready for manual allocation.",
      },
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_batches`, JSON.stringify(batches));
      localStorage.setItem(`${STORAGE_KEY}_riders`, JSON.stringify(riders));
      localStorage.setItem(`${STORAGE_KEY}_shelters`, JSON.stringify(shelters));
      localStorage.setItem(`${STORAGE_KEY}_assignments`, JSON.stringify(assignments));
      localStorage.setItem(`${STORAGE_KEY}_reservations`, JSON.stringify(reservations));
      localStorage.setItem(`${STORAGE_KEY}_deliveries`, JSON.stringify(deliveries));
      localStorage.setItem(`${STORAGE_KEY}_events`, JSON.stringify(events.slice(0, 50)));
    } catch (e) {
      console.warn("Failed to save to localStorage:", e);
    }
  }, [batches, riders, shelters, assignments, reservations, deliveries, events]);

  // Compute live operational status for each rider
  const ridersWithOperationalStatus = useMemo(() => {
    return riders.map((rider) => {
      const hasInTransit = assignments.some(
        (a) => a.riderId === rider.id && (a.lifecycleStatus === "In Transit" || a.lifecycleStatus === "Confirmed"),
      );
      const status = computeRiderStatus(rider, hasInTransit);
      return {
        ...rider,
        operationalStatus: status,
      };
    });
  }, [riders, assignments]);

  // Derive dynamic live metrics accurately from actual state
  const totalDonated = useMemo(() => batches.reduce((sum, b) => sum + b.quantity, 0), [batches]);

  const availableInventory = useMemo(
    () => batches.reduce((sum, b) => sum + Math.max(0, b.quantity - b.alreadyAllocated), 0),
    [batches],
  );

  const reservedMeals = useMemo(() => {
    return assignments
      .filter((a) => a.lifecycleStatus === "Allocated" || a.lifecycleStatus === "Confirmed")
      .reduce((sum, a) => sum + a.quantity, 0);
  }, [assignments]);

  const mealsWithRiders = useMemo(() => {
    return assignments
      .filter((a) => a.lifecycleStatus === "In Transit")
      .reduce((sum, a) => sum + a.quantity, 0);
  }, [assignments]);

  const deliveredMeals = useMemo(() => {
    return assignments
      .filter((a) => a.lifecycleStatus === "Delivered")
      .reduce((sum, a) => sum + a.quantity, 0);
  }, [assignments]);

  const unallocatedMeals = availableInventory;

  const activeRidersCount = useMemo(() => {
    return ridersWithOperationalStatus.filter((r) => r.currentLoad > 0 || r.operationalStatus === "On Delivery").length;
  }, [ridersWithOperationalStatus]);

  const availableRidersCount = useMemo(() => {
    return ridersWithOperationalStatus.filter(
      (r) => r.available && r.currentLoad === 0 && r.operationalStatus === "Available",
    ).length;
  }, [ridersWithOperationalStatus]);

  const partiallyLoadedCount = useMemo(() => {
    return ridersWithOperationalStatus.filter(
      (r) => r.currentLoad > 0 && r.currentLoad < r.carryingCapacity && r.operationalStatus !== "On Delivery",
    ).length;
  }, [ridersWithOperationalStatus]);

  const fullyLoadedCount = useMemo(() => {
    return ridersWithOperationalStatus.filter(
      (r) => r.currentLoad >= r.carryingCapacity || r.operationalStatus === "Fully Loaded" || r.operationalStatus === "On Delivery",
    ).length;
  }, [ridersWithOperationalStatus]);

  const openSheltersCount = useMemo(() => shelters.filter((s) => s.status === "open").length, [shelters]);

  const remainingShelterDemand = useMemo(() => {
    return shelters
      .filter((s) => s.status === "open")
      .reduce((sum, s) => sum + Math.max(0, s.requestedQuantity - s.alreadyReceivedQuantity), 0);
  }, [shelters]);

  // Log Event Helper
  const logEvent = (
    type: LoggedEvent["type"],
    title: string,
    detail: string,
  ) => {
    const now = Date.now();
    const timeStr = new Date(now).toISOString().slice(11, 19) + " UTC";
    const newEvent: LoggedEvent = {
      id: `EV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      timeStr,
      type,
      title,
      detail,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  // 1. MANUAL FOOD ALLOCATION
  const allocateFood = (params: ManualAllocateParams) => {
    const { batchId, riderId, shelterId, quantity } = params;

    if (quantity <= 0) {
      return { success: false, error: "Allocation quantity must be greater than 0." };
    }

    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return { success: false, error: "Selected food batch does not exist." };

    const batchAvailable = batch.quantity - batch.alreadyAllocated;
    if (quantity > batchAvailable) {
      return {
        success: false,
        error: `Insufficient batch inventory. Requested: ${quantity}, Available: ${batchAvailable} meals.`,
      };
    }

    const rider = riders.find((r) => r.id === riderId);
    if (!rider) return { success: false, error: "Selected rider does not exist." };

    if (!rider.available) {
      return { success: false, error: `Rider ${rider.name} is currently marked Offline / Unavailable.` };
    }

    const riderRemainingCapacity = rider.carryingCapacity - rider.currentLoad;
    if (quantity > riderRemainingCapacity) {
      return {
        success: false,
        error: `Rider capacity exceeded. Requested: ${quantity}, Rider remaining space: ${riderRemainingCapacity} meals (Capacity: ${rider.carryingCapacity}).`,
      };
    }

    const shelter = shelters.find((s) => s.id === shelterId);
    if (!shelter) return { success: false, error: "Selected shelter does not exist." };

    if (shelter.status === "closed") {
      return { success: false, error: `Destination ${shelter.name} is currently CLOSED to intake.` };
    }

    const shelterUnmetDemand = Math.max(0, shelter.requestedQuantity - shelter.alreadyReceivedQuantity);
    if (shelterUnmetDemand <= 0) {
      return { success: false, error: `Destination ${shelter.name} demand is already fully satisfied.` };
    }

    if (quantity > shelterUnmetDemand) {
      return {
        success: false,
        error: `Requested quantity (${quantity}) exceeds shelter unmet demand (${shelterUnmetDemand}). Partial allocation up to ${shelterUnmetDemand} is supported.`,
      };
    }

    // Safety margin check: pickup (12) + travel + handover (6) vs safe-life
    const safeLifeMinutesRemaining = Math.max(0, (batch.safeUntil - DEMO_NOW) / 60_000);
    const completionMinutes = (batch.pickupMinutes ?? 12) + shelter.travelMinutes + Math.max(6, shelter.handoverMinutes);
    const safetyBuffer = 8;
    const safetyMarginMinutes = safeLifeMinutesRemaining - completionMinutes - safetyBuffer;

    if (safetyMarginMinutes < 5) {
      return {
        success: false,
        error: `Food safety gate violation: Delivery cannot complete inside safe-life buffer (Safety margin: ${Math.floor(safetyMarginMinutes)}m, Required: min 5m).`,
      };
    }

    // All validation passed: execute state updates
    // 1. Update batch allocated count
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, alreadyAllocated: b.alreadyAllocated + quantity } : b)),
    );

    // 2. Update rider load
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, currentLoad: r.currentLoad + quantity } : r)),
    );

    // 3. Create allocation assignment record
    const assignmentId = `ASG-${batchId}-${riderId}-${shelterId}-${Date.now().toString().slice(-4)}`;
    const newAssignment: AllocationAssignment = {
      id: assignmentId,
      batchId,
      riderId,
      riderName: rider.name,
      shelterId,
      shelterName: shelter.name,
      quantity,
      completionMinutes,
      completionAt: Date.now() + completionMinutes * 60_000,
      safetyMarginMinutes,
      status: "ready",
      lifecycleStatus: "Allocated",
      explanation: `Manual Allocation: ${quantity} meals assigned to ${rider.name} for ${shelter.name} (${Math.floor(safetyMarginMinutes)}m safe buffer).`,
      score: {
        urgency: shelter.urgency,
        feasibility: 0.9,
        expiryUrgency: 0.8,
        fairness: 0.85,
        reliability: rider.reliability,
        total: 0.88,
      },
    };

    setAssignments((prev) => [newAssignment, ...prev]);

    logEvent(
      "ALLOCATION",
      `Allocated: ${quantity} meals`,
      `Allocated ${quantity} meals from ${batchId} to rider ${rider.name} (${rider.id}) for destination ${shelter.name}.`,
    );

    return { success: true };
  };

  // 2. CONFIRM DISPATCH
  const confirmDispatch = (assignmentId: string) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (!target) return { success: false, error: "Assignment not found." };

    if (target.lifecycleStatus !== "Allocated") {
      return { success: false, error: `Cannot confirm assignment in '${target.lifecycleStatus}' status.` };
    }

    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, lifecycleStatus: "Confirmed" } : a)),
    );

    logEvent(
      "DISPATCH",
      `Dispatch Confirmed: ${target.id}`,
      `Dispatch confirmed for ${target.riderName} carrying ${target.quantity} meals to ${target.shelterName}. Awaiting pickup.`,
    );

    return { success: true };
  };

  // 3. MARK PICKED UP (Moves into physical transit)
  const markPickedUp = (assignmentId: string) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (!target) return { success: false, error: "Assignment not found." };

    if (target.lifecycleStatus !== "Confirmed" && target.lifecycleStatus !== "Allocated") {
      return { success: false, error: `Cannot pick up assignment in '${target.lifecycleStatus}' status.` };
    }

    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, lifecycleStatus: "In Transit" } : a)),
    );

    // Update rider picked up quantity & active delivery
    setRiders((prev) =>
      prev.map((r) =>
        r.id === target.riderId
          ? {
              ...r,
              pickedUpQuantity: r.pickedUpQuantity + target.quantity,
              activeDeliveryId: target.id,
            }
          : r,
      ),
    );

    // Add or update active road delivery for Mid-Route Rescue tracking
    const newDelivery: ActiveDelivery = {
      id: `DEL-${target.id}`,
      riderId: target.riderId,
      riderName: target.riderName,
      batchId: target.batchId,
      commodity: "cooked-meals",
      quantity: target.quantity,
      inCustody: true,
      pickedUpAt: Date.now(),
      safeUntil: target.completionAt + 45 * 60_000,
      currentLocationName: "Kitchen Dispatch Bay Corridor",
      progressPercent: 20,
      originalShelterId: target.shelterId,
      originalShelterName: target.shelterName,
      originalTravelMinutes: target.completionMinutes,
      status: "IN_TRANSIT",
    };

    setDeliveries((prev) => [newDelivery, ...prev]);

    logEvent(
      "PICKUP",
      `Cargo Picked Up: ${target.riderName}`,
      `${target.riderName} physically collected ${target.quantity} meals. Cargo in road custody on route to ${target.shelterName}.`,
    );

    return { success: true };
  };

  // 4. MARK DELIVERED (Completes mission, updates shelter demand & frees rider capacity)
  const markDelivered = (assignmentId: string) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (!target) return { success: false, error: "Assignment not found." };

    if (target.lifecycleStatus !== "In Transit") {
      return { success: false, error: `Only deliveries in transit can be marked delivered (Current: '${target.lifecycleStatus}').` };
    }

    // 1. Mark assignment delivered
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, lifecycleStatus: "Delivered" } : a)),
    );

    // 2. Shelter receives quantity
    setShelters((prev) =>
      prev.map((s) =>
        s.id === target.shelterId
          ? { ...s, alreadyReceivedQuantity: s.alreadyReceivedQuantity + target.quantity }
          : s,
      ),
    );

    // 3. Rider payload is cleared and rider becomes Available
    setRiders((prev) =>
      prev.map((r) =>
        r.id === target.riderId
          ? {
              ...r,
              currentLoad: Math.max(0, r.currentLoad - target.quantity),
              pickedUpQuantity: Math.max(0, r.pickedUpQuantity - target.quantity),
              activeDeliveryId: null,
            }
          : r,
      ),
    );

    // 4. Update delivery record
    setDeliveries((prev) =>
      prev.map((d) => (d.id === `DEL-${target.id}` ? { ...d, status: "DELIVERED", progressPercent: 100 } : d)),
    );

    logEvent(
      "DELIVERY",
      `Delivered: ${target.quantity} meals to ${target.shelterName}`,
      `Handover verified at ${target.shelterName}. Rider ${target.riderName} capacity released and is now Available.`,
    );

    return { success: true };
  };

  // 5. RELEASE / CANCEL ASSIGNMENT (Only before pickup!)
  const releaseAssignment = (assignmentId: string) => {
    const target = assignments.find((a) => a.id === assignmentId);
    if (!target) return { success: false, error: "Assignment not found." };

    if (target.lifecycleStatus === "In Transit") {
      return {
        success: false,
        error: "CRITICAL SAFETY GATE: Cargo is already in rider's physical possession on the road. Cannot release back to inventory. Use Mid-Route Rescue to reroute.",
      };
    }

    if (target.lifecycleStatus === "Delivered" || target.lifecycleStatus === "Cancelled") {
      return { success: false, error: `Assignment already '${target.lifecycleStatus}'.` };
    }

    // Return inventory to batch
    setBatches((prev) =>
      prev.map((b) =>
        b.id === target.batchId
          ? { ...b, alreadyAllocated: Math.max(0, b.alreadyAllocated - target.quantity) }
          : b,
      ),
    );

    // Release rider load
    setRiders((prev) =>
      prev.map((r) =>
        r.id === target.riderId
          ? { ...r, currentLoad: Math.max(0, r.currentLoad - target.quantity) }
          : r,
      ),
    );

    // Mark assignment cancelled
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, lifecycleStatus: "Cancelled" } : a)),
    );

    logEvent(
      "CANCELLATION",
      `Assignment Cancelled: ${target.id}`,
      `Released ${target.quantity} meals from ${target.riderName} back to batch inventory. Rider capacity freed.`,
    );

    return { success: true };
  };

  const cancelAssignment = releaseAssignment;

  // 6. SHELTER MANAGEMENT
  const updateShelter = (shelterId: string, updates: Partial<Shelter>) => {
    setShelters((prev) =>
      prev.map((s) => (s.id === shelterId ? { ...s, ...updates } : s)),
    );
    const target = shelters.find((s) => s.id === shelterId);
    logEvent(
      "SHELTER",
      `Shelter Updated: ${target?.name ?? shelterId}`,
      `Updated parameters: ${Object.keys(updates).join(", ")}.`,
    );
  };

  const toggleShelterStatus = (shelterId: string) => {
    const target = shelters.find((s) => s.id === shelterId);
    if (!target) return;

    const nextStatus = target.status === "open" ? "closed" : "open";
    setShelters((prev) =>
      prev.map((s) => (s.id === shelterId ? { ...s, status: nextStatus } : s)),
    );

    // If closing, check if there are in-transit deliveries to this shelter!
    if (nextStatus === "closed") {
      const activeInTransit = assignments.filter(
        (a) => a.shelterId === shelterId && a.lifecycleStatus === "In Transit",
      );
      if (activeInTransit.length > 0) {
        logEvent(
          "SHELTER",
          `Shelter Closed Mid-Route: ${target.name}`,
          `${activeInTransit.length} delivery currently in transit to closed shelter. Cargo custody protected — Mid-Route Rescue activated.`,
        );
      } else {
        logEvent("SHELTER", `Shelter Closed: ${target.name}`, "Shelter closed. No new assignments can be made.");
      }
    } else {
      logEvent("SHELTER", `Shelter Reopened: ${target.name}`, "Shelter opened. Available for food dispatches.");
    }
  };

  const addShelter = (newShelter: Shelter) => {
    setShelters((prev) => [...prev, newShelter]);
    logEvent(
      "SHELTER",
      `New Shelter Registered: ${newShelter.name}`,
      `Registered with demand: ${newShelter.requestedQuantity}, capacity: ${newShelter.capacity}.`,
    );
  };

  // 7. RIDER MANAGEMENT
  const toggleRiderAvailability = (riderId: string) => {
    const target = riders.find((r) => r.id === riderId);
    if (!target) return;

    const nextAvailable = !target.available;
    setRiders((prev) =>
      prev.map((r) => (r.id === riderId ? { ...r, available: nextAvailable } : r)),
    );

    logEvent(
      "INFO",
      `Rider Status Toggled: ${target.name}`,
      `Volunteer rider marked as ${nextAvailable ? "Available" : "Offline / Inactive"}.`,
    );
  };

  // 8. GHOST CLAIM RECOVERY
  const recoverGhostClaim = (reservationId: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return { success: false, error: "Reservation not found." };

    if (res.custodyStatus === "IN_CUSTODY_PICKED_UP") {
      return {
        success: false,
        error: "Food is physically with rider. Cannot release back to kitchen hub. Use Mid-Route Rescue.",
      };
    }

    if (res.custodyStatus === "RECOVERED") {
      return { success: false, error: "Reservation already recovered." };
    }

    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, custodyStatus: "RECOVERED" } : r)),
    );

    // Increase batch available inventory
    setBatches((prev) =>
      prev.map((b) =>
        b.id === res.batchId
          ? { ...b, alreadyAllocated: Math.max(0, b.alreadyAllocated - res.quantity) }
          : b,
      ),
    );

    logEvent(
      "RECOVERY",
      `Ghost Claim Recovered: ${res.id}`,
      `Released ${res.quantity} uncollected meals from ${res.riderName} back to batch inventory.`,
    );

    return { success: true };
  };

  // 9. MID-ROUTE RESCUE REROUTE
  const rerouteMidRouteDelivery = (deliveryId: string, newShelterId: string) => {
    const del = deliveries.find((d) => d.id === deliveryId);
    if (!del) return { success: false, error: "Delivery not found." };

    const newShelter = shelters.find((s) => s.id === newShelterId);
    if (!newShelter || newShelter.status === "closed") {
      return { success: false, error: "Candidate rescue shelter is closed or invalid." };
    }

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              rescueShelterId: newShelter.id,
              rescueShelterName: newShelter.name,
              status: "REASSIGNED_FEASIBLE",
            }
          : d,
      ),
    );

    // Also update assignment if matching
    setAssignments((prev) =>
      prev.map((a) =>
        `DEL-${a.id}` === deliveryId
          ? { ...a, shelterId: newShelter.id, shelterName: newShelter.name }
          : a,
      ),
    );

    logEvent(
      "DISPATCH",
      `Mid-Route Rescue Confirmed`,
      `Rerouted cargo (${del.quantity} meals) from ${del.originalShelterName} to ${newShelter.name}.`,
    );

    return { success: true };
  };

  // 10. LOAD SAMPLE SCENARIO
  const loadSampleScenario = () => {
    // 180 meals, 5 riders (40 cap each), 5 shelters
    setBatches([
      {
        ...structuredClone(initialBatch),
        quantity: 180,
        alreadyAllocated: 0,
      },
    ]);
    setRiders(
      structuredClone(initialRiders).map((r) => ({
        ...r,
        carryingCapacity: 40,
        currentLoad: 0,
        available: true,
        pickedUpQuantity: 0,
        activeDeliveryId: null,
      })),
    );
    setShelters(structuredClone(initialShelters));
    setAssignments([]);
    setReservations(structuredClone(initialReservations));
    setDeliveries(structuredClone(initialDeliveries));

    logEvent(
      "INFO",
      "Sample Scenario Loaded for Judges",
      "Loaded baseline: 180 meals batch, 5 riders (40 cap each), 5 shelters. Ready for manual step-by-step testing.",
    );
  };

  // 11. RESET
  const resetToBaseline = () => {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_batches`);
      localStorage.removeItem(`${STORAGE_KEY}_riders`);
      localStorage.removeItem(`${STORAGE_KEY}_shelters`);
      localStorage.removeItem(`${STORAGE_KEY}_assignments`);
      localStorage.removeItem(`${STORAGE_KEY}_reservations`);
      localStorage.removeItem(`${STORAGE_KEY}_deliveries`);
      localStorage.removeItem(`${STORAGE_KEY}_events`);
    } catch {
      // ignore
    }
    loadSampleScenario();
  };

  return (
    <DispatchContext.Provider
      value={{
        batches,
        riders: ridersWithOperationalStatus,
        shelters,
        assignments,
        reservations,
        deliveries,
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

        allocateFood,
        confirmDispatch,
        markPickedUp,
        markDelivered,
        releaseAssignment,
        cancelAssignment,

        updateShelter,
        toggleShelterStatus,
        addShelter,

        toggleRiderAvailability,

        loadSampleScenario,
        resetToBaseline,

        recoverGhostClaim,
        rerouteMidRouteDelivery,
      }}
    >
      {children}
    </DispatchContext.Provider>
  );
};

export const useDispatchStore = () => {
  const context = useContext(DispatchContext);
  if (!context) {
    throw new Error("useDispatchStore must be used within a DispatchProvider");
  }
  return context;
};
