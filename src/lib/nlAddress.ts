/** Small helpers for the Dutch postcode + house number address autofill. */

export type AddressHit = {
  street: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
};

/** 1234 AB / 1234AB (first digit is never 0). */
export function isDutchPostcode(value: string): boolean {
  return /^[1-9]\d{3}\s?[A-Za-z]{2}$/.test(value.trim());
}

/**
 * House number at the END of a street line: "Damrak 1" -> "1",
 * "Damrak 1A" -> "1A", "Keizersgracht 12-3" -> "12-3", "12" -> "12".
 * Returns null when the line has no trailing number.
 */
export function extractHouseNumber(addressLine1: string): string | null {
  const m = /(\d{1,5}\s?[A-Za-z]?(?:-[A-Za-z0-9]{1,4})?)\s*$/.exec(addressLine1.trim());
  return m ? m[1].replace(/\s+/g, "") : null;
}

/**
 * Fill the street line from a lookup hit only when the customer typed just a
 * number. A line that already names a street is the customer's own text and
 * is left alone.
 */
export function streetLineFor(current: string, hit: AddressHit): string {
  const hasStreetName = /[A-Za-z]{2,}/.test(current);
  return hasStreetName ? current : `${hit.street} ${hit.houseNumber}`;
}
