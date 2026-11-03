"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { formatMoneyUnits } from "@/app/services/currency";
import { useActiveCurrency } from "@/app/services/useActiveCurrency";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RevenueBarChartProps {
  data: {
    month: string;
    grossRevenue: number;
  }[];
  byBusiness?: Array<{
    businessId: string;
    businessName: string;
    invoiceCount: number;
    totalRevenue: number;
  }>;
}

export default function RevenueBarChart({ data = [], byBusiness = [] }: RevenueBarChartProps) {
  const currency = useActiveCurrency();
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const fullYearData = monthNames.map((shortMonth, index) => {
    const matchingRecord = data.find((item) => {
      const monthNum = parseInt(item.month?.split("-")[1] || "0");
      return monthNum === index + 1;
    });

    return {
      month: shortMonth,
      grossRevenue: matchingRecord ? Number(matchingRecord.grossRevenue || 0) : 0,
    };
  });

  if (data.length === 0 && byBusiness.length === 0) {
    return (
        <div className="h-[250px] flex items-center justify-center text-gray-400 dark:text-gray-500">
          No revenue data available for the selected period.
        </div>
    );
  }

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 250, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "45%", borderRadius: 6, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ["transparent"] },
    xaxis: { categories: monthNames, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (val: number) => formatMoneyUnits(val, currency, { whole: true }) } },
    grid: { strokeDashArray: 5, yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: (val: number) => formatMoneyUnits(val, currency) } },
  };

  const series = [{ name: "Gross Revenue", data: fullYearData.map(d => d.grossRevenue) }];

  return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <div className="xl:col-span-2">
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[700px]">
              <ReactApexChart
                  options={options}
                  series={series}
                  type="bar"
                  height={320}
              />
            </div>
          </div>
        </div>

        {/* Top Facilities by Revenue */}
        {byBusiness && byBusiness.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white flex items-center gap-2">
                🏁 Top Facilities
              </h3>

              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <tbody>
                  {byBusiness.slice(0, 5).map((f, index) => (
                      <tr
                          key={f.businessId}
                          className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        <td className="px-3 py-2 w-8 font-medium text-gray-800 dark:text-white ">
                          #{index + 1}
                        </td>

                        <td className="px-3 py-2 truncate max-w-[150px] text-gray-800 dark:text-white ">
                          {f.businessName}
                        </td>

                        <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                          {formatMoneyUnits(Math.round(f.totalRevenue), currency, { whole: true })}
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {byBusiness.length > 5 && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Top 5 of {byBusiness.length}
                  </p>
              )}
            </div>
        )}
      </div>
  );
}