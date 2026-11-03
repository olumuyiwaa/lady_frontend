import { test } from "node:test";
import assert from "node:assert/strict";
import { extractHouseNumber, isDutchPostcode, streetLineFor } from "../../src/lib/nlAddress.ts";

test("accepts Dutch postcodes with or without a space, any case", () => {
  for (const ok of ["1012AB", "1012 AB", "1012ab", " 3511 LG "]) assert.equal(isDutchPostcode(ok), true, ok);
});

test("rejects things that are not Dutch postcodes", () => {
  for (const bad of ["0123AB", "1012A", "1012 ABC", "ABCD12", "", "12345"]) assert.equal(isDutchPostcode(bad), false, bad);
});

test("finds the house number at the end of a street line", () => {
  assert.equal(extractHouseNumber("Damrak 1"), "1");
  assert.equal(extractHouseNumber("Damrak 1A"), "1A");
  assert.equal(extractHouseNumber("Damrak 1 a"), "1a");
  assert.equal(extractHouseNumber("Keizersgracht 12-3"), "12-3");
  assert.equal(extractHouseNumber("12"), "12");
  assert.equal(extractHouseNumber("Damrak"), null);
  assert.equal(extractHouseNumber(""), null);
});

const hit = { street: "Damrak", houseNumber: "1", city: "Amsterdam", postalCode: "1012 LG", latitude: 52.37, longitude: 4.89 };

test("fills the street line when only a number was typed", () => {
  assert.equal(streetLineFor("1", hit), "Damrak 1");
  assert.equal(streetLineFor("12 b", hit), "Damrak 1");
});

test("never overwrites a street the customer typed", () => {
  assert.equal(streetLineFor("Dam 1", hit), "Dam 1");
});
