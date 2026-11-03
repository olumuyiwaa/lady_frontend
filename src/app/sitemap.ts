import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0].trim() || (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return [{ url: `${proto}://${host}/`, changeFrequency: "weekly", priority: 1 }];
}
