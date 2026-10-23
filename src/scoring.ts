import type { AllocationConfig, CandidateEvaluation, Rider, Shelter, ScoreBreakdown } from "./types";
import { getRiderCapacity, getUnmetDemand } from "./feasibility";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function scoreCandidate(
  candidate: CandidateEvaluation,
  rider: Rider,
  shelter: Shelter,
  config: AllocationConfig,
  maxSafeLifeMinutes: number,
): ScoreBreakdown {
  const urgency = clamp((shelter.urgency + getUnmetDemand(shelter) / Math.max(1, shelter.capacity)) / 2);
  const feasibility = clamp(Math.min(1, candidate.availableCapacity / Math.max(1, getUnmetDemand(shelter))) * 0.7 + clamp(candidate.safetyMarginMinutes / Math.max(1, maxSafeLifeMinutes)) * 0.3);
  const expiryUrgency = clamp(1 - candidate.safetyMarginMinutes / Math.max(1, maxSafeLifeMinutes));
  const fairness = clamp(1 - getRiderCapacity(rider) / Math.max(1, rider.carryingCapacity));
  const reliability = clamp(rider.reliability);
  const total = clamp(
    config.weights.urgency * urgency +
      config.weights.feasibility * feasibility +
      config.weights.expiryUrgency * expiryUrgency +
      config.weights.fairness * fairness +
      config.weights.reliability * reliability,
  );

  return { urgency, feasibility, expiryUrgency, fairness, reliability, total };
}
