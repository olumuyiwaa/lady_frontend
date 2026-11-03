"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";

export type MetricCard = {
  label: string;
  value: string;
  /** Positive = up, negative = down; omit to hide badge */
  deltaPct?: number | null;
  href?: string;
};

type Props = {
  metrics?: MetricCard[];
};

const DEFAULT: MetricCard[] = [
  { label: "Customers", value: "—" },
  { label: "Jobs", value: "—" },
];

export const EcommerceMetrics = ({ metrics }: Props) => {
  const cards = metrics && metrics.length > 0 ? metrics : DEFAULT;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {cards.map((m) => {
        const hasDelta = typeof m.deltaPct === "number" && !Number.isNaN(m.deltaPct);
        const up = hasDelta && (m.deltaPct as number) >= 0;
        const inner = (
          <>
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
              {m.label.toLowerCase().includes("customer") ||
              m.label.toLowerCase().includes("klant") ? (
                <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
              ) : (
                <BoxIconLine className="text-gray-800 dark:text-white/90" />
              )}
            </div>

            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{m.label}</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {m.value}
                </h4>
              </div>
              {hasDelta && (
                <Badge color={up ? "success" : "error"}>
                  {up ? <ArrowUpIcon /> : <ArrowDownIcon className="text-error-500" />}
                  {Math.abs(m.deltaPct as number).toFixed(1)}%
                </Badge>
              )}
            </div>
          </>
        );

        if (m.href) {
          return (
            <a
              key={m.label}
              href={m.href}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:border-brand-300 transition"
            >
              {inner}
            </a>
          );
        }

        return (
          <div
            key={m.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
};

export default EcommerceMetrics;
