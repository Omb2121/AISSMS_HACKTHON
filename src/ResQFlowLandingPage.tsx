import React, { useEffect, useRef } from "react";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Package,
  Users,
  Building2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Radio,
  CheckCircle2,
  ChevronDown,
  Navigation,
  Compass,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ResQFlowNetwork3D } from "./ResQFlowNetwork3D";
import { useDispatchStore } from "./DispatchContext";

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onEnterDashboard: () => void;
}

export const ResQFlowLandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  const {
    totalDonated,
    availableInventory,
    activeRidersCount,
    openSheltersCount,
    remainingShelterDemand,
  } = useDispatchStore();

  const heroRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const quoteRef = useRef<HTMLDivElement | null>(null);
  const ctaGroupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".landing-nav", {
        y: -40,
        opacity: 0,
        duration: 0.9,
      })
        .from(
          ".hero-eyebrow-pill",
          {
            scale: 0.85,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          headlineRef.current,
          {
            y: 35,
            opacity: 0,
            duration: 1.0,
          },
          "-=0.4"
        )
        .from(
          subtitleRef.current,
          {
            y: 25,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          quoteRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          ctaGroupRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.4"
        )
        .from(
          ".hero-telemetry-bar",
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.3"
        );

      // Scroll Trigger Animations for Feature Cards
      gsap.utils.toArray<HTMLElement>(".reveal-card").forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          y: 40,
          opacity: 0,
          duration: 0.85,
          ease: "power2.out",
        });
      });

      // Section Headers Reveal
      gsap.utils.toArray<HTMLElement>(".section-reveal-header").forEach((header) => {
        gsap.from(header, {
          scrollTrigger: {
            trigger: header,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      });
    });

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-root">
      {/* Dynamic Background Noise / Gradient */}
      <div className="landing-ambient-backdrop" />

      {/* Top Navbar */}
      <header className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="landing-brand-icon">
              <Sparkles size={18} className="text-mint animate-pulse" />
            </div>
            <div>
              <div className="landing-brand-title">
                ResQFlow <span className="brand-dot" />
              </div>
              <span className="landing-brand-tagline">DISPATCH OS · AID NETWORK</span>
            </div>
          </div>

          <nav className="landing-nav-links">
            <button onClick={() => scrollToSection("mission")} className="landing-nav-btn">
              Mission
            </button>
            <button onClick={() => scrollToSection("features")} className="landing-nav-btn">
              Self-Healing Engine
            </button>
            <button onClick={() => scrollToSection("safety")} className="landing-nav-btn">
              Safety Gates
            </button>
            <button onClick={() => scrollToSection("architecture")} className="landing-nav-btn">
              Architecture
            </button>
          </nav>

          <div className="landing-nav-actions">
            <div className="live-engine-pill">
              <span className="live-dot" />
              <span className="live-text">OPERATIONAL</span>
            </div>
            <button className="landing-cta-primary" onClick={onEnterDashboard}>
              <span>Enter Dispatch OS</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section with 3D Simulation */}
      <section className="landing-hero-section" ref={heroRef}>
        {/* 3D Network Canvas */}
        <div className="hero-3d-backdrop">
          <ResQFlowNetwork3D interactive={true} />
        </div>

        {/* Hero Foreground Content */}
        <div className="hero-content-wrapper">
          <div className="hero-eyebrow-pill">
            <Radio size={13} className="text-mint animate-pulse" />
            <span>THE SELF-HEALING AID NETWORK · CIVIC LOGISTICS OS</span>
          </div>

          <h1 ref={headlineRef} className="hero-main-headline">
            Every Meal Matters. <br />
            <span className="headline-gradient">Every Delivery Counts.</span>
          </h1>

          <p ref={subtitleRef} className="hero-main-subtitle">
            An intelligent, self-healing aid network that moves surplus food safely, automatically recovers failed
            reservations, and dynamically redirects in-transit resources when circumstances change on the road.
          </p>

          <div ref={quoteRef} className="humanitarian-quote-card">
            <div className="quote-mark">“</div>
            <p className="quote-text">
              The measure of a community is not what it produces, but how well it ensures nothing goes to waste.
            </p>
          </div>

          <div ref={ctaGroupRef} className="hero-cta-group">
            <button className="hero-primary-btn" onClick={onEnterDashboard}>
              <span className="btn-glow-ring" />
              <Zap size={17} />
              <span>Enter Dispatch OS</span>
              <ArrowRight size={17} />
            </button>
            <button className="hero-secondary-btn" onClick={() => scrollToSection("mission")}>
              <Compass size={16} />
              <span>Explore the Mission</span>
            </button>
          </div>

          {/* Micro Telemetry Bar (Tied directly to active Dispatch Store) */}
          <div className="hero-telemetry-bar">
            <div className="telemetry-item">
              <span className="telemetry-label">REGISTERED STOCK</span>
              <strong className="telemetry-val text-mint">{totalDonated}</strong>
              <small className="telemetry-sub">Total Meals Monitored</small>
            </div>
            <div className="telemetry-divider" />
            <div className="telemetry-item">
              <span className="telemetry-label">READY INVENTORY</span>
              <strong className="telemetry-val text-cyan">{availableInventory}</strong>
              <small className="telemetry-sub">Meals Available for Dispatch</small>
            </div>
            <div className="telemetry-divider" />
            <div className="telemetry-item">
              <span className="telemetry-label">ACTIVE FLEET</span>
              <strong className="telemetry-val text-mint">{activeRidersCount} / 5</strong>
              <small className="telemetry-sub">Volunteer Riders Online</small>
            </div>
            <div className="telemetry-divider" />
            <div className="telemetry-item">
              <span className="telemetry-label">DESTINATIONS</span>
              <strong className="telemetry-val text-amber">{openSheltersCount} Open</strong>
              <small className="telemetry-sub">{remainingShelterDemand} Meals Unmet Demand</small>
            </div>
          </div>
        </div>

        <button className="scroll-indicator-btn" onClick={() => scrollToSection("mission")}>
          <span>DISCOVER HOW RESQFLOW HEALS</span>
          <ChevronDown size={14} className="animate-bounce" />
        </button>
      </section>

      {/* SECTION 1: The Perishability Gap (The Civic Problem) */}
      <section id="mission" className="landing-section mission-section">
        <div className="section-container">
          <div className="section-reveal-header text-center">
            <span className="section-eyebrow">THE PERISHABILITY GAP</span>
            <h2 className="section-title">
              Why Traditional Food Rescue Fails In The Last Mile
            </h2>
            <p className="section-subtitle">
              Prepared food has an unforgiving shelf life. When volunteer logistics rely on static spreadsheets and
              unsupervised chat groups, three systemic failure modes leave nutritious food to spoil.
            </p>
          </div>

          <div className="problem-cards-grid">
            <div className="reveal-card problem-card">
              <div className="problem-icon-wrap icon-amber">
                <Clock size={24} />
              </div>
              <span className="problem-number">01 / TIME-SENSITIVITY</span>
              <h3>The 2-Hour Expiry Cliff</h3>
              <p>
                Hot meals degrade rapidly. Without deterministic travel-time buffering and real-time safe-life calculations,
                food arrives past safety windows or gets dumped at closed shelter doors.
              </p>
              <div className="problem-stat-box">
                <strong className="stat-highlight">45%</strong>
                <span>of perishable surplus spoilage happens due to delayed transit buffers.</span>
              </div>
            </div>

            <div className="reveal-card problem-card">
              <div className="problem-icon-wrap icon-red">
                <RotateCcw size={24} />
              </div>
              <span className="problem-number">02 / GHOST CLAIMS</span>
              <h3>The Reservation Black Hole</h3>
              <p>
                Volunteers claim food donations online but fail to collect them. Without deterministic auto-expiry,
                meals remain digitally locked in "claimed" purgatory while rotting on kitchen counters.
              </p>
              <div className="problem-stat-box">
                <strong className="stat-highlight">15 min</strong>
                <span>ResQFlow's hard timeout clock automatically returns uncollected parcels to inventory.</span>
              </div>
            </div>

            <div className="reveal-card problem-card">
              <div className="problem-icon-wrap icon-cyan">
                <AlertTriangle size={24} />
              </div>
              <span className="problem-number">03 / MID-ROUTE OBSTACLES</span>
              <h3>Stranded Physical Custody</h3>
              <p>
                When a volunteer's bicycle gets a puncture or an emergency shelter shuts unexpectedly, food already on the road
                cannot be returned to kitchen stock. It needs immediate intelligent mid-route redirection.
              </p>
              <div className="problem-stat-box">
                <strong className="stat-highlight">Golden Rule</strong>
                <span>Physical custody is never dumped back to virtual stock; it must be rerouted.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: The Self-Healing Triptych (Core Pillars) */}
      <section id="features" className="landing-section features-section">
        <div className="section-container">
          <div className="section-reveal-header text-center">
            <span className="section-eyebrow">THE SELF-HEALING ARCHITECTURE</span>
            <h2 className="section-title">
              Three Deterministic Engines Working In Symbiosis
            </h2>
            <p className="section-subtitle">
              Engineered with pure mathematical feasibility, safety gates, and multi-factor ranking. No AI hallucinations,
              no unverified allocations—only rock-solid deterministic logistics.
            </p>
          </div>

          <div className="features-triptych-grid">
            {/* Engine 1 */}
            <div className="reveal-card feature-triptych-card">
              <div className="feature-card-header">
                <div className="feature-badge-icon mint">
                  <Package size={22} />
                </div>
                <span className="engine-code mono">ENGINE 01</span>
              </div>
              <h3>Smart Batch Allocation</h3>
              <p className="feature-card-desc">
                Evaluates every candidate triple of (Donation Batch × Volunteer Rider × Destination Shelter) against 4
                rigid safety gates before computing multi-factor priority scores.
              </p>

              <div className="formula-box">
                <span className="formula-label mono">DETERMINISTIC FORMULA:</span>
                <code className="formula-code">
                  Score = 0.35·Urgency + 0.25·Feasibility + 0.20·Expiry + 0.10·Fairness + 0.10·Reliability
                </code>
              </div>

              <ul className="feature-bullets">
                <li>
                  <CheckCircle2 size={14} className="text-mint" />
                  <span>Safe partial splitting across multiple riders</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-mint" />
                  <span>Real-time travel-time matrix integration</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-mint" />
                  <span>Dynamic shelter unmet demand capping</span>
                </li>
              </ul>
            </div>

            {/* Engine 2 */}
            <div className="reveal-card feature-triptych-card">
              <div className="feature-card-header">
                <div className="feature-badge-icon amber">
                  <RotateCcw size={22} />
                </div>
                <span className="engine-code mono">ENGINE 02</span>
              </div>
              <h3>Ghost-Claim Recovery</h3>
              <p className="feature-card-desc">
                Monitors active reservations in real time. If a volunteer fails to scan the pickup QR within the timeout window,
                the engine automatically reclaims stock for immediate re-allocation.
              </p>

              <div className="custody-lock-box">
                <div className="lock-header">
                  <ShieldCheck size={16} className="text-amber" />
                  <strong>Strict Custody Guard</strong>
                </div>
                <p>
                  Only parcels in <code>RESERVED_UNPICKED</code> state are returned to kitchen stock. Food already
                  scanned on the road is strictly protected from cancellation.
                </p>
              </div>

              <ul className="feature-bullets">
                <li>
                  <CheckCircle2 size={14} className="text-amber" />
                  <span>Configurable 5m to 45m timeout window</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-amber" />
                  <span>Instant stock pool restoration</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-amber" />
                  <span>Automated audit trail with UTC timestamps</span>
                </li>
              </ul>
            </div>

            {/* Engine 3 */}
            <div className="reveal-card feature-triptych-card">
              <div className="feature-card-header">
                <div className="feature-badge-icon cyan">
                  <Navigation size={22} />
                </div>
                <span className="engine-code mono">ENGINE 03</span>
              </div>
              <h3>Mid-Route Rescue Command</h3>
              <p className="feature-card-desc">
                When unexpected incidents happen on delivery—such as shelter closures or rider breakdowns—the contingency matrix
                instantly computes safe alternative drop-offs.
              </p>

              <div className="contingency-box">
                <div className="contingency-header">
                  <Compass size={16} className="text-cyan" />
                  <strong>Dynamic Reroute Matrix</strong>
                </div>
                <p>
                  Evaluates nearby facilities by distance, unmet demand, commodity compatibility, and expiry margin to prevent
                  food dumpings.
                </p>
              </div>

              <ul className="feature-bullets">
                <li>
                  <CheckCircle2 size={14} className="text-cyan" />
                  <span>Zero in-transit food abandonment</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-cyan" />
                  <span>Explicit unresolvable state supervisor alerts</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-cyan" />
                  <span>Live topology SVG visualization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Hard Safety Gates Interactive Audit Matrix */}
      <section id="safety" className="landing-section safety-section">
        <div className="section-container">
          <div className="section-reveal-header text-center">
            <span className="section-eyebrow">ZERO-COMPROMISE COMPLIANCE</span>
            <h2 className="section-title">
              Four Hard Safety Gates Before Any Route Can Launch
            </h2>
            <p className="section-subtitle">
              Unlike ordinary delivery apps that optimize solely for speed, ResQFlow blocks any assignment that violates food
              safety, volunteer carrying capacity, or shelter infrastructure requirements.
            </p>
          </div>

          <div className="safety-gates-grid">
            <div className="reveal-card safety-gate-card">
              <div className="gate-number-badge">GATE 01</div>
              <div className="gate-header">
                <Users size={20} className="text-mint" />
                <h4>Rider Carrying Capacity</h4>
              </div>
              <p>
                Strictly limits allocation quantity to the rider's remaining backpack capacity. Blocks any overloading attempts.
              </p>
              <div className="gate-formula mono">
                quantity &le; (carryingCapacity - currentLoad)
              </div>
            </div>

            <div className="reveal-card safety-gate-card">
              <div className="gate-number-badge">GATE 02</div>
              <div className="gate-header">
                <Building2 size={20} className="text-cyan" />
                <h4>Shelter Unmet Demand</h4>
              </div>
              <p>
                Caps drop-offs to what the facility can actually store and distribute today. Prevents shelter overflow waste.
              </p>
              <div className="gate-formula mono">
                quantity &le; max(0, requested - received)
              </div>
            </div>

            <div className="reveal-card safety-gate-card">
              <div className="gate-number-badge">GATE 03</div>
              <div className="gate-header">
                <Clock size={20} className="text-amber" />
                <h4>Safe-Life Expiry Buffer</h4>
              </div>
              <p>
                Calculates total journey duration (pickup + travel + handover). Blocks assignments where safety margin &lt; 20 min.
              </p>
              <div className="gate-formula mono">
                margin = expiryMins - (travel + 20) &ge; 20m
              </div>
            </div>

            <div className="reveal-card safety-gate-card">
              <div className="gate-number-badge">GATE 04</div>
              <div className="gate-header">
                <ShieldCheck size={20} className="text-mint" />
                <h4>Commodity & Utility Match</h4>
              </div>
              <p>
                Validates prerequisites: raw rice requires cooking fuel and clean water; dairy requires active cold storage.
              </p>
              <div className="gate-formula mono">
                shelter.utilities &supe; batch.requiredUtilities
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Architecture & Live Network Topology */}
      <section id="architecture" className="landing-section architecture-section">
        <div className="section-container">
          <div className="section-reveal-header text-center">
            <span className="section-eyebrow">DETERMINISTIC ARCHITECTURE</span>
            <h2 className="section-title">
              Real-Time Dispatch State Engine
            </h2>
            <p className="section-subtitle">
              Built on React 19, TypeScript, and a unified reactive Dispatch Context. Every action triggers synchronized updates
              across the allocation workspace, topology map, and audit logs.
            </p>
          </div>

          <div className="architecture-showcase-card reveal-card">
            <div className="arch-header">
              <div className="arch-dot-group">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <span className="arch-title mono">resqflow_kernel_state.ts · LIVE PIPELINE</span>
              <span className="arch-badge mono">100% DETERMINISTIC</span>
            </div>

            <div className="arch-body-grid">
              <div className="arch-step-box">
                <span className="step-num mono">STAGE 1</span>
                <strong>Batch Ingestion</strong>
                <p>Nutritional category, safe-life countdown, sealed parcel validation, and prep kitchen origin.</p>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step-box">
                <span className="step-num mono">STAGE 2</span>
                <strong>Feasibility Filter</strong>
                <p>Hard constraint pruning. Drops incompatible pairs with detailed rejection codes for human audit.</p>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step-box">
                <span className="step-num mono">STAGE 3</span>
                <strong>Optimal Splitting</strong>
                <p>Multi-factor greedy allocation with fairness balancing across shelters and volunteer workload.</p>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-step-box">
                <span className="step-num mono">STAGE 4</span>
                <strong>Custody Guard</strong>
                <p>Real-time physical handover monitoring, QR custody locks, and mid-route contingency recovery.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grand Finale Call-to-Action */}
      <section className="landing-finale-section">
        <div className="finale-container">
          <div className="finale-glow-orb" />
          <div className="finale-content">
            <div className="finale-eyebrow mono">GET STARTED NOW</div>
            <h2 className="finale-headline">
              Ready to Experience the Future of Civic Food Logistics?
            </h2>
            <p className="finale-subtitle">
              Step into the live Dispatch OS. Test batch allocation, trigger simulated ghost claims, and explore real-time
              mid-route rescue rerouting.
            </p>

            <div className="finale-btn-wrap">
              <button className="finale-launch-btn" onClick={onEnterDashboard}>
                <Sparkles size={18} />
                <span>Launch Dispatch OS</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-left">
            <div className="footer-brand">
              <strong>ResQFlow</strong> — The Self-Healing Aid Network
            </div>
            <p className="footer-copy">
              A civic-tech initiative engineered for sustainable perishable food redistribution. Built with React 19, TypeScript,
              Three.js, and pure deterministic algorithms.
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-meta">
              <span className="mono">AISSMS HACKATHON 2026</span>
              <span className="footer-sep">·</span>
              <span className="mono">MIT OPEN SOURCE</span>
            </div>
            <button className="footer-top-link" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Back to Top ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
