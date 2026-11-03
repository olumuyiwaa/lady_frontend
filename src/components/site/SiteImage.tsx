"use client";

import Image from "next/image";
import { optimizableHosts } from "@/lib/imageHosts";

const HOSTS = optimizableHosts();

function canOptimize(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true; // bundled /public asset
  try {
    return HOSTS.includes(new URL(src).host.toLowerCase());
  } catch {
    return false;
  }
}

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Rendered size hint for responsive srcset, e.g. "(min-width:1024px) 33vw, 100vw". */
  sizes?: string;
  /** Intrinsic size; required unless `fill`. Prevents layout shift. */
  width?: number;
  height?: number;
  /** Fill the positioned parent (use for backgrounds/heroes). */
  fill?: boolean;
  /** Above-the-fold image: preload it instead of lazy-loading. */
  preload?: boolean;
};

/**
 * Business-uploaded images get AVIF/WebP + responsive sizes via next/image when
 * they come from our storage CDN. Anything else (an old absolute URL, another
 * host) falls back to a plain <img>, since next/image throws on unlisted hosts.
 */
export function SiteImage({ src, alt, className, sizes, width, height, fill, preload }: Props) {
  if (canOptimize(src)) {
    return fill ? (
      <Image src={src} alt={alt} fill sizes={sizes ?? "100vw"} preload={preload} className={className} />
    ) : (
      <Image src={src} alt={alt} width={width ?? 400} height={height ?? 400} sizes={sizes} preload={preload} className={className} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- host not in the optimiser allow-list
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={preload ? "eager" : "lazy"}
      decoding="async"
      {...(preload ? { fetchPriority: "high" as const } : {})}
      className={fill ? `absolute inset-0 h-full w-full ${className ?? ""}` : className}
    />
  );
}
