"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
// import { RefreshCw } from "lucide-react";
// import { SyncSettingsPage } from "@/components/sync/sync-settings-page";
import { useSidebarStore } from "@/stores/sidebar-store";
import { SidebarNav } from "./sidebar-nav";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useSidebarStore((s) => s.open);
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const setOpen = useSidebarStore((s) => s.setOpen);

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = (matches: boolean) => {
      setIsDesktop(matches);
      if (!matches) setOpen(false);
    };
    update(mql.matches);
    const handler = (e: MediaQueryListEvent) => update(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [setOpen]);

  return (
    <div
      className="print-root grid grid-rows-[minmax(56px,auto)_1fr] h-screen overflow-hidden bg-page transition-[grid-template-columns] duration-300 ease-in-out print:block print:h-auto print:overflow-visible print:max-h-none"
      style={{
        gridTemplateColumns: (isDesktop && sidebarOpen) ? "260px 1fr" : "0px 1fr",
      }}
    >
      {/* Top Nav */}
      <nav className="print-hide print:hidden col-span-2 flex items-center min-h-14 px-4 sm:px-5 bg-card border-b border-border-subtle z-10 gap-2 sm:gap-3">
        <div className="flex items-center gap-1 min-w-0 shrink-0">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="inline-flex items-center justify-center size-9 shrink-0 rounded-md text-text-tertiary hover:text-text-primary hover:bg-hover active:bg-hover/80 transition-colors"
          >
            <Menu className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
          <Link
            href="/chat"
            className="flex items-center min-w-0 py-1 pl-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-text-primary">
              CrafterIQ
            </span>
          </Link>
        </div>

        {/* <div className="flex flex-1 min-w-0 items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] leading-tight text-text-tertiary">
          <span className="h-4 w-px shrink-0 bg-border-subtle" aria-hidden />
          <span className="truncate">
            Powered by{" "}
            <span className="font-medium text-text-secondary">CrafterIQ</span>
          </span>
        </div> */}

        {/* Right */}
        <div className="ml-auto flex items-center gap-2">
          {/* <Link
            href="/normalization"
            className="flex items-center gap-1.5 px-2.5 py-[5px] border border-border-mid rounded-md text-xs text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-[13px] h-[13px] opacity-60"
            >
              <path d="M2 4h12M2 8h12M2 12h12" />
              <circle cx="5" cy="4" r="1" fill="currentColor" />
              <circle cx="5" cy="8" r="1" fill="currentColor" />
              <circle cx="5" cy="12" r="1" fill="currentColor" />
            </svg>
            Normalization
          </Link>
          <div className="w-px h-5 bg-border-subtle" /> */}
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7",
                },
              }}
            />
            {/* Sync Settings — hidden until pipeline API is available in Insmed
            <UserButton.UserProfilePage
              label="Sync Settings"
              url="sync-settings"
              labelIcon={<RefreshCw style={{ width: 16, height: 16 }} />}
            >
              <SyncSettingsPage />
            </UserButton.UserProfilePage>
            */}
          </SignedIn>
        </div>
      </nav>

      {/* Desktop sidebar — stays in grid flow so <main> always lands in col 2 */}
      <aside
        className="print-hide print:hidden overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: (isDesktop && sidebarOpen) ? 260 : 0 }}
      >
        <div className="w-[260px] h-full hidden md:block">
          <SidebarNav />
        </div>
      </aside>

      {/* Mobile sidebar — fixed overlay, slides in from left */}
      <div
        className={`print-hide print:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={`print-hide print:hidden fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out md:hidden shadow-xl`}
        style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <main className="flex flex-col overflow-hidden relative print:overflow-visible print:h-auto print:block">
        {children}
      </main>
    </div>
  );
}
