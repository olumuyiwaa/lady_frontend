import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0].trim() || (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/portal", "/dashboard", "/signin"] }],
    sitemap: `${proto}://${host}/sitemap.xml`,
  };
}
