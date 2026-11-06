"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveBoard, LiveCleanerState } from "@/app/api/dispatch.api";

export const STATE_COLOR: Record<LiveCleanerState, string> = {
    ON_JOB: "#10b981",
    EN_ROUTE: "#f59e0b",
    NEXT_UP: "#3b82f6",
    IDLE: "#9ca3af",
};

const UNASSIGNED_COLOR = "#ef4444";
const NL_CENTER: [number, number] = [52.2, 5.3];

function esc(s: string | null | undefined) {
    return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

type Props = {
    board: LiveBoard | null;
    selectedCleanerId: string | null;
    labels: { stale: string; unassigned: string };
};

/** Leaflet map: cleaners as coloured dots, jobs as small squares (red when unassigned). */
export default function LiveMapCanvas({ board, selectedCleanerId, labels }: Props) {
    const el = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const layer = useRef<L.LayerGroup | null>(null);
    const fitted = useRef(false);

    useEffect(() => {
        if (!el.current || map.current) return;
        map.current = L.map(el.current, { zoomControl: true }).setView(NL_CENTER, 8);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    useEffect(() => {
        const m = map.current;
        const g = layer.current;
        if (!m || !g || !board) return;
        g.clearLayers();
        const points: L.LatLngExpression[] = [];

        for (const j of board.jobs) {
            if (j.latitude == null || j.longitude == null) continue;
            const p: L.LatLngExpression = [j.latitude, j.longitude];
            points.push(p);
            L.circleMarker(p, {
                radius: 6,
                color: "#ffffff",
                weight: 2,
                fillColor: j.unassigned ? UNASSIGNED_COLOR : "#6b7280",
                fillOpacity: 0.9,
            })
                .bindPopup(
                    `<strong>${esc(j.customerName)}</strong><br/>${esc(j.serviceName)}<br/>${esc(j.address)}` +
                        (j.unassigned ? `<br/><em>${esc(labels.unassigned)}</em>` : ""),
                )
                .addTo(g);
        }

        for (const c of board.cleaners) {
            if (c.latitude == null || c.longitude == null) continue;
            const p: L.LatLngExpression = [c.latitude, c.longitude];
            points.push(p);
            const selected = c.id === selectedCleanerId;
            L.circleMarker(p, {
                radius: selected ? 11 : 9,
                color: selected ? "#111827" : "#ffffff",
                weight: selected ? 3 : 2,
                fillColor: STATE_COLOR[c.state],
                fillOpacity: c.stale ? 0.4 : 1,
            })
                .bindPopup(
                    `<strong>${esc(c.name)}</strong>` +
                        (c.job ? `<br/>${esc(c.job.address)}` : "") +
                        (c.stale ? `<br/><em>${esc(labels.stale)}</em>` : ""),
                )
                .addTo(g);
        }

        if (!fitted.current && points.length > 0) {
            m.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
            fitted.current = true;
        }
    }, [board, selectedCleanerId, labels]);

    useEffect(() => {
        if (!selectedCleanerId || !board || !map.current) return;
        const c = board.cleaners.find((x) => x.id === selectedCleanerId);
        if (c?.latitude != null && c.longitude != null) map.current.setView([c.latitude, c.longitude], Math.max(map.current.getZoom(), 13));
    }, [selectedCleanerId, board]);

    return <div ref={el} className="h-[480px] lg:h-[calc(100vh-15rem)] lg:min-h-[480px] w-full rounded-xl border border-gray-200 dark:border-gray-800" />;
}
