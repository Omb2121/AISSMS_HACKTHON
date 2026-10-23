import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Zap, RotateCcw, Navigation, Play } from "lucide-react";

export type SolutionMode = "AUTO" | "ALLOCATION" | "GHOST_CLAIM" | "MID_ROUTE";

interface Network3DProps {
  className?: string;
  interactive?: boolean;
}

interface DestinationNode {
  position: THREE.Vector3;
  name: string;
  demand: number;
  mesh?: THREE.Mesh;
  glowMesh?: THREE.Mesh;
  status: "open" | "warning" | "closed" | "rescued";
  pulseTime: number;
}

export const ResQFlowNetwork3D: React.FC<Network3DProps> = ({ className, interactive = true }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<SolutionMode>("AUTO");
  const [scenarioState, setScenarioState] = useState<{
    title: string;
    description: string;
    statusTag: string;
    tone: "mint" | "amber" | "cyan";
  }>({
    title: "1. Smart Batch Allocation",
    description: "Evaluating 4 hard safety gates. Parcels flow safely from Hub to eligible shelters.",
    statusTag: "FEASIBILITY: 100% GATED",
    tone: "mint",
  });

  const modeRef = useRef<SolutionMode>("AUTO");
  modeRef.current = activeMode;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect WebGL
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene & Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050d0b, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.8, 14.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Pause rendering when scrolled out of viewport for maximum smoothness & zero battery drain
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0x0e271f, 2.2);
    scene.add(ambientLight);

    const hubLight = new THREE.PointLight(0x70f0be, 3.5, 18, 1.4);
    hubLight.position.set(0, 1.2, 0);
    worldGroup.add(hubLight);

    const cyanLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    cyanLight.position.set(6, 12, 8);
    scene.add(cyanLight);

    // --- Central Food Hub (Origin) ---
    const hubGroup = new THREE.Group();
    worldGroup.add(hubGroup);

    const hubGeo = new THREE.OctahedronGeometry(1.2, 2);
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0x70f0be,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    hubGroup.add(hubMesh);

    const hubWireGeo = new THREE.OctahedronGeometry(1.45, 1);
    const hubWireMat = new THREE.MeshBasicMaterial({
      color: 0xa7f3d0,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const hubWireMesh = new THREE.Mesh(hubWireGeo, hubWireMat);
    hubGroup.add(hubWireMesh);

    // Central Floating Food Parcel
    const packageGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const packageMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.7,
    });
    const packageMesh = new THREE.Mesh(packageGeo, packageMat);
    packageMesh.position.set(0, 1.9, 0);
    hubGroup.add(packageMesh);

    // Hub Rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x70f0be,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    const innerRingGeo = new THREE.RingGeometry(2.3, 2.36, 64);
    const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
    innerRing.rotation.x = Math.PI / 2;
    worldGroup.add(innerRing);

    const outerRingGeo = new THREE.RingGeometry(3.8, 3.86, 64);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.rotation.x = Math.PI / 2 + 0.12;
    worldGroup.add(outerRing);

    // --- Destination Shelter Nodes ---
    const destinationDefs: DestinationNode[] = [
      { position: new THREE.Vector3(-4.8, 0.5, 1.8), name: "Shelter Hope S1", demand: 40, status: "open", pulseTime: 0 },
      { position: new THREE.Vector3(-2.6, 1.2, -4.2), name: "Harbor Light S2", demand: 35, status: "open", pulseTime: 0 },
      { position: new THREE.Vector3(3.8, -0.2, -3.6), name: "Sunrise Youth S3", demand: 25, status: "open", pulseTime: 0 },
      { position: new THREE.Vector3(5.2, 0.6, 1.6), name: "Civic Sanctuary S4", demand: 45, status: "open", pulseTime: 0 },
      { position: new THREE.Vector3(0.6, -1.1, 4.4), name: "Downtown Pantry S5", demand: 30, status: "open", pulseTime: 0 },
    ];

    const shelterMeshes: THREE.Mesh[] = [];
    const shelterGlowMeshes: THREE.Mesh[] = [];

    destinationDefs.forEach((dest) => {
      const geo = new THREE.DodecahedronGeometry(0.52, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        roughness: 0.25,
        metalness: 0.65,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(dest.position);
      worldGroup.add(mesh);
      dest.mesh = mesh;
      shelterMeshes.push(mesh);

      const auraGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x70f0be,
        transparent: true,
        opacity: 0.3,
        wireframe: true,
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.position.copy(dest.position);
      worldGroup.add(auraMesh);
      dest.glowMesh = auraMesh;
      shelterGlowMeshes.push(auraMesh);
    });

    // --- Standard Delivery Routes (Hub -> Shelters) ---
    const curves: THREE.QuadraticBezierCurve3[] = [];
    const routeTubes: THREE.Mesh[] = [];
    const origin = new THREE.Vector3(0, 0, 0);

    destinationDefs.forEach((dest) => {
      const mid = new THREE.Vector3().addVectors(origin, dest.position).multiplyScalar(0.5);
      mid.y += 1.8;
      const curve = new THREE.QuadraticBezierCurve3(origin, mid, dest.position);
      curves.push(curve);

      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.024, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x70f0be,
        transparent: true,
        opacity: 0.28,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      worldGroup.add(tubeMesh);
      routeTubes.push(tubeMesh);
    });

    // --- Special Route: Mid-Route Rescue Branch (From mid-route S4 -> S1) ---
    const midPointS4 = curves[3].getPoint(0.5); // half-way to S4
    const midControl = new THREE.Vector3().addVectors(midPointS4, destinationDefs[0].position).multiplyScalar(0.5);
    midControl.y += 1.5;
    const rescueCurve = new THREE.QuadraticBezierCurve3(midPointS4, midControl, destinationDefs[0].position);

    const rescueTubeGeo = new THREE.TubeGeometry(rescueCurve, 32, 0.028, 8, false);
    const rescueTubeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0, // toggled when in Mid-Route mode
    });
    const rescueTubeMesh = new THREE.Mesh(rescueTubeGeo, rescueTubeMat);
    worldGroup.add(rescueTubeMesh);

    // --- Special Route: Ghost Claim Return Route (S3 -> Hub) ---
    const returnControl = new THREE.Vector3().addVectors(destinationDefs[2].position, origin).multiplyScalar(0.5);
    returnControl.y += 2.2;
    const ghostReturnCurve = new THREE.QuadraticBezierCurve3(destinationDefs[2].position, returnControl, origin);
    const ghostTubeGeo = new THREE.TubeGeometry(ghostReturnCurve, 32, 0.026, 8, false);
    const ghostTubeMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.0, // toggled in Ghost mode
    });
    const ghostTubeMesh = new THREE.Mesh(ghostTubeGeo, ghostTubeMat);
    worldGroup.add(ghostTubeMesh);

    // --- Traveling Meal Packets ---
    const packetGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });

    const normalPackets: { curve: THREE.QuadraticBezierCurve3; progress: number; speed: number; mesh: THREE.Mesh; destIndex: number }[] = [];
    curves.forEach((curve, idx) => {
      const pMesh = new THREE.Mesh(packetGeo, packetMat.clone());
      worldGroup.add(pMesh);
      normalPackets.push({
        curve,
        progress: Math.random() * 0.8,
        speed: 0.0055 + Math.random() * 0.0025,
        mesh: pMesh,
        destIndex: idx,
      });
    });

    // Special Ghost Parcel (reclaiming back to Hub)
    const ghostPacketMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0 })
    );
    worldGroup.add(ghostPacketMesh);
    let ghostProgress = 0;

    // Special Mid-Route Rescue Parcel (travels along route 4, then branches)
    const rescuePacketMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 })
    );
    worldGroup.add(rescuePacketMesh);
    let rescueProgress = 0;

    // --- Ambient Particle Stars ---
    const starCount = 140;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 22;
      starPos[i + 1] = (Math.random() - 0.5) * 14;
      starPos[i + 2] = (Math.random() - 0.5) * 22;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starParticles = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x70f0be, size: 0.07, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending })
    );
    scene.add(starParticles);

    // Mouse Parallax
    const targetRot = { x: 0, y: 0 };
    const curRot = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || prefersReducedMotion) return;
      targetRot.y = ((e.clientX / window.innerWidth) * 2 - 1) * 0.35;
      targetRot.x = -((e.clientY / window.innerHeight) * 2 - 1) * 0.22;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();
    let cycleTimer = 0;
    let currentCyclePhase: "ALLOCATION" | "GHOST_CLAIM" | "MID_ROUTE" = "ALLOCATION";

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return; // Skip work completely when scrolled out of view

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth Parallax
      curRot.x += (targetRot.x - curRot.x) * 0.05;
      curRot.y += (targetRot.y - curRot.y) * 0.05;
      worldGroup.rotation.y = curRot.y + (prefersReducedMotion ? 0 : time * 0.07);
      worldGroup.rotation.x = curRot.x + 0.12;

      // Hub animations
      hubMesh.rotation.y = time * 0.4;
      hubMesh.rotation.x = time * 0.2;
      hubWireMesh.rotation.y = -time * 0.3;
      packageMesh.position.y = 1.9 + Math.sin(time * 2.5) * 0.16;
      packageMesh.rotation.y = time * 1.2;
      innerRing.rotation.z = time * 0.18;
      outerRing.rotation.z = -time * 0.14;

      // Determine active scenario
      const selectedMode = modeRef.current;
      let effectivePhase: "ALLOCATION" | "GHOST_CLAIM" | "MID_ROUTE" = "ALLOCATION";

      if (selectedMode === "AUTO") {
        cycleTimer += delta;
        if (cycleTimer < 5) {
          effectivePhase = "ALLOCATION";
        } else if (cycleTimer < 10) {
          effectivePhase = "GHOST_CLAIM";
        } else if (cycleTimer < 16) {
          effectivePhase = "MID_ROUTE";
        } else {
          cycleTimer = 0;
          effectivePhase = "ALLOCATION";
        }
      } else {
        effectivePhase = selectedMode;
      }

      // Update UI text state when phase changes
      if (effectivePhase !== currentCyclePhase) {
        currentCyclePhase = effectivePhase;
        if (effectivePhase === "ALLOCATION") {
          setScenarioState({
            title: "1. Smart Batch Allocation",
            description: "Feasibility engine matches batches to riders & shelters with zero capacity violation.",
            statusTag: "FEASIBILITY: 100% GATED",
            tone: "mint",
          });
        } else if (effectivePhase === "GHOST_CLAIM") {
          setScenarioState({
            title: "2. Ghost-Claim Recovery",
            description: "Volunteer missed 15m collection window. Parcels auto-reclaim back to kitchen inventory.",
            statusTag: "AUTO-RECLAIM: STOCK RESTORED",
            tone: "amber",
          });
        } else if (effectivePhase === "MID_ROUTE") {
          setScenarioState({
            title: "3. Mid-Route Rescue Reroute",
            description: "Civic Sanctuary S4 shut unexpectedly. Food in physical custody safely redirected to Hope S1.",
            statusTag: "GOLDEN CUSTODY: REROUTED",
            tone: "cyan",
          });
        }
      }

      // -------------------------------------------------------------
      // SCENARIO 1: SMART BATCH ALLOCATION
      // -------------------------------------------------------------
      if (effectivePhase === "ALLOCATION") {
        rescueTubeMat.opacity = 0;
        ghostTubeMat.opacity = 0;
        ghostPacketMesh.visible = false;
        rescuePacketMesh.visible = false;

        // Reset all shelters to normal open colors
        destinationDefs.forEach((_, i) => {
          (shelterMeshes[i].material as THREE.MeshStandardMaterial).color.setHex(0x38bdf8);
          (shelterMeshes[i].material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
          (shelterGlowMeshes[i].material as THREE.MeshBasicMaterial).color.setHex(0x70f0be);
        });

        // Run normal packets to all destinations
        normalPackets.forEach((p) => {
          p.mesh.visible = true;
          if (!prefersReducedMotion) p.progress += p.speed;
          if (p.progress >= 1.0) {
            p.progress = 0;
            destinationDefs[p.destIndex].pulseTime = 1.0;
          }
          const pt = p.curve.getPoint(p.progress);
          p.mesh.position.copy(pt);
          const sc = Math.sin(p.progress * Math.PI) * 1.3 + 0.6;
          p.mesh.scale.set(sc, sc, sc);
        });
      }

      // -------------------------------------------------------------
      // SCENARIO 2: GHOST CLAIM AUTO-RECOVERY
      // -------------------------------------------------------------
      else if (effectivePhase === "GHOST_CLAIM") {
        rescueTubeMat.opacity = 0;
        rescuePacketMesh.visible = false;
        ghostTubeMat.opacity = 0.65 + Math.sin(time * 4) * 0.25;
        ghostPacketMesh.visible = true;

        // Highlight Shelter S3 in warning amber
        (shelterMeshes[2].material as THREE.MeshStandardMaterial).color.setHex(0xfbbf24);
        (shelterMeshes[2].material as THREE.MeshStandardMaterial).emissive.setHex(0xd97706);
        (shelterGlowMeshes[2].material as THREE.MeshBasicMaterial).color.setHex(0xf59e0b);

        // Animate ghost parcel moving BACK to Hub
        if (!prefersReducedMotion) ghostProgress += 0.008;
        if (ghostProgress >= 1.0) {
          ghostProgress = 0;
          // Pulse the Hub with green stock restored pulse
          hubLight.intensity = 5.0;
        } else {
          hubLight.intensity = 3.5;
        }

        const gPoint = ghostReturnCurve.getPoint(ghostProgress);
        ghostPacketMesh.position.copy(gPoint);
        const gScale = Math.sin(ghostProgress * Math.PI) * 1.4 + 0.8;
        ghostPacketMesh.scale.set(gScale, gScale, gScale);
      }

      // -------------------------------------------------------------
      // SCENARIO 3: MID-ROUTE RESCUE ENGINE
      // -------------------------------------------------------------
      else if (effectivePhase === "MID_ROUTE") {
        ghostTubeMat.opacity = 0;
        ghostPacketMesh.visible = false;
        rescueTubeMat.opacity = 0.75 + Math.sin(time * 3.5) * 0.2;
        rescuePacketMesh.visible = true;

        // S4 is closed (red alert pulse)
        (shelterMeshes[3].material as THREE.MeshStandardMaterial).color.setHex(0xef4444);
        (shelterMeshes[3].material as THREE.MeshStandardMaterial).emissive.setHex(0xb91c1c);
        (shelterGlowMeshes[3].material as THREE.MeshBasicMaterial).color.setHex(0xf87171);

        // S1 is the rescue target (bright cyan pulse)
        (shelterMeshes[0].material as THREE.MeshStandardMaterial).color.setHex(0x38bdf8);
        (shelterMeshes[0].material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
        (shelterGlowMeshes[0].material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);

        if (!prefersReducedMotion) rescueProgress += 0.009;

        if (rescueProgress < 0.5) {
          // In transit along original route towards S4
          const pt = curves[3].getPoint(rescueProgress);
          rescuePacketMesh.position.copy(pt);
        } else if (rescueProgress < 1.0) {
          // Dynamic branching along rescue curve toward S1!
          const branchProg = (rescueProgress - 0.5) * 2.0;
          const pt = rescueCurve.getPoint(branchProg);
          rescuePacketMesh.position.copy(pt);
        } else {
          // Arrived at S1!
          rescueProgress = 0;
          destinationDefs[0].pulseTime = 1.0;
        }

        const rScale = Math.sin(rescueProgress * Math.PI) * 1.5 + 0.8;
        rescuePacketMesh.scale.set(rScale, rScale, rScale);
      }

      // Pulse effects on shelters
      destinationDefs.forEach((dest) => {
        if (dest.mesh) dest.mesh.rotation.y = time * 0.6;
        if (dest.glowMesh) {
          dest.glowMesh.rotation.y = -time * 0.4;
          if (dest.pulseTime > 0) {
            dest.pulseTime = Math.max(0, dest.pulseTime - delta * 2.0);
            const scale = 1.0 + dest.pulseTime * 0.8;
            dest.glowMesh.scale.set(scale, scale, scale);
          } else {
            const idle = 1.0 + Math.sin(time * 3 + dest.demand) * 0.08;
            dest.glowMesh.scale.set(idle, idle, idle);
          }
        }
      });

      starParticles.rotation.y = time * 0.02;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      cancelAnimationFrame(animId);

      renderer.dispose();
      hubGeo.dispose();
      hubMat.dispose();
      hubWireGeo.dispose();
      hubWireMat.dispose();
      packageGeo.dispose();
      packageMat.dispose();
      innerRingGeo.dispose();
      outerRingGeo.dispose();
      ringMat.dispose();
      packetGeo.dispose();
      packetMat.dispose();
      starGeo.dispose();
      starParticles.geometry.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive]);

  if (!webglSupported) {
    return (
      <div className={`network-fallback-canvas ${className || ""}`}>
        <svg viewBox="0 0 800 500" className="fallback-svg">
          <circle cx="400" cy="250" r="42" fill="rgba(112, 240, 190, 0.2)" stroke="#70f0be" strokeWidth="2" />
          <text x="400" y="254" textAnchor="middle" fill="#70f0be" fontSize="12" fontFamily="monospace">ORIGIN HUB</text>
        </svg>
      </div>
    );
  }

  return (
    <div className={`network-3d-wrapper ${className || ""}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="network-3d-canvas-mount" />

      {/* Floating HUD Scenario Overlay Directly on 3D Hero */}
      <div className="network-solution-hud">
        {/* Solution Mode Switcher Tabs */}
        <div className="hud-mode-switcher">
          <button
            className={`hud-mode-btn ${activeMode === "AUTO" ? "active" : ""}`}
            onClick={() => setActiveMode("AUTO")}
            title="Automatically cycles through all 3 self-healing scenarios"
          >
            <Play size={12} /> Auto-Cycle
          </button>
          <button
            className={`hud-mode-btn ${activeMode === "ALLOCATION" ? "active" : ""}`}
            onClick={() => setActiveMode("ALLOCATION")}
          >
            <Zap size={12} className="text-mint" /> 1. Allocation
          </button>
          <button
            className={`hud-mode-btn ${activeMode === "GHOST_CLAIM" ? "active" : ""}`}
            onClick={() => setActiveMode("GHOST_CLAIM")}
          >
            <RotateCcw size={12} className="text-amber" /> 2. Ghost Claim
          </button>
          <button
            className={`hud-mode-btn ${activeMode === "MID_ROUTE" ? "active" : ""}`}
            onClick={() => setActiveMode("MID_ROUTE")}
          >
            <Navigation size={12} className="text-cyan" /> 3. Mid-Route
          </button>
        </div>

        {/* Narrative Live Status Box */}
        <div className={`hud-narrative-card hud-tone-${scenarioState.tone}`}>
          <div className="hud-card-top">
            <span className="hud-phase-title">{scenarioState.title}</span>
            <span className={`hud-status-chip chip-${scenarioState.tone}`}>
              <span className="hud-live-dot" />
              {scenarioState.statusTag}
            </span>
          </div>
          <p className="hud-card-desc">{scenarioState.description}</p>
        </div>
      </div>
    </div>
  );
};
