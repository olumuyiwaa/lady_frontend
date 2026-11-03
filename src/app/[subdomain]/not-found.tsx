import { getTranslations } from "next-intl/server";

export default async function TenantNotFound() {
  const t = await getTranslations("Site");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-lg font-semibold text-[#171B1A]">{t("notFoundTitle")}</p>
      <p className="max-w-sm text-sm text-[#5F6664]">{t("notFoundBody")}</p>
    </div>
  );
}
