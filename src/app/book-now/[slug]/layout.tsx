import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a cleaning",
  description: "Schedule your cleaning online — instant quote and real-time availability.",
};

/**
 * Public booking layout — no dashboard chrome.
 * Root layout still wraps ThemeProvider etc.; this just keeps the page clean.
 */
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBFBF8] text-gray-900">
      {children}
    </div>
  );
}
