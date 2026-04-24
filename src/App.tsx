import { lazy } from "react";

const AdminMonitoringDashboard = lazy(() =>
  import("./pages/admin/MonitoringDashboard").then((mod) => ({
    default: mod.MonitoringDashboard || mod.default || (() => <div>Dashboard not found</div>),
  }))
);

const MonitoringDashboardTest = lazy(() =>
  import("./pages/admin/MonitoringDashboardTest").then((mod) => ({
    default: mod.MonitoringDashboardTest || mod.default || (() => <div>Test dashboard not found</div>),
  }))
);

export default function App() {
  return (
    <>
      {/* Routes will be added by router - keeping minimal for now */}
      {AdminMonitoringDashboard && <AdminMonitoringDashboard />}
    </>
  );
}