/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { calculateTimeLabelValue } from "../src/home/sorting/calculate-time-label-value.ts";

Deno.test("calculateTimeLabelValue handles minutes", () => {
  assertEquals(calculateTimeLabelValue("Time: 30 minutes"), 0.06);
});

Deno.test("calculateTimeLabelValue handles hours", () => {
  assertEquals(calculateTimeLabelValue("Time: 8 hours"), 1);
});

Deno.test("calculateTimeLabelValue handles days", () => {
  assertEquals(calculateTimeLabelValue("Time: 1 day"), 1);
  assertEquals(calculateTimeLabelValue("Time: 3 days"), 1.5);
});

Deno.test("calculateTimeLabelValue handles weeks", () => {
  assertEquals(calculateTimeLabelValue("Time: 2 weeks"), 3);
});

Deno.test("calculateTimeLabelValue handles months", () => {
  assertEquals(calculateTimeLabelValue("Time: 1 month"), 5);
  assertEquals(calculateTimeLabelValue("Time: 2 months"), 13);
});

Deno.test("calculateTimeLabelValue defaults to 0", () => {
  assertEquals(calculateTimeLabelValue("no time"), 0);
});
