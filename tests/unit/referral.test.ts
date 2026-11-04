import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidReferralCode, referralLink } from "../../src/lib/referral.ts";

test("accepts 4-12 alphanumeric codes", () => {
  assert.equal(isValidReferralCode("ABC234"), true);
  assert.equal(isValidReferralCode("abcd"), true);
});

test("rejects empty, short, long and unsafe codes", () => {
  for (const bad of [null, undefined, "", "abc", "A".repeat(13), "AB CD1", "<script>", "AB-CD12"]) {
    assert.equal(isValidReferralCode(bad as string | null | undefined), false, String(bad));
  }
});

test("builds a shareable link and encodes the code", () => {
  assert.equal(referralLink("ABC234", "https://todcleaning.nl"), "https://todcleaning.nl/?ref=ABC234");
  assert.equal(referralLink("A&B", "https://x.nl"), "https://x.nl/?ref=A%26B");
});
