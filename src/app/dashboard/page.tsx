import { Suspense } from "react";
import { Dashboard } from "@/components/Dashboard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { buildModel } from "@/lib/analytics";
import { loadWarehouse } from "@/lib/data";

export const metadata = { title: "Ringkasan · Dashboard Perbankan" };

async function DashboardContent() {
  const model = buildModel(await loadWarehouse());
  return <Dashboard model={model} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
