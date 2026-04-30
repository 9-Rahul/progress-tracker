import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/dashboard-view";

export default function DashboardPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <DashboardView />
      </Suspense>
    </AppShell>
  );
}
