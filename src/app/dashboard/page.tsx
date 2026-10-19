import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Dashboard } from "@/components/Dashboard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { buildModel } from "@/lib/analytics";
import { loadWarehouse } from "@/lib/data";

async function DashboardContent() {
  const model = buildModel(await loadWarehouse());
  return <Dashboard model={model} />;
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<div className="h-14 border-b border-line" />}>
        <AppHeader />
      </Suspense>
      <main className="flex-1">
        <Suspense fallback={<PageSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
    </>
  );
}
