"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export const TOKENS = `
  :root {
    --navy-950: #080f1e;
    --navy-900: #0d1829;
    --navy-800: #162038;
    --navy-700: #1e2e50;
    --navy-600: #253968;
    --navy-500: #2d4580;
    --navy-400: #4a6299;
    --navy-300: #6b84b8;
    --navy-200: #9db0d4;
    --navy-100: #d0dbee;
    --navy-50:  #eef2f8;

    --gold-600: #9a6f1a;
    --gold-500: #c49222;
    --gold-400: #d4a72c;
    --gold-300: #e4bf4a;
    --gold-200: #f0d078;
    --gold-100: #f8eabc;
    --gold-50:  #fdf7e6;

    --white:        #ffffff;
    --surface:      #f4f7fc;
    --border:       #d8e2f0;
    --text-body:    #374151;
    --text-muted:   #6b7280;

    --font-display: 'DM Serif Display', Georgia, serif;
    --font-body:    'DM Sans', system-ui, sans-serif;
    --font-mono:    'JetBrains Mono', monospace;

    --radius-sm:  6px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --radius-xl: 32px;

    --shadow-sm:   0 1px 3px rgba(8,15,30,.07);
    --shadow-md:   0 4px 16px rgba(8,15,30,.09);
    --shadow-lg:   0 12px 40px rgba(8,15,30,.14);
    --shadow-gold: 0 4px 24px rgba(196,146,34,.25);
  }
`;

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: var(--surface); color: var(--navy-900); }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
  .fade-up { animation: fadeUp .45s ease both; }
`;

// ─── Nav items ────────────────────────────────────────────────

const NAV_ITEMS = [
    { label: "Dashboard", href: "/" },
    { label: "Support", href: "/support" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
] as const;

type ActivePage = "" | "dashboard" | "support" | "privacy" | "terms";

// ─── Header ───────────────────────────────────────────────────

interface SiteHeaderProps {
    activePage?: ActivePage;
}

export function SiteHeader({ activePage = "" }: SiteHeaderProps) {
    const active = activePage.toLowerCase();

    return (
        <nav
            style={{
                position: "sticky",
                top: 0,
                zIndex: 100,
                background: "rgba(8,15,30,.95)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255,255,255,.06)",
                padding: "0 40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: "64px",
            }}
        >
            {/* Brand */}
            <Link
                href="/"
                style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
            >
                <Image
                    width={32}
                    height={32}
                    src="/images/logo/logo-icon.svg"
                    alt=""
                    style={{ display: "block" }}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                />
                <span
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "18px",
                        color: "var(--white)",
                        letterSpacing: "-0.01em",
                    }}
                >
          Trabajo Hub
        </span>
            </Link>

            {/* Links */}
            <div style={{ display: "flex", gap: "4px" }}>
                {NAV_ITEMS.map(({ label, href }) => {
                    const isActive = active === label.toLowerCase();
                    return (
                        <a
                            key={label}
                            href={href}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? "var(--gold-300)" : "rgba(255,255,255,.6)",
                                background: isActive ? "rgba(196,146,34,.12)" : "none",
                                textDecoration: "none",
                                transition: "color .2s, background .2s",
                            }}
                        >
                            {label}
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}

// ─── Footer ───────────────────────────────────────────────────

export function SiteFooter() {
    const year = new Date().getFullYear();

    return (
        <footer
            style={{
                background: "var(--navy-950)",
                borderTop: "1px solid rgba(255,255,255,.06)",
                padding: "40px",
            }}
        >
            {/* Top row */}
            <div
                style={{
                    maxWidth: "1120px",
                    margin: "0 auto",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "32px",
                    marginBottom: "32px",
                }}
            >
                {/* Brand blurb */}
                <div style={{ maxWidth: "280px" }}>
          <span
              style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  color: "var(--white)",
                  display: "block",
                  marginBottom: "10px",
              }}
          >
            Trabajo Hub
          </span>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,.4)",
                            lineHeight: 1.65,
                        }}
                    >
                        Connecting independent healthcare professionals with facilities that
                        need shift coverage — safely, compliantly, and efficiently.
                    </p>
                </div>

                {/* Link groups */}
                <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
                    {[
                        {
                            heading: "Platform",
                            links: [
                                ["Dashboard", "/"],
                                ["Marketplace", "/marketplace"],
                                ["Wallet", "/wallet"],
                            ],
                        },
                        {
                            heading: "Legal",
                            links: [
                                ["Privacy Policy", "/privacy"],
                                ["Terms of Service", "/terms"],
                                ["HIPAA Notice", "/hipaa"],
                            ],
                        },
                        {
                            heading: "Support",
                            links: [
                                ["Help Centre", "/support"],
                                ["Contact Us", "/support#contact"],
                                ["System Status", "#"],
                            ],
                        },
                    ].map(({ heading, links }) => (
                        <div key={heading}>
                            <p
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,.3)",
                                    marginBottom: "12px",
                                }}
                            >
                                {heading}
                            </p>
                            {links.map(([label, href]) => (
                                <a
                                    key={label}
                                    href={href}
                                    style={{
                                        display: "block",
                                        fontSize: "13px",
                                        color: "rgba(255,255,255,.5)",
                                        textDecoration: "none",
                                        marginBottom: "8px",
                                        transition: "color .15s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.85)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.5)")}
                                >
                                    {label}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar */}
            <div
                style={{
                    maxWidth: "1120px",
                    margin: "0 auto",
                    borderTop: "1px solid rgba(255,255,255,.06)",
                    paddingTop: "24px",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,.28)" }}>
                    © {year} Trabajo Hub Inc. · 500 Congress Ave, Suite 200 · Austin, TX 78701
                </p>
                <div style={{ display: "flex", gap: "16px" }}>
                    {[
                        ["Privacy", "/privacy"],
                        ["Terms", "/terms"],
                        ["HIPAA", "/hipaa"],
                        ["Support", "/support"],
                    ].map(([label, href]) => (
                        <a
                            key={label}
                            href={href}
                            style={{
                                fontSize: "12px",
                                color: "rgba(255,255,255,.35)",
                                textDecoration: "none",
                                transition: "color .15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.65)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.35)")}
                        >
                            {label}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}