# ResQFlow — Dispatch OS
### Smart Batch Allocation, Ghost-Claim Recovery & Mid-Route Rescue Engine

**ResQFlow** is a civic-tech logistics platform engineered for surplus food rescue and perishable redistribution. It prevents food spoilage by deterministically routing donated meals across volunteer riders and shelters with strict safety gate enforcement.

---

## Key Modules & Features

### 1. Smart Batch Allocation Workspace
* **Deterministic Feasibility Engine:** Evaluates candidate pairings across donation batches, riders, and shelters.
* **Hard Safety Gates:**
  * Volunteer carrying capacity limits.
  * Shelter unmet demand caps: `max(0, requestedQuantity - alreadyReceivedQuantity)`.
  * Safe-life expiry buffer: `completionMinutes = pickupDuration + travelMinutes + handoverDuration`. Blocks routes where `safetyMarginMinutes < minSafetyMarginMinutes`.
  * Commodity compatibility & utility prerequisites (clean water, cooking fuel, cold storage).
* **Multi-Factor Ranking Formula:**
  $$\text{Score} = 0.35 \times \text{Urgency} + 0.25 \times \text{Feasibility} + 0.20 \times \text{Expiry} + 0.10 \times \text{Fairness} + 0.10 \times \text{Reliability}$$
* **Partial Batch Splitting:** Distributes large batches safely across multiple volunteer riders without over-allocation.
* **Interactive Batch Catalog:** Real-time safe-life countdowns, hermetic seal validation, and quantity tuning.

### 2. Ghost-Claim Recovery Engine
* **Purpose:** Detects reservations where volunteers claim food online but fail to collect within the designated window.
* **Custody Protection:** Never releases food already picked up on the road (`IN_CUSTODY_PICKED_UP`).
* **Deterministic Timeout:** Automatically expires unclaimed slots and returns food directly to the kitchen inventory for reallocation.
* **Simulation Clock:** Advance time by 5m, 10m, 15m, or 30m increments with instant auto-release capabilities.

### 3. Mid-Route Rescue Command
* **Purpose:** Recovers deliveries when a volunteer rider fails, a destination shelter closes, or a road corridor is disrupted after food pickup.
* **Golden Custody Rule:** Food in physical custody on the road is never dumped back into virtual inventory. It must be safely rerouted to an alternative eligible shelter.
* **Contingency Matrix:** Evaluates nearby alternative shelters by distance, travel time, unmet demand, and safe-life buffer.
* **Unresolved State Guard:** Explicitly flags deliveries requiring supervisor intervention when no alternative shelter can be safely reached.

### 4. Real-Time Topology & Safety Audit
* **Interactive SVG Topology Visualizer:** Visualizes origin kitchen hubs, volunteer riders, and shelter nodes with animated vector pulses.
* **Filterable Rejection Matrix:** Searchable safety audit table explaining every blocked pairing with severity tags (`CRITICAL`, `HARD_GATE`, `RESOURCE`).

---

## Tech Stack
* **Frontend:** React 19 + TypeScript + Vite
* **Styling:** Vanilla CSS with custom properties (`#07110F` dark forest green, `#70F0BE` mint accents, glassmorphic cards)
* **Icons:** Lucide React
* **Architecture:** Pure deterministic TypeScript allocation algorithms

---

## Quick Start Guide

### 1. Installation
```bash
git clone https://github.com/Omb2121/AISSMS_HACKTHON.git
cd AISSMS_HACKTHON
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Production Build & Validation
```bash
npm run build
```

---

## Project Structure
```
src/
├── types.ts                      # Core domain types & interfaces
├── seedData.ts                   # Demo scenarios, batches, riders, shelters
├── feasibility.ts                # Hard constraint evaluation logic
├── scoring.ts                    # Multi-factor normalized scoring formula
├── allocator.ts                  # Deterministic feasibility-first greedy algorithm
├── simulator.ts                  # Stress-test simulation triggers
├── SmartAllocationDashboard.tsx  # Executive command center
├── SmartBatchAllocationScreen.tsx# Dedicated batch allocation workspace
├── GhostClaimRecoveryScreen.tsx  # Ghost-claim recovery & custody clock
├── MidRouteRescueScreen.tsx      # Mid-route contingency & rescue rerouting
├── BlockedCandidatesTable.tsx    # Filterable safety gate audit table
├── NetworkVisualizer.tsx         # Real-time SVG topology visualizer
├── index.css                     # Design tokens & responsive styles
└── main.tsx                      # Application entry point
```

---

## License
MIT
