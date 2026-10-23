import type { AllocationConfig, DonationBatch, Rider, Shelter, SimulationState, VolunteerReservation, ActiveDelivery } from "./types";

export const DEMO_NOW = Date.parse("2026-10-23T07:00:00.000Z");

export const initialConfig: AllocationConfig = {
  pickupMinutes: 12,
  handoverMinutes: 6,
  safetyBufferMinutes: 8,
  minSafetyMarginMinutes: 5,
  weights: {
    urgency: 0.35,
    feasibility: 0.25,
    expiryUrgency: 0.2,
    fairness: 0.1,
    reliability: 0.1,
  },
};

export const initialBatch: DonationBatch = {
  id: "BATCH-240",
  commodity: "cooked-meals",
  quantity: 180,
  alreadyAllocated: 0,
  preparedAt: DEMO_NOW - 15 * 60_000,
  safeUntil: DEMO_NOW + 75 * 60_000,
  pickupLocation: "AISSMS Community Kitchen",
  pickupMinutes: 12,
  requiredResources: [],
  availableResources: ["clean-water", "cooking-fuel", "cold-storage"],
  sealed: true,
};

export const availableBatches: DonationBatch[] = [
  initialBatch,
  {
    id: "BATCH-241",
    commodity: "ration-kit",
    quantity: 120,
    alreadyAllocated: 0,
    preparedAt: DEMO_NOW - 45 * 60_000,
    safeUntil: DEMO_NOW + 180 * 60_000,
    pickupLocation: "West Pune Civic Depot",
    pickupMinutes: 15,
    requiredResources: ["clean-water"],
    availableResources: ["clean-water", "cooking-fuel"],
    sealed: true,
  },
  {
    id: "BATCH-242",
    commodity: "produce",
    quantity: 65,
    alreadyAllocated: 0,
    preparedAt: DEMO_NOW - 10 * 60_000,
    safeUntil: DEMO_NOW + 45 * 60_000,
    pickupLocation: "Market Yard Organic Cold-Hub",
    pickupMinutes: 10,
    requiredResources: ["cold-storage"],
    availableResources: ["cold-storage"],
    sealed: true,
  },
];

export const initialRiders: Rider[] = [
  { id: "R1", name: "Maya Chen", carryingCapacity: 40, currentLoad: 0, available: true, approved: true, reliability: 0.96, pickedUpQuantity: 0 },
  { id: "R2", name: "Luis Ortiz", carryingCapacity: 40, currentLoad: 0, available: true, approved: true, reliability: 0.91, pickedUpQuantity: 0 },
  { id: "R3", name: "Asha Patel", carryingCapacity: 40, currentLoad: 0, available: true, approved: true, reliability: 0.94, pickedUpQuantity: 0 },
  { id: "R4", name: "Jordan Brooks", carryingCapacity: 40, currentLoad: 0, available: true, approved: true, reliability: 0.88, pickedUpQuantity: 0 },
  { id: "R5", name: "Samira Khan", carryingCapacity: 40, currentLoad: 0, available: true, approved: true, reliability: 0.9, pickedUpQuantity: 0 },
];

export const initialShelters: Shelter[] = [
  { id: "S1", name: "Hope Shelter", requestedQuantity: 50, alreadyReceivedQuantity: 0, capacity: 60, status: "open", compatibleCommodities: ["cooked-meals", "ration-kit", "produce"], requiredResources: [], travelMinutes: 12, handoverMinutes: 6, urgency: 0.92 },
  { id: "S2", name: "Sunrise Home", requestedQuantity: 45, alreadyReceivedQuantity: 0, capacity: 50, status: "open", compatibleCommodities: ["cooked-meals", "ration-kit"], requiredResources: [], travelMinutes: 18, handoverMinutes: 7, urgency: 0.86 },
  { id: "S3", name: "Community Kitchen", requestedQuantity: 35, alreadyReceivedQuantity: 0, capacity: 40, status: "open", compatibleCommodities: ["cooked-meals", "ration-kit", "produce"], requiredResources: ["clean-water"], travelMinutes: 15, handoverMinutes: 6, urgency: 0.76 },
  { id: "S4", name: "Green Haven", requestedQuantity: 30, alreadyReceivedQuantity: 0, capacity: 35, status: "open", compatibleCommodities: ["cooked-meals", "ration-kit"], requiredResources: [], travelMinutes: 22, handoverMinutes: 8, urgency: 0.69 },
  { id: "S5", name: "Care Point", requestedQuantity: 20, alreadyReceivedQuantity: 0, capacity: 25, status: "open", compatibleCommodities: ["cooked-meals", "ration-kit", "produce"], requiredResources: [], travelMinutes: 10, handoverMinutes: 5, urgency: 0.82 },
];

export function createInitialSimulation(): SimulationState {
  return {
    now: DEMO_NOW,
    batch: structuredClone(initialBatch),
    riders: structuredClone(initialRiders),
    shelters: structuredClone(initialShelters),
    config: structuredClone(initialConfig),
    events: ["System initialized. All deterministic safety gates active."],
    activeScenario: null,
  };
}

// Seed data for Ghost-Claim Recovery
export const initialReservations: VolunteerReservation[] = [
  {
    id: "RES-901",
    riderId: "R1",
    riderName: "Maya Chen",
    batchId: "BATCH-240",
    commodity: "cooked-meals",
    quantity: 40,
    reservedAt: DEMO_NOW - 12 * 60_000,
    timeoutMinutes: 15,
    custodyStatus: "RESERVED_UNPICKED",
    notes: "Claimed online; volunteer en-route to kitchen hub.",
  },
  {
    id: "RES-902",
    riderId: "R2",
    riderName: "Luis Ortiz",
    batchId: "BATCH-240",
    commodity: "cooked-meals",
    quantity: 40,
    reservedAt: DEMO_NOW - 25 * 60_000,
    pickedUpAt: DEMO_NOW - 10 * 60_000,
    timeoutMinutes: 15,
    custodyStatus: "IN_CUSTODY_PICKED_UP",
    notes: "Physical custody confirmed via QR scan. Active delivery.",
  },
  {
    id: "RES-903",
    riderId: "R3",
    riderName: "Asha Patel",
    batchId: "BATCH-240",
    commodity: "cooked-meals",
    quantity: 35,
    reservedAt: DEMO_NOW - 19 * 60_000,
    timeoutMinutes: 15,
    custodyStatus: "RESERVED_UNPICKED",
    notes: "Reservation window expired 4m ago without physical check-in.",
  },
  {
    id: "RES-904",
    riderId: "R4",
    riderName: "Jordan Brooks",
    batchId: "BATCH-240",
    commodity: "cooked-meals",
    quantity: 30,
    reservedAt: DEMO_NOW - 5 * 60_000,
    timeoutMinutes: 15,
    custodyStatus: "RESERVED_UNPICKED",
    notes: "Reservation active; 10m remaining on timeout clock.",
  },
  {
    id: "RES-905",
    riderId: "R5",
    riderName: "Samira Khan",
    batchId: "BATCH-240",
    commodity: "cooked-meals",
    quantity: 20,
    reservedAt: DEMO_NOW - 45 * 60_000,
    recoveredAt: DEMO_NOW - 28 * 60_000,
    timeoutMinutes: 15,
    custodyStatus: "RECOVERED",
    notes: "Volunteer missed slot; 20 meals returned to available inventory.",
  },
];

// Seed data for Mid-Route Rescue
export const initialDeliveries: ActiveDelivery[] = [
  {
    id: "DEL-401",
    riderId: "R1",
    riderName: "Maya Chen",
    batchId: "BATCH-240",
    commodity: "cooked-meals",
    quantity: 40,
    inCustody: true,
    pickedUpAt: DEMO_NOW - 15 * 60_000,
    safeUntil: DEMO_NOW + 60 * 60_000,
    currentLocationName: "JM Road Commercial Corridor",
    progressPercent: 55,
    originalShelterId: "S1",
    originalShelterName: "Hope Shelter",
    originalTravelMinutes: 12,
    status: "IN_TRANSIT",
  },
  {
    id: "DEL-402",
    riderId: "R2",
    riderName: "Luis Ortiz",
    batchId: "BATCH-240",
    commodity: "cooked-meals",
    quantity: 40,
    inCustody: true,
    pickedUpAt: DEMO_NOW - 20 * 60_000,
    safeUntil: DEMO_NOW + 55 * 60_000,
    currentLocationName: "Karve Road Metro Junction",
    progressPercent: 70,
    originalShelterId: "S2",
    originalShelterName: "Sunrise Home",
    originalTravelMinutes: 18,
    status: "IN_TRANSIT",
  },
  {
    id: "DEL-403",
    riderId: "R3",
    riderName: "Asha Patel",
    batchId: "BATCH-240",
    commodity: "cooked-meals",
    quantity: 35,
    inCustody: true,
    pickedUpAt: DEMO_NOW - 8 * 60_000,
    safeUntil: DEMO_NOW + 65 * 60_000,
    currentLocationName: "Shivaji Nagar Overpass",
    progressPercent: 25,
    originalShelterId: "S3",
    originalShelterName: "Community Kitchen",
    originalTravelMinutes: 15,
    status: "IN_TRANSIT",
  },
];

