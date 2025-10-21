/// <reference lib="deno.ns" />
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { StringSimilarity } from "../src/home/search/string-similarity.ts";

Deno.test("StringSimilarity returns 1 for identical strings", () => {
  assertEquals(StringSimilarity.calculate("hello", "hello"), 1);
});

Deno.test("StringSimilarity returns between 0 and 1 for different strings", () => {
  const score = StringSimilarity.calculate("hello", "world");
  assert(score >= 0 && score <= 1);
});

Deno.test("StringSimilarity handles empty strings", () => {
  assertEquals(StringSimilarity.calculate("", ""), 1);
  assertEquals(StringSimilarity.calculate("", "abc"), 0);
});
