"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  createPortalMember,
  listPortalLocations,
  listPortalMembers,
  updatePortalMember,
  type CompanyMemberInput,
} from "@/app/api/portal.api";
import { MembersEditor } from "@/components/b2b/MembersEditor";

type Props = { slug: string; token: string; onUnauthorized: () => void };

const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-white/[0.04] dark:ring-white/10";

/** Company admins decide who else can sign in and which branches they see. */
export function TeamPanel({ slug, token, onUnauthorized }: Props) {
  const t = useTranslations("B2BTeam");
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const [members, locations] = await Promise.all([listPortalMembers(slug, token), listPortalLocations(slug, token)]);
    return { members, locations };
  }, [slug, token]);

  return (
    <section aria-label={t("title")} className={card}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">{t("title")}</p>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-sm font-semibold text-brand-500 hover:underline dark:text-brand-400">
          {open ? t("hide") : t("manage")}
        </button>
      </div>
      {open && (
        <div className="mt-4">
          <MembersEditor
            load={load}
            create={(input: CompanyMemberInput) => createPortalMember(slug, token, input)}
            update={(id: string, input: CompanyMemberInput) => updatePortalMember(slug, token, id, input)}
            onUnauthorized={onUnauthorized}
          />
        </div>
      )}
    </section>
  );
}
