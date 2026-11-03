import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applicableQuestions,
  formatAnswer,
  isAnswered,
  missingRequired,
  normalizedDutchPostcode,
  toAnswerPayload,
  type BookingQuestion,
} from "../../src/lib/bookingQuestions.ts";

const q = (over: Partial<BookingQuestion> = {}): BookingQuestion => ({
  id: "q1", label: "Pets?", helpText: null, type: "TEXT", options: [], required: false, serviceIds: [], ...over,
});

test("a question with no service list applies to every service", () => {
  assert.equal(applicableQuestions([q()], "s1").length, 1);
  assert.equal(applicableQuestions([q()], null).length, 1);
});

test("a question limited to services only applies to those", () => {
  const only = q({ serviceIds: ["s2"] });
  assert.equal(applicableQuestions([only], "s1").length, 0);
  assert.equal(applicableQuestions([only], "s2").length, 1);
  assert.equal(applicableQuestions([only], null).length, 0);
});

test("no questions at all is fine", () => {
  assert.deepEqual(applicableQuestions(undefined, "s1"), []);
  assert.deepEqual(applicableQuestions(null, "s1"), []);
});

test("No and 0 count as answers; blank text and empty selections do not", () => {
  assert.equal(isAnswered(false), true);
  assert.equal(isAnswered(0), true);
  assert.equal(isAnswered("x"), true);
  assert.equal(isAnswered(["a"]), true);
  for (const empty of [undefined, "", "   ", [], Number.NaN]) assert.equal(isAnswered(empty as never), false);
});

test("only unanswered REQUIRED questions are reported missing", () => {
  const qs = [q({ id: "a", required: true }), q({ id: "b", required: true }), q({ id: "c" })];
  assert.deepEqual(missingRequired(qs, { a: "x" }).map((x) => x.id), ["b"]);
  assert.deepEqual(missingRequired(qs, { a: "x", b: false as never }).map((x) => x.id), []);
});

test("the payload contains only answered questions that apply, with text trimmed", () => {
  const qs = [q({ id: "a" }), q({ id: "b" }), q({ id: "c", type: "YES_NO" })];
  const payload = toAnswerPayload(qs, { a: "  hi  ", b: "", c: false, stale: "ignored" });
  assert.deepEqual(payload, [{ questionId: "a", value: "hi" }, { questionId: "c", value: false }]);
});

test("stored answers are shown readably", () => {
  assert.equal(formatAnswer(true, "Ja", "Nee"), "Ja");
  assert.equal(formatAnswer(false, "Ja", "Nee"), "Nee");
  assert.equal(formatAnswer(["Cat", "Dog"]), "Cat, Dog");
  assert.equal(formatAnswer(3), "3");
  assert.equal(formatAnswer(null), "");
});

test("only a complete Dutch postcode is sent with quotes, normalised", () => {
  assert.equal(normalizedDutchPostcode("1012 lg"), "1012LG");
  assert.equal(normalizedDutchPostcode(" 3511LG "), "3511LG");
  for (const partial of ["", "1012", "1012 L", "0123AB", "1012 ABC", "hello"]) {
    assert.equal(normalizedDutchPostcode(partial), undefined, partial);
  }
});
