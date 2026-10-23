import { useState, useEffect, lazy, Suspense } from "react";
import "./index.css";
import "./landing.css";
import { DispatchProvider } from "./DispatchContext";

// Lazy load routes so initial bundle is feather-light and zero bulkiness
const SmartAllocationDashboard = lazy(() =>
  import("./SmartAllocationDashboard").then((m) => ({ default: m.SmartAllocationDashboard }))
);
const ResQFlowLandingPage = lazy(() =>
  import("./ResQFlowLandingPage").then((m) => ({ default: m.ResQFlowLandingPage }))
);

function RouteLoadingFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#050d0b",
        color: "#70f0be",
        fontFamily: "system-ui, monospace",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "2px solid rgba(112, 240, 190, 0.15)",
          borderTopColor: "#70f0be",
          animation: "resq-spin 0.8s linear infinite",
        }}
      />
      <span style={{ fontSize: 11, letterSpacing: "0.14em", opacity: 0.85, fontWeight: 600 }}>
        SYNCHRONIZING RESQFLOW AID KERNEL...
      </span>
      <style>{`@keyframes resq-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<"home" | "dashboard">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes("dashboard") || hash.includes("dashboard")) {
        return "dashboard";
      }
    }
    return "home";
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes("dashboard") || hash.includes("dashboard")) {
        setCurrentRoute("dashboard");
      } else {
        setCurrentRoute("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToDashboard = () => {
    setCurrentRoute("dashboard");
    try {
      window.history.pushState(null, "", "/dashboard");
    } catch {
      window.location.hash = "/dashboard";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToHome = () => {
    setCurrentRoute("home");
    try {
      window.history.pushState(null, "", "/");
    } catch {
      window.location.hash = "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <DispatchProvider>
      <Suspense fallback={<RouteLoadingFallback />}>
        {currentRoute === "dashboard" ? (
          <SmartAllocationDashboard onNavigateHome={navigateToHome} />
        ) : (
          <ResQFlowLandingPage onEnterDashboard={navigateToDashboard} />
        )}
      </Suspense>
    </DispatchProvider>
  );
}
