"use client";

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { authFetch } from "@/app/api/authFetch";

// ─── Types ────────────────────────────────────────────────────

export type SearchSelectType = "cleaner" | "business" | "case" | "shift" | "user";

interface SearchHit {
    id:       string;
    title:    string;
    subtitle: string;
    badge:    string;
    status:   string;
}

interface SearchSelectProps {
    label:       string;
    placeholder?: string;
    type:        SearchSelectType;
    onSelect:    (id: string, hit: SearchHit) => void;
    onClear:     () => void;
    disabled?:   boolean;
    className?:  string;
}

// ─── Endpoint map ─────────────────────────────────────────────

const TYPE_TO_RESOURCE: Record<SearchSelectType, string> = {
    cleaner:    "NURSE",
    business: "FACILITY",
    case:     "CASE",
    shift:    "SHIFT",
    user:     "USER",
};

// ─── Debounce hook ────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

// ─── Badge colour per resource type ──────────────────────────

function getBadgeClass(type: SearchSelectType): string {
    switch (type) {
        case "cleaner":    return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
        case "business": return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300";
        case "case":     return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
        case "shift":    return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300";
        case "user":     return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
        default:         return "bg-gray-100 text-gray-600";
    }
}

// ─── Component ────────────────────────────────────────────────

export default function SearchSelect({
                                         label,
                                         placeholder = "Search...",
                                         type,
                                         onSelect,
                                         onClear,
                                         disabled = false,
                                         className = "",
                                     }: SearchSelectProps) {
    const [query, setQuery]         = useState("");
    const [hits, setHits]           = useState<SearchHit[]>([]);
    const [loading, setLoading]     = useState(false);
    const [open, setOpen]           = useState(false);
    const [selected, setSelected]   = useState<SearchHit | null>(null);
    const [error, setError]         = useState<string | null>(null);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef   = useRef<HTMLInputElement>(null);

    const debouncedQuery = useDebounce(query, 280);
    const resourceType   = TYPE_TO_RESOURCE[type];

    // ── Fetch results ─────────────────────────────────────────
    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setHits([]);
            setOpen(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await authFetch(
                `/search?q=${encodeURIComponent(q)}&types=${resourceType}&limit=8`,
                { method: "GET" }
            );

            if (!res.success) throw new Error(res.message || "Search failed");

            const results: SearchHit[] =
                (res.data?.results?.[resourceType] ?? []) as SearchHit[];

            setHits(results);
            setOpen(results.length > 0);
        } catch {
            setError("Search unavailable");
            setHits([]);
        } finally {
            setLoading(false);
        }
    }, [resourceType]);

    useEffect(() => {
        if (!selected) search(debouncedQuery);
    }, [debouncedQuery, search, selected]);

    // ── Close on outside click ────────────────────────────────
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ── Keyboard navigation ───────────────────────────────────
    const [highlightIdx, setHighlightIdx] = useState(-1);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, hits.length - 1)); }
        if (e.key === "ArrowUp")   { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && highlightIdx >= 0) { e.preventDefault(); pick(hits[highlightIdx]); }
        if (e.key === "Escape")    { setOpen(false); }
    };

    // ── Select / clear ────────────────────────────────────────
    const pick = (hit: SearchHit) => {
        setSelected(hit);
        setQuery(hit.title);
        setOpen(false);
        setHighlightIdx(-1);
        onSelect(hit.id, hit);
    };

    const clear = () => {
        setSelected(null);
        setQuery("");
        setHits([]);
        setOpen(false);
        onClear();
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const badgeClass = getBadgeClass(type);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Label */}
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {label}
            </label>

            {/* Input */}
            <div className="relative">
                {/* Search icon */}
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </span>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    disabled={disabled}
                    placeholder={selected ? "" : placeholder}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (selected) { setSelected(null); onClear(); }
                        setHighlightIdx(-1);
                    }}
                    onFocus={() => { if (hits.length > 0 && !selected) setOpen(true); }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    className={[
                        "h-11 w-full rounded-lg border pl-9 pr-8 py-2.5 text-sm",
                        "placeholder:text-gray-400 focus:outline-none focus:ring-3",
                        "dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
                        selected
                            ? "border-brand-400 bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500 focus:ring-brand-500/10"
                            : "border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800",
                        disabled ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                />

                {/* Loading spinner / clear button */}
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading ? (
              <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
          ) : (query || selected) ? (
              <button
                  type="button"
                  onClick={clear}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label="Clear"
              >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
              </button>
          ) : null}
        </span>
            </div>

            {/* Selected badge shown below input */}
            {selected && (
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
          <span className={`mr-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
            {selected.badge}
          </span>
                    {selected.subtitle}
                </p>
            )}

            {/* Error */}
            {error && !open && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}

            {/* Dropdown */}
            {open && hits.length > 0 && (
                <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <ul className="max-h-64 overflow-y-auto py-1">
                        {hits.map((hit, idx) => (
                            <li key={hit.id}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); pick(hit); }}
                                    onMouseEnter={() => setHighlightIdx(idx)}
                                    className={[
                                        "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors",
                                        idx === highlightIdx
                                            ? "bg-brand-50 dark:bg-brand-500/10"
                                            : "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                                    ].join(" ")}
                                >
                                    {/* Badge */}
                                    <span className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                    {hit.badge}
                  </span>

                                    {/* Text */}
                                    <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {hit.title}
                    </span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                      {hit.subtitle}
                    </span>
                  </span>

                                    {/* Status dot */}
                                    {hit.status && hit.status !== "ACTIVE" && (
                                        <span className="mt-1 flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {hit.status}
                    </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Hint */}
                    <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-800">
                        <p className="text-[11px] text-gray-400">
                            ↑↓ navigate · Enter select · Esc close
                        </p>
                    </div>
                </div>
            )}

            {/* No results */}
            {open && hits.length === 0 && !loading && debouncedQuery.length >= 2 && (
                <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No {type}s found for &ldquo;{debouncedQuery}&rdquo;
                    </p>
                </div>
            )}
        </div>
    );
}