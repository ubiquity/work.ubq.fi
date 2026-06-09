/// <reference lib="deno.ns" />
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildDeveloperMatchProfile,
  loadDeveloperMatchProfile,
  MATCH_PROFILE_STORAGE_KEY,
  saveDeveloperMatchProfile,
} from "../src/home/matching/developer-profile.ts";

Deno.test("buildDeveloperMatchProfile extracts stable terms from completed issue text", () => {
  const profile = buildDeveloperMatchProfile(
    [
      {
        plaintext: "Fix Deno routing and Supabase validation for preview deployments",
        repository: "ubiquity/work.ubq.fi",
      },
      {
        plaintext: "Add deterministic Deno tests for routing fallback behavior",
      },
    ],
    123
  );

  assertEquals(profile.updatedAt, 123);
  assertEquals(profile.repositories, ["ubiquity/work.ubq.fi"]);
  assertEquals(profile.terms.slice(0, 3), ["deno", "routing", "add"]);
});

Deno.test("saveDeveloperMatchProfile skips empty profiles and loads saved profiles", () => {
  const storage = new Map<string, string>();
  const adapter: Storage = {
    get length() {
      return storage.size;
    },
    clear() {
      storage.clear();
    },
    getItem(key) {
      return storage.get(key) ?? null;
    },
    key(index) {
      return [...storage.keys()][index] ?? null;
    },
    removeItem(key) {
      storage.delete(key);
    },
    setItem(key, value) {
      storage.set(key, value);
    },
  };

  saveDeveloperMatchProfile({ terms: [], repositories: [], updatedAt: 1 }, adapter);
  assertEquals(adapter.getItem(MATCH_PROFILE_STORAGE_KEY), null);

  saveDeveloperMatchProfile({ terms: ["deno"], repositories: ["ubiquity/work.ubq.fi"], updatedAt: 2 }, adapter);
  assertEquals(loadDeveloperMatchProfile(adapter), {
    terms: ["deno"],
    repositories: ["ubiquity/work.ubq.fi"],
    updatedAt: 2,
  });
});
