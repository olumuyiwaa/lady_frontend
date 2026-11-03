"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { MoreDotIcon } from "@/icons";

export interface RowAction {
  label: string;
  onClick: () => void;
  /** "danger" renders the item in the same red used for destructive actions
   *  elsewhere in the app (e.g. the old inline "Offboard" link). */
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface RowActionsMenuProps {
  actions: RowAction[];
  /** Accessible label for the trigger button — ideally naming the row,
   *  e.g. `Actions for ${cleanerDisplayName(c)}`. */
  label?: string;
}

const MENU_WIDTH = 176; // matches w-44 below

/**
 * The single "Actions" cell control used across every dashboard table: one
 * vertical-dots (⋮) button that opens a menu of the actions available for
 * that row, replacing what used to be separate inline buttons/links crammed
 * into the last column.
 *
 * Renders the menu in a portal to document.body, positioned from the
 * trigger's own bounding rect, rather than as a plain absolutely-positioned
 * child sitting inside the table's own DOM. Every dashboard table wraps its
 * <Table> in a `max-w-full overflow-x-auto` div (see e.g.
 * (dashboard)/cleaners/page.tsx and every other page listed below) — per the
 * CSS spec, setting overflow-x to anything but `visible` makes the browser
 * compute overflow-y as `auto` too, even though only overflow-x was set.
 * That means a plain in-flow dropdown gets silently clipped for any row
 * whose menu would open below the table's visible bounds — usually the
 * last few rows on the page, which is exactly where this would go unnoticed
 * in a quick check with only a couple of rows of data. The portal sidesteps
 * that: the menu is positioned in the viewport, not inside the scrolling
 * container, so it can't be clipped by it.
 */
export default function RowActionsMenu({ actions, label = "Actions" }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const estimatedHeight = Math.min(actions.length * 40 + 16, 320);
      const spaceBelow = window.innerHeight - rect.bottom;
      // Flip the menu above the trigger when there isn't room below —
      // matters most for rows near the bottom of a long table.
      const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
      setCoords({
        top: openUpward ? rect.top - estimatedHeight - 4 : rect.bottom + 4,
        left: Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8),
      });
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      close();
    };
    // A scroll (the table's own horizontal scrollbar, or the page) or a
    // resize invalidates the coordinates computed at open time. Rather than
    // track and re-measure the trigger live, just close the menu — the same
    // thing most native menus do.
    const handleScrollOrResize = () => close();

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={actions.length === 0}
        onClick={(e) => {
          // Some tables (support-tickets, etc.) make the whole <tr>
          // clickable to open a detail view. Without stopping propagation
          // here, clicking the actions trigger would open that detail view
          // at the same time as the menu.
          e.stopPropagation();
          isOpen ? close() : openMenu();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
      >
        <MoreDotIcon />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="z-50 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
          >
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onClick={(e) => {
                  // React bubbles portal events through the React tree, not
                  // the DOM tree — without this, selecting an item here
                  // would still bubble up to a clickable-row onClick (see
                  // the trigger button's comment above) even though this
                  // menu physically renders outside the <tr> in the DOM.
                  e.stopPropagation();
                  close();
                  action.onClick();
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  action.variant === "danger"
                    ? "text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
