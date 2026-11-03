import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIcs } from "../../src/lib/ics.ts";

const ics = buildIcs({
  uid: "bk1",
  title: "Cleaning, deep; Schoon BV",
  start: "2026-10-10T08:00:00.000Z",
  end: "2026-10-10T10:30:00.000Z",
  location: "Damrak 1, Amsterdam",
});

test("is a well-formed calendar with CRLF line endings", () => {
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!/[^\r]\n/.test(ics), "bare LF found");
});

test("times are written in UTC basic format", () => {
  assert.ok(ics.includes("DTSTART:20261010T080000Z"));
  assert.ok(ics.includes("DTEND:20261010T103000Z"));
});

test("commas and semicolons in text are escaped", () => {
  assert.ok(ics.includes("SUMMARY:Cleaning\\, deep\\; Schoon BV"));
  assert.ok(ics.includes("LOCATION:Damrak 1\\, Amsterdam"));
});
