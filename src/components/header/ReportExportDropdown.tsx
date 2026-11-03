"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { authFetch } from "@/app/api/authFetch";
import {DownloadIcon, FileIcon, ListIcon, MoreDotIcon, TableIcon} from "@/icons";

type ReportType =
    | "dashboard"
    | "shifts"
    | "revenue"
    | "workers"
    | "billing"
    | "credentials";

export default function ReportExportDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("dashboard");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function exportReport(format: "csv" | "xlsx" | "pdf") {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        ...(from && { from }),
        ...(to && { to }),
      });

      const endpointMap: Record<ReportType, string> = {
        dashboard: "/reports/dashboard",
        shifts: "/reports/shifts",
        revenue: "/reports/revenue",
        workers: "/reports/workers",
        billing: "/reports/billing",
        credentials: "/reports/credentials/expiry",
      };

      const result = await authFetch(
          `${endpointMap[reportType]}?${query.toString()}`
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      switch (format) {
        case "csv":
          exportToCsv(result.data, reportType);
          break;

        case "xlsx":
          exportToExcel(result.data, reportType);
          break;

        case "pdf":
          exportToPdf(result.data, reportType);
          break;
      }

      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to export report");
    } finally {
      setLoading(false);
    }
  }

  function exportToCsv(data: any, reportName: string) {
    const rows = flattenData(data);

    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
          headers
              .map((header) =>
                  JSON.stringify(row[header] ?? "")
              )
              .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `${reportName}-${Date.now()}.csv`;

    link.click();
  }

  function exportToExcel(data: any, reportName: string) {
    const rows = flattenData(data);

    const worksheet =
        XLSX.utils.json_to_sheet(rows);

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Report"
    );

    XLSX.writeFile(
        workbook,
        `${reportName}-${Date.now()}.xlsx`
    );
  }

  function exportToPdf(data: any, reportName: string) {
    const rows = flattenData(data);

    const doc = new jsPDF();

    autoTable(doc, {
      head: [Object.keys(rows[0] || {})],
      body: rows.map((row) => Object.values(row)),
    });

    doc.save(
        `${reportName}-${Date.now()}.pdf`
    );
  }

  function flattenData(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    const rows: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          rows.push({
            section: key,
            ...(typeof item === "object"
                ? item
                : { value: item }),
          });
        });
      } else if (
          value &&
          typeof value === "object"
      ) {
        rows.push({
          section: key,
          ...value,
        });
      } else {
        rows.push({
          section: key,
          value,
        });
      }
    });

    return rows;
  }

  return (
      <div className="relative">
        <button
            // className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            className={`dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200
          ${isOpen
                ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            aria-label="Download Reports"
        >
          {loading ? <MoreDotIcon/> : <DownloadIcon />}
        </button>

        <Dropdown
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-800 dark:bg-gray-950"
        >
          {/* Header */}
          <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Export Report
            </h3>
            <p className="text-xs text-gray-500">Select parameters and file format</p>
          </div>

          <div className="p-4">
            {/* Report Type Selection */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Report Type
              </label>
              <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="dashboard">Dashboard Summary</option>
                <option value="shifts">Shift Analytics</option>
                <option value="revenue">Revenue Report</option>
                <option value="workers">Worker Activity</option>
                <option value="billing">Billing Report</option>
                <option value="credentials">Credential Expiry</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Date Range (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-900 outline-none focus:border-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-900 outline-none focus:border-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Select Format
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                    onClick={() => exportReport("pdf")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-md bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/10 dark:text-rose-400"
                >
                  <FileIcon />
                  PDF Document
                </button>

                <button
                    onClick={() => exportReport("xlsx")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-500/10 dark:text-emerald-400"
                >
                  <TableIcon />
                  Excel Sheet
                </button>

                <button
                    onClick={() => exportReport("csv")}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-500/10 dark:text-blue-400"
                >
                  <ListIcon />
                  CSV (Data Only)
                </button>
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
  );
}