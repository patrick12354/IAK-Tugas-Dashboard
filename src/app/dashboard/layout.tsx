import { Suspense, type ReactNode } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { AccountAvatar, AccountCard } from "@/components/shell/Account";

const footer = (
  <Suspense fallback={<div className="h-11 animate-pulse rounded-xl bg-surface-2" />}>
    <AccountCard />
  </Suspense>
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar footer={footer} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          account={
            <Suspense fallback={<span className="size-9 rounded-full bg-surface-2" />}>
              <AccountAvatar />
            </Suspense>
          }
          mobileFooter={footer}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
