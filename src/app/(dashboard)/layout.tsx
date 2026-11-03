"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import { DashboardCurrency } from "@/components/common/DashboardCurrency";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { getOnboardingStatus } from "@/app/api/businesses.api";
import { useAuth } from "@/app/auth/useAuth";

// Dashboard routes a business still needs while mid-setup — these must stay
// reachable even when onboarding is incomplete, or the redirect below would
// trap the owner on /onboarding with no way to actually finish it.
const ONBOARDING_EXEMPT_PATHS = ["/onboarding", "/business-settings", "/services", "/profile"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tc = useTranslations("Dashboard.common");
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // This layout wraps every tenant page (bookings, cleaners, payroll, ...).
  // It previously had no auth gate at all — only /admin (super admin) did —
  // so an unauthenticated visitor landed straight on tenant pages, and the
  // onboarding check below would silently no-op for them (its catch block
  // treats a 401 the same as a network hiccup and lets the page through).
  // Redirect before that check ever runs, the same way admin/layout.tsx does.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    let cancelled = false;
    const isExempt = ONBOARDING_EXEMPT_PATHS.some((p) => pathname?.startsWith(p));

    (async () => {
      try {
        const status = await getOnboardingStatus();
        if (cancelled) return;
        if (!status.isComplete && !isExempt) {
          router.replace("/onboarding");
          return;
        }
      } catch {
        // If the check itself fails (e.g. network hiccup), don't block the
        // dashboard on it — better to let a fully-set-up business keep
        // working than to hard-lock everyone out on a transient error.
        // (Auth failures no longer reach here — the gate above catches
        // those before this effect is even allowed to run.)
      } finally {
        if (!cancelled) setCheckingOnboarding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-check on every route change so finishing a step elsewhere and
    // navigating back doesn't leave a stale "incomplete" redirect looping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, authLoading, isAuthenticated]);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  if (authLoading || !isAuthenticated || !user || checkingOnboarding) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">{tc("loading")}</div>;
  }

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <DashboardCurrency>{children}</DashboardCurrency>
        </div>
      </div>
    </div>
  );
}
