"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import Link from "next/link";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type Props = {
  title?: string;
  subtitle?: string;
  /** 0–100 */
  progressPct?: number;
  targetLabel?: string;
  targetValue?: string;
  revenueLabel?: string;
  revenueValue?: string;
  todayLabel?: string;
  todayValue?: string;
  detailsLabel?: string;
  footerNote?: string;
  viewMoreHref?: string;
};

export default function MonthlyTarget({
  title = "Completion rate",
  subtitle = "Share of jobs completed in the last 30 days",
  progressPct = 0,
  targetLabel = "Target",
  targetValue = "—",
  revenueLabel = "Revenue",
  revenueValue = "—",
  todayLabel = "Today",
  todayValue = "—",
  detailsLabel = "Details",
  footerNote,
  viewMoreHref = "/reports",
}: Props) {
  const pct = Math.max(0, Math.min(100, Number(progressPct) || 0));
  const series = [Math.round(pct * 100) / 100];

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: "80%" },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
    labels: ["Progress"],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {title}
            </h3>
            <p className="mt-1 font-normal text-gray-500 text-theme-sm dark:text-gray-400">
              {subtitle}
            </p>
          </div>
          {viewMoreHref && (
            <Link
              href={viewMoreHref}
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              {detailsLabel}
            </Link>
          )}
        </div>
        <div className="relative">
          <div className="max-h-[330px]">
            <ReactApexChart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>
        </div>
        {footerNote && (
          <p className="mx-auto mt-6 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
            {footerNote}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            {targetLabel}
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {targetValue}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800" />

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            {revenueLabel}
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {revenueValue}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800" />

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            {todayLabel}
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {todayValue}
          </p>
        </div>
      </div>
    </div>
  );
}
