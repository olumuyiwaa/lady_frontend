import type { WidgetSectionsEnabled } from "@/app/api/widget.api";

export type SectionKey = "about" | "testimonials" | "gallery" | "faq";
const ALL_SECTIONS: SectionKey[] = ["about", "testimonials", "gallery", "faq"];
const DEFAULT_SECTION_ORDER: NonNullable<WidgetSectionsEnabled["order"]> = [...ALL_SECTIONS];

/**
 * Saved order first (unknown keys and duplicates dropped), then any section the
 * saved order forgot. Previously a section missing from `order` silently
 * disappeared even when enabled, and a duplicated key rendered twice.
 */
export function resolveSectionOrder(saved: WidgetSectionsEnabled["order"] | undefined): SectionKey[] {
  const seen = new Set<SectionKey>();
  for (const key of saved?.length ? saved : DEFAULT_SECTION_ORDER) {
    if ((ALL_SECTIONS as string[]).includes(key)) seen.add(key as SectionKey);
  }
  for (const key of ALL_SECTIONS) seen.add(key);
  return Array.from(seen);
}
