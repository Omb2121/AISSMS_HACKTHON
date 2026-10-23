import { useState, useEffect } from "react";
import "./index.css";
import "./landing.css";
import { DispatchProvider } from "./DispatchContext";
import { SmartAllocationDashboard } from "./SmartAllocationDashboard";
import { ResQFlowLandingPage } from "./ResQFlowLandingPage";

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
      {currentRoute === "dashboard" ? (
        <SmartAllocationDashboard onNavigateHome={navigateToHome} />
      ) : (
        <ResQFlowLandingPage onEnterDashboard={navigateToDashboard} />
      )}
    </DispatchProvider>
  );
}
