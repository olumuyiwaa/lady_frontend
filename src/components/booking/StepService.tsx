"use client";

import { useTranslations } from "next-intl";
import type { WidgetService } from "@/app/api/widget.api";
import type { BookingFormState, Frequency } from "./types";
import { formatMoney, frequencyLabel } from "./types";

type Props = {
  state: BookingFormState;
  services: WidgetService[];
  selectedService: WidgetService | null;
  update: (patch: Partial<BookingFormState>) => void;
  primaryColor?: string;
};

const FREQUENCIES: Frequency[] = ["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"];

export function StepService({
  state,
  services,
  selectedService,
  update,
  primaryColor = "#3F6B52",
}: Props) {
  const t = useTranslations("Booking.service");
  const tFreq = useTranslations("Booking.frequency");
  const toggleAddOn = (id: string) => {
    const next = state.addOnIds.includes(id)
      ? state.addOnIds.filter((x) => x !== id)
      : [...state.addOnIds, id];
    update({ addOnIds: next });
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("subheading")}</p>
      </header>

      {/* Services */}
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((svc) => {
          const active = state.serviceId === svc.id;
          return (
            <button
              key={svc.id}
              type="button"
              onClick={() => update({ serviceId: svc.id, addOnIds: [] })}
              className={`
                text-left rounded-xl border-2 p-4 transition
                ${active ? "shadow-sm" : "border-gray-200 hover:border-gray-300"}
              `}
              style={{
                borderColor: active ? primaryColor : undefined,
                backgroundColor: active ? `${primaryColor}08` : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-gray-900">{svc.name}</span>
                <span className="text-sm font-medium" style={{ color: primaryColor }}>
                  {t("fromPrice", { price: formatMoney(svc.basePriceCents) })}
                </span>
              </div>
              {svc.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{svc.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">{t("estimatedMinutes", { count: svc.estimatedMinutes })}</p>
            </button>
          );
        })}
      </div>

      {/* Frequency */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("howOften")}</h3>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => {
            const active = state.frequency === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => update({ frequency: f })}
                className={`
                  rounded-full px-4 py-2 text-sm font-medium border transition
                  ${active ? "text-white border-transparent" : "border-gray-200 text-gray-700 hover:border-gray-300"}
                `}
                style={{ backgroundColor: active ? primaryColor : undefined }}
              >
                {frequencyLabel(f, tFreq)}
                {f === "WEEKLY" && (
                  <span className="ml-1 text-xs opacity-90">· {t("saveWeekly")}</span>
                )}
                {f === "BIWEEKLY" && (
                  <span className="ml-1 text-xs opacity-90">· {t("saveBiweekly")}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Home size — only when pricing model needs it */}
      {selectedService &&
        (selectedService.pricingModel === "PER_ROOM" ||
          selectedService.pricingModel === "PER_SQFT" ||
          selectedService.pricingModel === "FLAT") && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <NumberField
              label={t("bedrooms")}
              value={state.rooms}
              min={0}
              max={12}
              onChange={(v) => update({ rooms: v })}
            />
            <NumberField
              label={t("bathrooms")}
              value={state.bathrooms}
              min={0}
              max={10}
              onChange={(v) => update({ bathrooms: v })}
            />
            {selectedService.pricingModel === "PER_SQFT" && (
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("approxSqft")}
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={state.sqft || ""}
                  onChange={(e) => update({ sqft: Number(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{ ["--tw-ring-color" as string]: primaryColor }}
                  placeholder={t("sqftPlaceholder")}
                />
              </div>
            )}
          </div>
        )}

      {/* Add-ons */}
      {selectedService && selectedService.addOns.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{t("addOns")}</h3>
          <div className="space-y-2">
            {selectedService.addOns.map((addon) => {
              const checked = state.addOnIds.includes(addon.id);
              return (
                <label
                  key={addon.id}
                  className={`
                    flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer transition
                    ${checked ? "border-transparent" : "border-gray-200 hover:border-gray-300"}
                  `}
                  style={{
                    borderColor: checked ? primaryColor : undefined,
                    backgroundColor: checked ? `${primaryColor}08` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAddOn(addon.id)}
                      className="h-4 w-4 rounded border-gray-300"
                      style={{ accentColor: primaryColor }}
                    />
                    <span className="text-sm font-medium text-gray-900">{addon.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    +{formatMoney(addon.priceCents)}
                    {addon.extraMinutes > 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        {t("extraMinutes", { count: addon.extraMinutes })}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
        <button
          type="button"
          className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <span className="flex-1 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}
