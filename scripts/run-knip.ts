// Wrapper to run Knip in a Deno-only repo. If no package.json is present,
// Knip can't analyze dependencies, so we skip with a clear message.
try {
  await Deno.stat("package.json");
} catch {
  console.log("Skipping knip: no package.json in this Deno-only repo.");
  Deno.exit(0);
}

const cmd = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "npm:knip@3.13.2", ...Deno.args],
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await cmd.output();
Deno.exit(code);
