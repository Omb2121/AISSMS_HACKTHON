import "./index.css";
import { DispatchProvider } from "./DispatchContext";
import { SmartAllocationDashboard } from "./SmartAllocationDashboard";

export default function App() {
  return (
    <DispatchProvider>
      <SmartAllocationDashboard />
    </DispatchProvider>
  );
}
