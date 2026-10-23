export type CommodityType = "cooked-meals" | "ration-kit" | "produce";
export type Resource = "clean-water" | "cooking-fuel" | "cold-storage";

export interface DonationBatch {
  id: string;
  commodity: CommodityType;
  quantity: number;
  alreadyAllocated: number;
  safeUntil: number;
  preparedAt: number;
  pickupLocation: string;
  pickupMinutes: number;
  requiredResources: Resource[];
  availableResources: Resource[];
  sealed: boolean;
}

export type RiderOperationalStatus = "Available" | "Partially Loaded" | "Fully Loaded" | "On Delivery";

export interface Rider {
  id: string;
  name: string;
  carryingCapacity: number;
  currentLoad: number;
  available: boolean;
  approved: boolean;
  reliability: number;
  pickedUpQuantity: number;
  operationalStatus?: RiderOperationalStatus;
  activeDeliveryId?: string | null;
}

export interface Shelter {
  id: string;
  name: string;
  requestedQuantity: number;
  alreadyReceivedQuantity: number;
  capacity: number;
  status: "open" | "closed";
  compatibleCommodities: CommodityType[];
  requiredResources: Resource[];
  travelMinutes: number;
  handoverMinutes: number;
  urgency: number;
}

export interface AllocationWeights {
  urgency: number;
  feasibility: number;
  expiryUrgency: number;
  fairness: number;
  reliability: number;
}

export interface AllocationConfig {
  pickupMinutes: number;
  handoverMinutes: number;
  safetyBufferMinutes: number;
  minSafetyMarginMinutes: number;
  weights: AllocationWeights;
}

export interface ScoreBreakdown {
  urgency: number;
  feasibility: number;
  expiryUrgency: number;
  fairness: number;
  reliability: number;
  total: number;
}

export interface CandidateEvaluation {
  riderId: string;
  shelterId: string;
  feasible: boolean;
  reasons: string[];
  completionMinutes: number;
  completionAt: number;
  safetyMarginMinutes: number;
  availableCapacity: number;
  unmetDemand: number;
  score?: ScoreBreakdown;
}

export interface AllocationAssignment {
  id: string;
  batchId: string;
  riderId: string;
  riderName: string;
  shelterId: string;
  shelterName: string;
  quantity: number;
  completionMinutes: number;
  completionAt: number;
  safetyMarginMinutes: number;
  score: ScoreBreakdown;
  status: "ready" | "blocked";
  lifecycleStatus?: "Allocated" | "Confirmed" | "In Transit" | "Delivered" | "Cancelled";
  explanation: string;
}

export interface RejectedCandidate extends CandidateEvaluation {
  explanation: string;
}

export interface UnallocatedInventory {
  quantity: number;
  reasons: string[];
}

export interface AllocationResult {
  assignments: AllocationAssignment[];
  allocatedQuantity: number;
  unallocatedQuantity: number;
  unallocatedInventory: UnallocatedInventory;
  rejectedCandidates: RejectedCandidate[];
  constraintViolations: string[];
  remainingDemand: Record<string, number>;
  remainingCapacity: Record<string, number>;
  eligibleShelterCount: number;
  availableRiderCount: number;
  averageScore: number;
  totalTravelMinutes: number;
}

export interface SimulationState {
  now: number;
  batch: DonationBatch;
  riders: Rider[];
  shelters: Shelter[];
  config: AllocationConfig;
  events: string[];
  activeScenario?: string | null;
}

// ==========================================
// GHOST-CLAIM RECOVERY TYPES
// ==========================================
export type ReservationCustodyStatus = 
  | "RESERVED_UNPICKED"
  | "IN_CUSTODY_PICKED_UP"
  | "EXPIRED_GHOST"
  | "RECOVERED";

export interface VolunteerReservation {
  id: string;
  riderId: string;
  riderName: string;
  batchId: string;
  commodity: CommodityType;
  quantity: number;
  reservedAt: number;
  timeoutMinutes: number;
  custodyStatus: ReservationCustodyStatus;
  pickedUpAt?: number;
  recoveredAt?: number;
  notes?: string;
}

export interface GhostRecoveryEvent {
  id: string;
  timestamp: number;
  reservationId: string;
  riderName: string;
  batchId: string;
  previousStatus: ReservationCustodyStatus;
  newStatus: ReservationCustodyStatus;
  quantityRecovered: number;
  reason: string;
}

// ==========================================
// MID-ROUTE RESCUE TYPES
// ==========================================
export type DeliveryRescueStatus = 
  | "IN_TRANSIT"
  | "RIDER_BREAKDOWN"
  | "DESTINATION_CLOSED"
  | "ROUTE_DISRUPTED"
  | "RESCUE_IN_PROGRESS"
  | "REASSIGNED_FEASIBLE"
  | "UNRESOLVED_CRITICAL"
  | "DELIVERED";

export interface ActiveDelivery {
  id: string;
  riderId: string;
  riderName: string;
  batchId: string;
  commodity: CommodityType;
  quantity: number;
  inCustody: boolean;
  pickedUpAt: number;
  safeUntil: number;
  currentLocationName: string;
  progressPercent: number;
  originalShelterId: string;
  originalShelterName: string;
  originalTravelMinutes: number;
  rescueShelterId?: string;
  rescueShelterName?: string;
  rescueRiderId?: string;
  rescueRiderName?: string;
  rescueTravelMinutes?: number;
  status: DeliveryRescueStatus;
  failureReason?: string;
  unresolvedReason?: string;
}

export interface RescueCandidateShelter {
  shelterId: string;
  shelterName: string;
  distanceKm: number;
  travelMinutes: number;
  unmetDemand: number;
  capacity: number;
  status: "open" | "closed";
  compatible: boolean;
  safeMarginMinutes: number;
  feasible: boolean;
  rejectionReason?: string;
}
