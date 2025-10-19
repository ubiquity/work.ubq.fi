/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getLabelText } from "../src/home/sorting/label-utils.ts";

Deno.test("getLabelText handles string labels", () => {
  assertEquals(getLabelText("bug" as unknown as never), "bug");
});

Deno.test("getLabelText handles object labels with name", () => {
  assertEquals(getLabelText({ name: "feature" } as never), "feature");
});

Deno.test("getLabelText handles empty or missing names", () => {
  assertEquals(getLabelText({ name: "" } as never), "");
});
