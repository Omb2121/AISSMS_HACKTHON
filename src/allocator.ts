import { evaluateCandidate, getRiderCapacity, getUnmetDemand } from "./feasibility";
import { scoreCandidate } from "./scoring";
import type { AllocationConfig, AllocationAssignment, AllocationResult, DonationBatch, RejectedCandidate, Rider, Shelter } from "./types";

const reasonKey = (reasons: string[]) => reasons.join("|");

export function allocateBatch(
  batch: DonationBatch,
  riders: Rider[],
  shelters: Shelter[],
  now: number,
  config: AllocationConfig,
): AllocationResult {
  let remainingQuantity = Math.max(0, batch.quantity - batch.alreadyAllocated);
  const remainingDemand = new Map(shelters.map((shelter) => [shelter.id, getUnmetDemand(shelter)]));
  const remainingCapacity = new Map(riders.map((rider) => [rider.id, getRiderCapacity(rider)]));
  const assignments: AllocationAssignment[] = [];
  const rejectedCandidates: RejectedCandidate[] = [];
  const constraintViolations = new Set<string>();
  const candidateKeys = new Set<string>();
  const maxSafeLifeMinutes = Math.max(1, (batch.safeUntil - now) / 60_000);

  const recordRejected = (candidate: RejectedCandidate) => {
    const key = `${candidate.riderId}:${candidate.shelterId}:${reasonKey(candidate.reasons)}`;
    if (!candidateKeys.has(key)) {
      candidateKeys.add(key);
      rejectedCandidates.push(candidate);
      candidate.reasons.forEach((reason) => constraintViolations.add(reason));
    }
  };

  const getCandidates = () => riders.flatMap((rider) => shelters.map((shelter) => {
    const evaluation = evaluateCandidate(
      batch,
      { ...rider, currentLoad: rider.carryingCapacity - (remainingCapacity.get(rider.id) ?? 0) },
      { ...shelter, alreadyReceivedQuantity: shelter.requestedQuantity - (remainingDemand.get(shelter.id) ?? 0) },
      now,
      config,
    );
    if (!evaluation.feasible) {
      recordRejected({ ...evaluation, explanation: evaluation.reasons.join(" ") });
      return null;
    }
    const score = scoreCandidate(evaluation, rider, shelter, config, maxSafeLifeMinutes);
    return { evaluation, score, rider, shelter };
  }).filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null));

  while (remainingQuantity > 0) {
    const candidates = getCandidates()
      .filter(({ rider, shelter }) => (remainingCapacity.get(rider.id) ?? 0) > 0 && (remainingDemand.get(shelter.id) ?? 0) > 0)
      .sort((a, b) => b.score.total - a.score.total || a.rider.id.localeCompare(b.rider.id) || a.shelter.id.localeCompare(b.shelter.id));
    const selected = candidates[0];
    if (!selected) break;

    const riderCapacity = remainingCapacity.get(selected.rider.id) ?? 0;
    const shelterDemand = remainingDemand.get(selected.shelter.id) ?? 0;
    const quantity = Math.min(remainingQuantity, riderCapacity, shelterDemand);
    if (quantity <= 0) break;

    assignments.push({
      id: `${batch.id}-${selected.rider.id}-${selected.shelter.id}-${assignments.length + 1}`,
      batchId: batch.id,
      riderId: selected.rider.id,
      riderName: selected.rider.name,
      shelterId: selected.shelter.id,
      shelterName: selected.shelter.name,
      quantity,
      completionMinutes: selected.evaluation.completionMinutes,
      completionAt: selected.evaluation.completionAt,
      safetyMarginMinutes: selected.evaluation.safetyMarginMinutes,
      score: selected.score,
      status: "ready",
      explanation: `Feasible: ${quantity} meals fit rider capacity and ${selected.shelter.name}'s unmet demand, with ${Math.floor(selected.evaluation.safetyMarginMinutes)} minutes of safety margin.`,
    });
    remainingQuantity -= quantity;
    remainingCapacity.set(selected.rider.id, riderCapacity - quantity);
    remainingDemand.set(selected.shelter.id, shelterDemand - quantity);
  }

  const finalCandidates = getCandidates();
  if (remainingQuantity > 0) {
    if (!shelters.some((shelter) => shelter.status === "open" && (remainingDemand.get(shelter.id) ?? 0) > 0)) {
      constraintViolations.add("All eligible shelter demand is satisfied; extra inventory cannot be forced into deliveries.");
    }
    if (!riders.some((rider) => rider.available && rider.approved && (remainingCapacity.get(rider.id) ?? 0) > 0)) {
      constraintViolations.add("No approved rider capacity remains for the unallocated inventory.");
    }
    if (finalCandidates.length === 0 && rejectedCandidates.length > 0) {
      constraintViolations.add("Every remaining rider-to-shelter route violates at least one hard safety or feasibility constraint.");
    }
  }

  const unallocatedReasons = Array.from(constraintViolations);
  if (remainingQuantity > 0 && unallocatedReasons.length === 0) unallocatedReasons.push("No deterministic feasible assignment remained.");
  const averageScore = assignments.length === 0 ? 0 : assignments.reduce((total, assignment) => total + assignment.score.total, 0) / assignments.length;

  return {
    assignments,
    allocatedQuantity: Math.max(0, batch.quantity - batch.alreadyAllocated) - remainingQuantity,
    unallocatedQuantity: remainingQuantity,
    unallocatedInventory: { quantity: remainingQuantity, reasons: unallocatedReasons },
    rejectedCandidates,
    constraintViolations: unallocatedReasons,
    remainingDemand: Object.fromEntries(remainingDemand),
    remainingCapacity: Object.fromEntries(remainingCapacity),
    eligibleShelterCount: shelters.filter((shelter) => shelter.status === "open" && getUnmetDemand(shelter) > 0).length,
    availableRiderCount: riders.filter((rider) => rider.available && rider.approved && getRiderCapacity(rider) > 0).length,
    averageScore,
    totalTravelMinutes: assignments.reduce((total, assignment) => total + assignment.completionMinutes, 0),
  };
}
