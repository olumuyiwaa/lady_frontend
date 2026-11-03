"use client";

import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/app/api/authFetch";
import Link from "next/link";
import {DocsIcon, Business, FileIcon, FolderIcon, GroupIcon, ListIcon, UserIcon} from "@/icons";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  status: string;
  badge: string;
  url: string;
  meta?: Record<string, any>;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onResultClick?: (item: SearchResult) => void;
}

const RESOURCE_ICONS: Record<string, any> = {
  NURSE: UserIcon,
  FACILITY: Business,
  CASE: ListIcon,
  SHIFT: FolderIcon,
  CREDENTIAL: FileIcon,
  INVOICE: DocsIcon,
  USER: GroupIcon,
};

export default function SearchModal({ isOpen, onClose, initialQuery = "",onResultClick }: SearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const performSearch = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setResults({});
      return;
    }
    setLoading(true);
    try {
      const response = await authFetch(`/search?q=${searchTerm}`);
      if (response.success) {
        setResults(response.data.results);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, performSearch]);

  if (!isOpen) return null;

  const categories = Object.keys(results);
  const displayedResults = activeTab === "ALL"
    ? Object.values(results).flat()
    : results[activeTab] || [];

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center bg-gray-900/50 p-4 pt-[10vh] backdrop-blur-sm sm:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">

        {/* Search Input Area */}
        <div className="relative flex items-center border-b border-gray-100 p-4 dark:border-gray-800">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            autoFocus
            className="flex-1 bg-transparent px-4 text-lg text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
            placeholder="Search cleaners, facilities, cases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>}
          <button onClick={onClose}
                  className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b border-gray-100 px-4 py-2 dark:border-gray-800">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "ALL" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              All Results
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {cat} ({results[cat].length})
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {displayedResults.length > 0 ? (
            displayedResults.map((item) => {
              const Icon = RESOURCE_ICONS[item.type] || <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                      onResultClick?.(item);
                      onClose();
                    }}
                  className="group flex items-center gap-4 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-500 group-hover:bg-white dark:border-gray-800 dark:bg-gray-900">
                    <Icon/>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{item.subtitle}</p>
                  </div>
                  {item.status && (
                    <span className="text-[11px] font-medium text-gray-400">{item.status}</span>
                  )}
                </button>
              );
            })
          ) : query.length >= 2 && !loading ? (
            <div className="py-12 text-center text-gray-500">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p className="mt-2 text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm italic">Start typing to search across the platform...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-2 text-[10px] text-gray-400 dark:bg-gray-900/50">
          Tip: Press <kbd className="font-sans font-bold">ESC</kbd> to close.
        </div>
      </div>
    </div>
  );
}