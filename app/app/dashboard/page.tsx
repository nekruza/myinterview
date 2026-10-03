import { DashboardClient } from "./DashboardClient";

// Deliberately does no data work: the figures load through React Query so that
// navigating back to the dashboard renders from cache instead of waiting on the
// server (see lib/queries/dashboard.ts).
export default function DashboardPage() {
  return <DashboardClient />;
}
