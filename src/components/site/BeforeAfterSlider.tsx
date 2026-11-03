"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
};

export default function BeforeAfterSlider({
                                            beforeSrc,
                                            afterSrc,
                                            beforeAlt = "Before cleaning",
                                            afterAlt = "After cleaning",
                                          }: BeforeAfterSliderProps) {
  const [pct, setPct] = useState(55);
  const [trackWidth, setTrackWidth] = useState(800);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const updateWidth = () => setTrackWidth(el.offsetWidth);
    updateWidth();

    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.min(96, Math.max(4, raw)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) updateFromClientX(e.clientX);
  };

  const stopDragging = () => {
    dragging.current = false;
  };

  return (
      <div
          ref={trackRef}
          className="relative aspect-[4/4] w-full select-none overflow-hidden rounded-lg border border-stone-200 shadow-[0_24px_60px_rgba(22,35,28,0.12)]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
      >
        <div className="absolute inset-0">
          <Image
              src={afterSrc}
              alt={afterAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              priority
          />
        </div>

        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <div className="relative h-full" style={{ width: trackWidth }}>
            <Image
                src={beforeSrc}
                alt={beforeAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
            />
          </div>
        </div>

        <span className="site-eyebrow absolute left-3 top-3 rounded-sm bg-ink/80 px-2 py-1 text-xs font-medium text-paper">
        Before
      </span>
        <span className="site-eyebrow absolute right-3 top-3 rounded-sm bg-sage-700/85 px-2 py-1 text-xs font-medium text-paper">
        After
      </span>

        <div className="absolute top-0 bottom-0 w-0.5 bg-paper" style={{ left: `${pct}%` }}>
          <div className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper shadow-md cursor-ew-resize">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                  d="M5 3 1 8l4 5M11 3l4 5-4 5"
                  stroke="#16231C"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
  );
}