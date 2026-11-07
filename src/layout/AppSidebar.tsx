"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSidebar } from "../context/SidebarContext";
import {
  GridIcon,
  ChevronDownIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
  FileIcon,
  GroupIcon,
  BellIcon,
  ChatIcon,
  DollarLineIcon,
  EnvelopeIcon,
  TaskIcon,
  ShootingStarIcon,
  CalenderIcon,
  BoxCubeIcon,
  Business,
  CheckLineIcon,
  DocsIcon,
  MapIcon,
} from "../icons/index";
import { useAuth } from "@/app/auth/useAuth";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations("Dashboard.nav");
  const { user } = useAuth();

  const isVisible = isExpanded || isHovered || isMobileOpen;

  // ── Nav groups ────────────────────────────────────────────────────
  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        label: t("menu"),
        items: [
          {
            icon: <GridIcon />,
            name: t("dashboard"),
            path: "/dashboard",
          },
          {
            icon: <PieChartIcon />,
            name: t("reports"),
            path: "/reports",
          },
          {
            icon: <ShootingStarIcon />,
            name: t("insights"),
            path: "/insights",
          },
        ],
      },
      {
        label: "People",
        items: [
          {
            icon: <GroupIcon />,
            name: t("usersGroup"),
            subItems: [
              { name: t("customers"), path: "/customers" },
              { name: t("cleaners"), path: "/cleaners" },
              { name: t("team"), path: "/team" },
            ],
          },
        ],
      },
      {
        label: "Scheduling",
        items: [
          {
            icon: <CalenderIcon />,
            name: t("calendar"),
            path: "/calendar",
          },
          {
            icon: <TableIcon />,
            name: t("bookings"),
            path: "/bookings",
          },
          {
            icon: <HorizontaLDots />,
            name: t("dispatch"),
            path: "/dispatch",
          },
          {
            icon: <MapIcon />,
            name: t("liveMap"),
            path: "/live-map",
          },
          {
            icon: <TaskIcon />,
            name: t("recurringSchedules"),
            path: "/recurring-schedules",
          },
          {
            icon: <ListIcon />,
            name: t("bookingQuestions"),
            path: "/booking-questions",
          },
          {
            icon: <EnvelopeIcon />,
            name: t("waitlist"),
            path: "/waitlist",
          },
          {
            icon: <CalenderIcon />,
            name: t("leave"),
            path: "/leave",
          },
        ],
      },
      {
        label: "Operations",
        items: [
          {
            icon: <CheckLineIcon />,
            name: t("checklistTemplates"),
            path: "/checklist-templates",
          },
          {
            icon: <FileIcon />,
            name: t("cleanerDocuments"),
            path: "/cleaner-documents",
          },
          {
            icon: <BoxCubeIcon />,
            name: t("inventory"),
            path: "/inventory",
          },
          {
            icon: <DocsIcon />,
            name: t("compliance"),
            path: "/compliance",
          },
        ],
      },
      {
        label: "Finance",
        items: [
          {
            icon: <DollarLineIcon />,
            name: t("transactions"),
            path: "/transactions",
          },
          {
            icon: <DollarLineIcon />,
            name: t("payroll"),
            path: "/payroll",
          },
          {
            icon: <ShootingStarIcon />,
            name: t("vouchers"),
            subItems: [
              { name: t("giftCards"), path: "/gift-cards" },
              { name: t("coupons"), path: "/coupons" },
              { name: t("referrals"), path: "/referrals" },
            ],
          },
        ],
      },
      {
        label: "Support",
        items: [
          {
            icon: <FileIcon />,
            name: t("reviews"),
            path: "/reviews",
          },
          {
            icon: <EnvelopeIcon />,
            name: t("supportTickets"),
            path: "/support-tickets",
          },
          {
            icon: <ChatIcon />,
            name: t("messages"),
            path: "/messages",
          },
        ],
      },
      {
        label: t("others"),
        items: [
          {
            icon: <Business />,
            name: t("businessGroup"),
            subItems: [
              { name: t("businessSettings"), path: "/business-settings" },
              { name: t("pricing"), path: "/pricing" },
              { name: t("services"), path: "/services" },
              { name: t("website"), path: "/website" },
              { name: t("auditTrail"), path: "/audit-trail" },
            ],
          },
          {
            icon: <BellIcon />,
            name: t("notifications"),
            path: "/notifications",
          },
          {
            icon: <UserCircleIcon />,
            name: t("userProfile"),
            path: "/profile",
          },
        ],
      },
    ],
    [t]
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    groupIndex: number;
    itemIndex: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      if (path === "/admin") return pathname === "/admin";
      return pathname === path || Boolean(pathname?.startsWith(path + "/"));
    },
    [pathname]
  );

  // Auto-open the submenu whose child matches the current route
  useEffect(() => {
    let matched = false;
    navGroups.forEach((group, gi) => {
      group.items.forEach((nav, ii) => {
        if (nav.subItems?.some((sub) => isActive(sub.path))) {
          setOpenSubmenu({ groupIndex: gi, itemIndex: ii });
          matched = true;
        }
      });
    });
    if (!matched) setOpenSubmenu(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.groupIndex}-${openSubmenu.itemIndex}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (groupIndex: number, itemIndex: number) => {
    setOpenSubmenu((prev) => {
      if (prev?.groupIndex === groupIndex && prev?.itemIndex === itemIndex) {
        return null;
      }
      return { groupIndex, itemIndex };
    });
  };

  const isSubmenuOpen = (gi: number, ii: number) =>
    openSubmenu?.groupIndex === gi && openSubmenu?.itemIndex === ii;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[280px]" : isHovered ? "w-[280px]" : "w-[88px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-6 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
      >
        <Link href="/">
          {isVisible ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={140}
                height={36}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={140}
                height={36}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1 pb-6">
        <nav>
          <div className="flex flex-col gap-1">
            {navGroups.map((group, gi) => (
              <div key={gi} className="mb-3">
                {/* Group label */}
                {isVisible ? (
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {group.label}
                  </p>
                ) : (
                  <div className="flex justify-center mb-2">
                    <span className="block w-5 border-t border-gray-200 dark:border-gray-700" />
                  </div>
                )}

                <ul className="flex flex-col gap-0.5">
                  {group.items.map((nav, ii) => (
                    <li key={`${gi}-${ii}-${nav.path ?? nav.name}`}>
                      {nav.subItems ? (
                        <>
                          <button
                            onClick={() => handleSubmenuToggle(gi, ii)}
                            className={`menu-item group w-full ${
                              isSubmenuOpen(gi, ii)
                                ? "menu-item-active"
                                : "menu-item-inactive"
                            } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                          >
                            <span
                              className={
                                isSubmenuOpen(gi, ii)
                                  ? "menu-item-icon-active"
                                  : "menu-item-icon-inactive"
                              }
                            >
                              {nav.icon}
                            </span>
                            {isVisible && (
                              <>
                                <span className="menu-item-text flex-1 text-left">
                                  {nav.name}
                                </span>
                                <ChevronDownIcon
                                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                                    isSubmenuOpen(gi, ii)
                                      ? "rotate-180 text-brand-500"
                                      : "text-gray-400"
                                  }`}
                                />
                              </>
                            )}
                          </button>

                          {isVisible && (
                            <div
                              ref={(el) => {
                                subMenuRefs.current[`${gi}-${ii}`] = el;
                              }}
                              className="overflow-hidden transition-all duration-300"
                              style={{
                                height: isSubmenuOpen(gi, ii)
                                  ? `${subMenuHeight[`${gi}-${ii}`]}px`
                                  : "0px",
                              }}
                            >
                              <ul className="mt-1 space-y-0.5 ml-9 pr-1">
                                {nav.subItems.map((subItem) => (
                                  <li key={subItem.path}>
                                    <Link
                                      href={subItem.path}
                                      className={`menu-dropdown-item ${
                                        isActive(subItem.path)
                                          ? "menu-dropdown-item-active"
                                          : "menu-dropdown-item-inactive"
                                      }`}
                                    >
                                      {subItem.name}
                                      <span className="flex items-center gap-1 ml-auto">
                                        {subItem.new && (
                                          <span
                                            className={`ml-auto ${
                                              isActive(subItem.path)
                                                ? "menu-dropdown-badge-active"
                                                : "menu-dropdown-badge-inactive"
                                            } menu-dropdown-badge`}
                                          >
                                            new
                                          </span>
                                        )}
                                        {subItem.pro && (
                                          <span
                                            className={`ml-auto ${
                                              isActive(subItem.path)
                                                ? "menu-dropdown-badge-active"
                                                : "menu-dropdown-badge-inactive"
                                            } menu-dropdown-badge`}
                                          >
                                            pro
                                          </span>
                                        )}
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        nav.path && (
                          <Link
                            href={nav.path}
                            className={`menu-item group ${
                              isActive(nav.path)
                                ? "menu-item-active"
                                : "menu-item-inactive"
                            } ${!isExpanded && !isHovered ? "lg:justify-center" : ""}`}
                          >
                            <span
                              className={
                                isActive(nav.path)
                                  ? "menu-item-icon-active"
                                  : "menu-item-icon-inactive"
                              }
                            >
                              {nav.icon}
                            </span>
                            {isVisible && (
                              <span className="menu-item-text">{nav.name}</span>
                            )}
                          </Link>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
