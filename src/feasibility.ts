import type { AllocationConfig, CandidateEvaluation, DonationBatch, Rider, Shelter } from "./types";

function hasAllResources(available: string[], required: string[]) {
  return required.every((resource) => available.includes(resource));
}

export function getUnmetDemand(shelter: Shelter) {
  return Math.max(0, Math.min(shelter.capacity, shelter.requestedQuantity) - shelter.alreadyReceivedQuantity);
}

export function getRiderCapacity(rider: Rider) {
  return Math.max(0, rider.carryingCapacity - rider.currentLoad);
}

export function evaluateCandidate(
  batch: DonationBatch,
  rider: Rider,
  shelter: Shelter,
  now: number,
  config: AllocationConfig,
): CandidateEvaluation {
  const pickupDuration = batch.pickupMinutes > 0 ? batch.pickupMinutes : config.pickupMinutes;
  const handoverDuration = Math.max(config.handoverMinutes, shelter.handoverMinutes);
  const completionMinutes = pickupDuration + shelter.travelMinutes + handoverDuration;
  const completionAt = now + completionMinutes * 60_000;
  const safeLifeMinutes = Math.max(0, (batch.safeUntil - now) / 60_000);
  const safetyMarginMinutes = safeLifeMinutes - completionMinutes - config.safetyBufferMinutes;
  const availableCapacity = getRiderCapacity(rider);
  const unmetDemand = getUnmetDemand(shelter);
  const reasons: string[] = [];

  if (batch.quantity <= batch.alreadyAllocated) reasons.push("Batch has no remaining inventory.");
  if (!batch.sealed) reasons.push("Food seal or packaging validation failed.");
  if (!rider.available) reasons.push("Volunteer is unavailable.");
  if (!rider.approved) reasons.push("Volunteer is not safety-approved.");
  if (availableCapacity <= 0) reasons.push("Rider has no carrying capacity remaining.");
  if (shelter.status !== "open") reasons.push("Shelter is closed to new assignments.");
  if (unmetDemand <= 0) reasons.push("Shelter demand is already satisfied.");
  if (!shelter.compatibleCommodities.includes(batch.commodity)) reasons.push("Commodity is incompatible with this shelter.");
  if (!hasAllResources(batch.availableResources, [...batch.requiredResources, ...shelter.requiredResources])) {
    reasons.push("Required clean water, cooking fuel, or storage resources are unavailable.");
  }
  if (safetyMarginMinutes < config.minSafetyMarginMinutes) {
    reasons.push(`Delivery cannot finish inside the safe-life buffer (${Math.max(0, Math.floor(safetyMarginMinutes))} min margin).`);
  }

  return {
    riderId: rider.id,
    shelterId: shelter.id,
    feasible: reasons.length === 0,
    reasons,
    completionMinutes,
    completionAt,
    safetyMarginMinutes,
    availableCapacity,
    unmetDemand,
  };
}
