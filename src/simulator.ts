import { allocateBatch } from "./allocator";
import { createInitialSimulation } from "./seedData";
import type { AllocationResult, SimulationState } from "./types";

export type SimulationAction = "close-shelter" | "disable-rider" | "critical-expiry" | "missing-resources" | "reset";

export function runSimulation(state: SimulationState): AllocationResult {
  return allocateBatch(state.batch, state.riders, state.shelters, state.now, state.config);
}

export function applySimulationAction(state: SimulationState, action: SimulationAction): SimulationState {
  if (action === "reset") return createInitialSimulation();
  const next = structuredClone(state);
  const timestamp = new Date(next.now).toISOString().slice(11, 16);

  next.activeScenario = action;
  if (action === "close-shelter") {
    const shelter = next.shelters.find((item) => item.status === "open");
    if (shelter) {
      shelter.status = "closed";
      next.events.unshift(`${timestamp} · [FAILURE TRIGGERED] ${shelter.name} closed unexpectedly. Rerouting all planned cargo to feasible alternative shelters.`);
    }
  }
  if (action === "disable-rider") {
    const rider = next.riders.find((item) => item.available);
    if (rider) {
      rider.available = false;
      next.events.unshift(`${timestamp} · [FAILURE TRIGGERED] ${rider.name} marked offline. Unpicked reservations released; custody safeguarded for in-transit parcels.`);
    }
  }
  if (action === "critical-expiry") {
    next.batch.safeUntil = next.now + 10 * 60_000;
    next.events.unshift(`${timestamp} · [CRITICAL EXPRY] Batch safe-life dropped to 10 minutes. Strict safety gate engaged; routes exceeding safe window are rejected.`);
  }
  if (action === "missing-resources") {
    next.batch.commodity = "ration-kit";
    next.batch.requiredResources = ["clean-water", "cooking-fuel"];
    next.batch.availableResources = [];
    next.events.unshift(`${timestamp} · [UTILITY FAILURE] Clean water and cooking fuel unavailable. Ration-kit routes rejected until resources restored.`);
  }
  return next;
}
