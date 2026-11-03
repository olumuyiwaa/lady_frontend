"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

/**
 * Fade-up on scroll — same motion language as cleansera_sass_website homepage.
 */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`site-reveal ${visible ? "site-reveal-visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
