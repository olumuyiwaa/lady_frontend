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
  BoltIcon,
  Business,
} from "../icons/index";
import { useAuth } from "@/app/auth/useAuth";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations("Dashboard.nav");

  const { user } = useAuth();

  // ── Business portal nav ──────────────────────────────────────────
  const businessNavItems: NavItem[] = useMemo(
    () => [
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
        icon: <GroupIcon />,
        name: t("usersGroup"),
        subItems: [
          { name: t("customers"), path: "/customers" },
          { name: t("cleaners"), path: "/cleaners" },
          { name: t("team"), path: "/team" },
        ],
      },
      {
        icon: <TableIcon />,
        name: t("bookingSchedulesGroup"),
        subItems: [
          { name: t("calendar"), path: "/calendar" },
          { name: t("bookings"), path: "/bookings" },
          { name: t("bookingQuestions"), path: "/booking-questions" },
          { name: t("dispatch"), path: "/dispatch" },
          { name: t("liveMap"), path: "/live-map" },
          { name: t("recurringSchedules"), path: "/recurring-schedules" },
        ],
      },
      {
        icon: <FileIcon />,
        name: t("cleanerDocuments"),
        path: "/cleaner-documents",
      },
      {
        icon: <FileIcon />,
        name: t("reviews"),
        path: "/reviews",
      },
      {
        icon: <ShootingStarIcon />,
        name: t("vouchers"),
        subItems: [
          { name: t("giftCards"), path: "/gift-cards",},
          { name: t("coupons"), path: "/coupons", },
        ],
      },
      {
        icon: <TaskIcon />,
        name: t("waitlist"),
        path: "/waitlist",
      },
      {
        icon: <ListIcon />,
        name: t("checklistTemplates"),
        path: "/checklist-templates",
      },
      {
        icon: <EnvelopeIcon />,
        name: t("supportTickets"),
        path: "/support-tickets",
      },
      {
        icon: <DollarLineIcon />,
        name: t("payroll"),
        path: "/payroll",
      },
      {
        icon: <ListIcon />,
        name: t("transactions"),
        path: "/transactions",
      },
    ],
    [t]
  );

  const businessOthersItems: NavItem[] = useMemo(
    () => [
      {
        icon: <UserCircleIcon />,
        name: t("userProfile"),
        path: "/profile",
      },
      {
        icon: <Business />,
        name: t("businessGroup"),
        subItems: [
          { name: t("businessSettings"), path: "/business-settings" },
          { name: t("pricing"), path: "/pricing" },
          { name: t("website"), path: "/website" },
          { name: t("services"), path: "/services" },
          { name: t("inventory"), path: "/inventory" },
          { name: t("compliance"), path: "/compliance" },
          { name: t("auditTrail"), path: "/audit-trail" },
        ],
      },
      {
        icon: <BellIcon />,
        name: t("notifications"),
        path: "/notifications",
      },
      {
        icon: <ChatIcon />,
        name: t("messages"),
        path: "/messages",
      },
    ],
    [t]
  );


  const navItems = businessNavItems;
  const othersItems = businessOthersItems;

  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={`${menuType}-${index}-${nav.path ?? nav.name}`}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
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
                            } menu-dropdown-badge `}
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
                            } menu-dropdown-badge `}
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
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Exact match for most routes; /admin overview needs exact so sub-routes
  // don't keep "Overview" highlighted.
  const isActive = useCallback(
    (path: string) => {
      if (path === "/admin") return pathname === "/admin";
      return pathname === path || Boolean(pathname?.startsWith(path + "/"));
    },
    [pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isActive, navItems, othersItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href={"/"}>
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
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
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("menu")
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("others")
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
