"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import Link from "next/link";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type SalesSeriesPoint = {
  /** Category label (e.g. month or date) */
  label: string;
  /** Numeric value — jobs count or currency units (not cents) */
  value: number;
};

type Props = {
  title?: string;
  seriesName?: string;
  data?: SalesSeriesPoint[];
  /** Format y tooltip (default: raw number) */
  formatValue?: (n: number) => string;
  viewMoreLabel?: string;
  emptyMessage?: string;
  viewMoreHref?: string;
  height?: number;
};

const DEFAULT_CATEGORIES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function MonthlySalesChart({
  title = "Monthly revenue",
  seriesName = "Revenue",
  data,
  formatValue,
  viewMoreLabel = "View more",
  emptyMessage = "No data for this period.",
  viewMoreHref = "/reports",
  height = 180,
}: Props) {
  const categories = data?.length ? data.map((d) => d.label) : DEFAULT_CATEGORIES;
  const values = data?.length ? data.map((d) => d.value) : Array(12).fill(0);
  const empty = !data?.length || values.every((v) => !v);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: { text: undefined },
      labels: {
        formatter: (val: number) =>
          formatValue ? formatValue(val) : String(Math.round(val)),
      },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: true },
      y: {
        formatter: (val: number) =>
          formatValue ? formatValue(val) : `${val}`,
      },
    },
  };

  const series = [{ name: seriesName, data: values }];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {viewMoreHref && (
          <Link
            href={viewMoreHref}
            className="text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            {viewMoreLabel}
          </Link>
        )}
      </div>

      {empty ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
            <ReactApexChart
              options={options}
              series={series}
              type="bar"
              height={height}
            />
          </div>
        </div>
      )}
    </div>
  );
}
