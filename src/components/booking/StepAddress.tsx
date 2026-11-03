"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { lookupAddress } from "@/app/api/widget.api";
import { extractHouseNumber, isDutchPostcode, streetLineFor } from "@/lib/nlAddress";
import type { BookingFormState } from "./types";

type Props = {
  state: BookingFormState;
  update: (patch: Partial<BookingFormState>) => void;
  primaryColor?: string;
  onValidateArea?: () => void;
  /** Business slug, used for the postcode lookup. */
  slug?: string;
};

/**
 * Address form with Dutch autofill: enter a postcode and house number and the
 * street, city and coordinates are filled in (via the backend's address
 * lookup). Anything the lookup cannot resolve stays as typed. Coordinates are
 * never typed by the customer; they only ever come from the lookup or from
 * the server geocoding the final address.
 */
export function StepAddress({
  state,
  update,
  primaryColor = "#3F6B52",
  onValidateArea,
  slug,
}: Props) {
  const t = useTranslations("Booking.address");
  const [touched, setTouched] = useState(false);
  const [autofilled, setAutofilled] = useState(false);

  // Latest callback, readable from async code and effects without re-subscribing.
  const validateRef = useRef(onValidateArea);
  useEffect(() => {
    validateRef.current = onValidateArea;
  });
  // Re-run the service-area check AFTER the lookup result has rendered, so the
  // quote is built from the filled-in address rather than the stale one.
  const [validateTick, setValidateTick] = useState(0);
  useEffect(() => {
    if (validateTick > 0) validateRef.current?.();
  }, [validateTick]);

  const lookupSeq = useRef(0);

  const runLookup = async (postalCode: string, addressLine1: string) => {
    const houseNumber = extractHouseNumber(addressLine1);
    if (!slug || !isDutchPostcode(postalCode) || !houseNumber) return false;
    const seq = ++lookupSeq.current;
    try {
      const hit = await lookupAddress(slug, postalCode, houseNumber);
      // A newer lookup (or edit) superseded this one.
      if (seq !== lookupSeq.current || !hit.found) return false;
      update({
        addressLine1: streetLineFor(addressLine1, hit),
        city: hit.city,
        postalCode: hit.postalCode,
        latitude: hit.latitude,
        longitude: hit.longitude,
        serviceAreaOk: null,
      });
      setAutofilled(true);
      setValidateTick((n) => n + 1);
      return true;
    } catch {
      return false; // autofill is a convenience; never block the form on it
    }
  };

  const handleBlur = () => {
    setTouched(true);
    // Trigger a quote refresh so service-area check runs when coords exist
    onValidateArea?.();
  };

  const handleAddressBlur = async () => {
    setTouched(true);
    if (!(await runLookup(state.postalCode, state.addressLine1))) onValidateArea?.();
  };

  const handlePostalBlur = async () => {
    if (!(await runLookup(state.postalCode, state.addressLine1))) onValidateArea?.();
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">{t("heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("subheading")}</p>
      </header>

      <div className="space-y-4">
        <Field
          label={t("streetAddress")}
          required
          value={state.addressLine1}
          onChange={(v) => update({ addressLine1: v, latitude: null, longitude: null, serviceAreaOk: null })}
          onBlur={handleAddressBlur}
          placeholder={t("streetAddressPlaceholder")}
          primaryColor={primaryColor}
        />
        <Field
          label={t("addressLine2")}
          value={state.addressLine2}
          onChange={(v) => update({ addressLine2: v })}
          placeholder={t("optional")}
          primaryColor={primaryColor}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label={t("city")}
            required
            value={state.city}
            onChange={(v) => update({ city: v, latitude: null, longitude: null, serviceAreaOk: null })}
            onBlur={handleBlur}
            primaryColor={primaryColor}
          />
          <Field
            label={t("provinceOptional")}
            value={state.state}
            onChange={(v) => update({ state: v, serviceAreaOk: null })}
            onBlur={handleBlur}
            primaryColor={primaryColor}
          />
        </div>
        <Field
          label={t("postalCode")}
          required
          value={state.postalCode}
          onChange={(v) => update({ postalCode: v, latitude: null, longitude: null, serviceAreaOk: null })}
          onBlur={handlePostalBlur}
          primaryColor={primaryColor}
        />
        <p className="-mt-2 text-xs text-gray-500">
          {autofilled ? t("autofilled") : t("autofillHint")}
        </p>
      </div>

      {/* Service area feedback */}
      {state.serviceAreaOk === true && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("inServiceArea")}
        </div>
      )}
      {state.serviceAreaOk === false && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">{t("outsideServiceArea")}</p>
          <p className="mt-1 text-amber-800/80">{t("outsideServiceAreaHint")}</p>
        </div>
      )}
      {touched && !state.addressLine1.trim() && (
        <p className="text-sm text-red-600">{t("streetAddressRequired")}</p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  primaryColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  primaryColor: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
        style={{ ["--tw-ring-color" as string]: primaryColor }}
      />
    </div>
  );
}
