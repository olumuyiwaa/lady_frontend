import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveHostRoute, staffLoginHref } from "../../src/lib/hostRouting.ts";

const env = { adminUrl: "https://admin.todcleaning.nl", siteUrl: "https://todcleaning.nl" };
const route = (host: string, pathname: string, search = "") => resolveHostRoute({ host, pathname, search, ...env });

test("nothing is redirected when no admin host is configured", () => {
  assert.deepEqual(resolveHostRoute({ host: "localhost:3000", pathname: "/signin" }), { redirectTo: null, isAdminHost: false });
});

test("staff pages on the public host move to the admin host, keeping path and query", () => {
  assert.equal(route("todcleaning.nl", "/signin").redirectTo, "https://admin.todcleaning.nl/signin");
  assert.equal(route("todcleaning.nl", "/reset-password", "?token=abc").redirectTo, "https://admin.todcleaning.nl/reset-password?token=abc");
  assert.equal(route("todcleaning.nl", "/bookings/42").redirectTo, "https://admin.todcleaning.nl/bookings/42");
});

test("the storefront is not redirected on the public host", () => {
  for (const p of ["/", "/portal", "/terms", "/book-now/todcleaning"]) assert.equal(route("todcleaning.nl", p).redirectTo, null, p);
});

test("the admin host root goes to sign-in and is marked as admin", () => {
  assert.deepEqual(route("admin.todcleaning.nl", "/"), { redirectTo: "https://admin.todcleaning.nl/signin", isAdminHost: true });
  assert.deepEqual(route("ADMIN.todcleaning.nl", "/dashboard"), { redirectTo: null, isAdminHost: true });
});

test("public pages requested on the admin host go back to the public site", () => {
  assert.equal(route("admin.todcleaning.nl", "/privacy").redirectTo, "https://todcleaning.nl/privacy");
  assert.equal(route("admin.todcleaning.nl", "/portal", "?x=1").redirectTo, "https://todcleaning.nl/portal?x=1");
});

test("a path that merely starts like an admin segment is not treated as one", () => {
  assert.equal(route("todcleaning.nl", "/services-and-prices").redirectTo, null);
});

test("staff login link", () => {
  assert.equal(staffLoginHref("https://admin.todcleaning.nl/"), "https://admin.todcleaning.nl/signin");
  assert.equal(staffLoginHref("admin.todcleaning.nl"), "https://admin.todcleaning.nl/signin");
  assert.equal(staffLoginHref(undefined), "/signin");
});
