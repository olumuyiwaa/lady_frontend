"use client";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import Link from "next/link";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export type StatsSeries = {
  name: string;
  data: number[];
};

type Props = {
  title?: string;
  subtitle?: string;
  categories?: string[];
  series?: StatsSeries[];
  viewMoreLabel?: string;
  emptyMessage?: string;
  viewMoreHref?: string;
  height?: number;
  formatY?: (n: number) => string;
};

const DEFAULT_CATS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function StatisticsChart({
  title = "Statistics",
  subtitle = "Jobs and revenue over time",
  categories,
  series,
  viewMoreLabel = "View reports",
  emptyMessage = "No statistics for this period.",
  viewMoreHref = "/reports",
  height = 310,
  formatY,
}: Props) {
  const cats = categories?.length ? categories : DEFAULT_CATS;
  const chartSeries =
    series && series.length > 0
      ? series
      : [
          { name: "Jobs", data: Array(cats.length).fill(0) },
          { name: "Revenue", data: Array(cats.length).fill(0) },
        ];

  const empty = chartSeries.every((s) => s.data.every((v) => !v));

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height,
      type: "area",
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) =>
          formatY ? formatY(val) : String(Math.round(val)),
      },
    },
    xaxis: {
      type: "category",
      categories: cats,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: ["#6B7280"] },
        formatter: (val: number) =>
          formatY ? formatY(val) : String(Math.round(val)),
      },
      title: { text: "", style: { fontSize: "0px" } },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {subtitle}
          </p>
        </div>
        {viewMoreHref && (
          <Link
            href={viewMoreHref}
            className="shrink-0 text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            {viewMoreLabel}
          </Link>
        )}
      </div>

      {empty ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[640px] xl:min-w-full">
            <Chart
              options={options}
              series={chartSeries}
              type="area"
              height={height}
            />
          </div>
        </div>
      )}
    </div>
  );
}
