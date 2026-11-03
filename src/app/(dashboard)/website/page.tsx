"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import {
  getBranding,
  updateBranding,
  uploadBrandingImage,
  BusinessBranding,
  Testimonial,
  FaqItem,
  SocialLinks,
  ThemeStyle,
} from "@/app/api/businesses.api";

const SECTION_KEYS: Array<"about" | "testimonials" | "gallery" | "faq"> = [
  "about",
  "testimonials",
  "gallery",
  "faq",
];
const SOCIAL_PLATFORMS: Array<keyof SocialLinks> = ["facebook", "instagram", "tiktok", "linkedin", "twitter"];

export default function WebsitePage() {
  const t = useTranslations("Dashboard.website");
  const tc = useTranslations("Dashboard.common");
  const [branding, setBranding] = useState<BusinessBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Local editable copies of the free-form list/text fields — saved
  // together via one "Save Website Content" click, same pattern as the
  // existing business-settings page. Image uploads save themselves
  // immediately on selection instead, since there's nothing to "compose"
  // about an image the way there is with a paragraph of text.
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>("MODERN");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [sections, setSections] = useState<{
    about: boolean;
    testimonials: boolean;
    gallery: boolean;
    faq: boolean;
    order: Array<"about" | "testimonials" | "gallery" | "faq">;
  }>({ about: true, testimonials: true, gallery: true, faq: true, order: SECTION_KEYS });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const b = await getBranding();
      setBranding(b);
      setThemeStyle(b.themeStyle || "MODERN");
      setAboutTitle(b.aboutTitle || "");
      setAboutBody(b.aboutBody || "");
      setTestimonials(b.testimonials || []);
      setFaqItems(b.faqItems || []);
      setSocialLinks(b.socialLinks || {});
      setSections({
        about: b.sectionsEnabled?.about !== false,
        testimonials: b.sectionsEnabled?.testimonials !== false,
        gallery: b.sectionsEnabled?.gallery !== false,
        faq: b.sectionsEnabled?.faq !== false,
        order: b.sectionsEnabled?.order?.length ? b.sectionsEnabled.order : SECTION_KEYS,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setError("");
    try {
      const { key } = await uploadBrandingImage("logo", file);
      const updated = await updateBranding({ logoKey: key });
      setBranding(updated);
      setSaved(t("logoUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("logoUploadFailed"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleHeroUpload = async (file: File) => {
    setUploadingHero(true);
    setError("");
    try {
      const { key } = await uploadBrandingImage("hero", file);
      const updated = await updateBranding({ heroImageKey: key });
      setBranding(updated);
      setSaved(t("heroUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("heroUploadFailed"));
    } finally {
      setUploadingHero(false);
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    setUploadingGallery(true);
    setError("");
    try {
      const currentKeys = branding?.galleryImageKeys || [];
      const remaining = Math.max(0, 24 - currentKeys.length);
      const toUpload = Array.from(files).slice(0, remaining);
      const uploaded = await Promise.all(toUpload.map((f) => uploadBrandingImage("gallery", f)));
      const updated = await updateBranding({ galleryImageKeys: [...currentKeys, ...uploaded.map((u) => u.key)] });
      setBranding(updated);
      setSaved(t("galleryUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("galleryUploadFailed"));
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = async (key: string) => {
    setError("");
    try {
      const updated = await updateBranding({
        galleryImageKeys: (branding?.galleryImageKeys || []).filter((k) => k !== key),
      });
      setBranding(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("removeImageFailed"));
    }
  };

  const moveSectionOrder = (key: "about" | "testimonials" | "gallery" | "faq", direction: -1 | 1) => {
    setSections((prev) => {
      const idx = prev.order.indexOf(key);
      const swapWith = idx + direction;
      if (swapWith < 0 || swapWith >= prev.order.length) return prev;
      const order = [...prev.order];
      [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
      return { ...prev, order };
    });
  };

  const saveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateBranding({
        themeStyle,
        aboutTitle: aboutTitle || null,
        aboutBody: aboutBody || null,
        testimonials: testimonials.filter((item) => item.name.trim() && item.quote.trim()),
        faqItems: faqItems.filter((f) => f.question.trim() && f.answer.trim()),
        socialLinks,
        sectionsEnabled: sections,
      });
      setBranding(updated);
      setSaved(t("contentSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-500 md:p-6">{tc("loading")}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}
      {saved && !error && (
        <div className="mb-4 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-600 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
          {saved}
        </div>
      )}

      {/* Logo + Hero image */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {t("images")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label>{t("logo")}</Label>
            <div className="flex items-center gap-4">
              {branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt={t("logo")} className="h-16 w-16 rounded-lg border border-gray-200 object-contain dark:border-gray-700" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 dark:border-gray-700">
                  {t("none")}
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              />
              <Button variant="outline" type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                {uploadingLogo ? t("uploading") : t("uploadLogo")}
              </Button>
            </div>
          </div>
          <div>
            <Label>{t("heroImage")}</Label>
            <div className="flex items-center gap-4">
              {branding?.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.heroImageUrl} alt={t("heroImage")} className="h-16 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-700" />
              ) : (
                <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 dark:border-gray-700">
                  {t("none")}
                </div>
              )}
              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleHeroUpload(e.target.files[0])}
              />
              <Button variant="outline" type="button" onClick={() => heroInputRef.current?.click()} disabled={uploadingHero}>
                {uploadingHero ? t("uploading") : t("uploadImage")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={saveContent} className="space-y-6">
        {/* Theme style */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("themeStyle")}
          </h2>
          <div className="max-w-xs">
            <Select
              options={[
                { value: "MODERN", label: t("themes.modern") },
                { value: "CLASSIC", label: t("themes.classic") },
                { value: "BOLD", label: t("themes.bold") },
              ]}
              defaultValue={themeStyle}
              onChange={(v) => setThemeStyle(v as ThemeStyle)}
            />
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("aboutSection")}</h2>
          <div className="space-y-4">
            <div>
              <Label>{t("titleField")}</Label>
              <Input value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} placeholder={t("taglineExample")} />
            </div>
            <div>
              <Label>{t("body")}</Label>
              <TextArea rows={5} value={aboutBody} onChange={setAboutBody} placeholder={t("aboutPlaceholder")} />
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("testimonials")}</h2>
            <Button variant="outline" type="button" onClick={() => setTestimonials([...testimonials, { name: "", quote: "" }])}>
              {t("addTestimonial")}
            </Button>
          </div>
          <div className="space-y-4">
            {testimonials.length === 0 && <p className="text-sm text-gray-400">{t("noneYet")}</p>}
            {testimonials.map((item, i) => (
              <div key={i} className="grid gap-3 rounded-lg border border-gray-100 p-3 sm:grid-cols-[200px_1fr_auto] dark:border-gray-800">
                <Input
                  value={item.name}
                  onChange={(e) => setTestimonials(testimonials.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder={t("customerName")}
                />
                <Input
                  value={item.quote}
                  onChange={(e) => setTestimonials(testimonials.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)))}
                  placeholder={t("whatTheySaid")}
                />
                <button
                  type="button"
                  onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))}
                  className="text-sm font-medium text-error-500 hover:text-error-600"
                >
                  {tc("delete")}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("faq")}</h2>
            <Button variant="outline" type="button" onClick={() => setFaqItems([...faqItems, { question: "", answer: "" }])}>
              {t("addQuestion")}
            </Button>
          </div>
          <div className="space-y-4">
            {faqItems.length === 0 && <p className="text-sm text-gray-400">{t("noneYet")}</p>}
            {faqItems.map((f, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <Input
                    value={f.question}
                    onChange={(e) => setFaqItems(faqItems.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                    placeholder={t("question")}
                  />
                  <button
                    type="button"
                    onClick={() => setFaqItems(faqItems.filter((_, j) => j !== i))}
                    className="whitespace-nowrap text-sm font-medium text-error-500 hover:text-error-600"
                  >
                    {tc("delete")}
                  </button>
                </div>
                <TextArea
                  rows={2}
                  value={f.answer}
                  onChange={(v) => setFaqItems(faqItems.map((x, j) => (j === i ? { ...x, answer: v } : x)))}
                  placeholder={t("answer")}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("socialLinks")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform}>
                <Label className="capitalize">{platform}</Label>
                <Input
                  value={socialLinks[platform] || ""}
                  onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value || undefined })}
                  placeholder="https://…"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sections visibility + order */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("sections")}</h2>
          <p className="mb-4 text-xs text-gray-400">
            {t("sectionsHint")}
          </p>
          <div className="space-y-2">
            {sections.order.map((key, i) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={sections[key]}
                    onChange={(e) => setSections({ ...sections, [key]: e.target.checked })}
                  />
                  {t(`sectionLabels.${key}`)}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveSectionOrder(key, -1)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30 dark:text-gray-400"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === sections.order.length - 1}
                    onClick={() => moveSectionOrder(key, 1)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30 dark:text-gray-400"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery — after order since it's the longest visually */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t("gallery")}</h2>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && e.target.files.length > 0 && handleGalleryUpload(e.target.files)}
            />
            <Button variant="outline" type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}>
              {uploadingGallery ? t("uploading") : t("addPhotos")}
            </Button>
          </div>
          {(branding?.galleryImageUrls || []).length === 0 ? (
            <p className="text-sm text-gray-400">{t("noPhotos")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {(branding?.galleryImageKeys || []).map((key, i) => (
                <div key={key} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branding?.galleryImageUrls?.[i]} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(key)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? tc("loading") : t("saveContent")}</Button>
        </div>
      </form>
    </div>
  );
}
