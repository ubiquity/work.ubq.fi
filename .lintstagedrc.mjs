export default {
  "*.ts": ["deno run -A npm:prettier@3.2.5 --write", "deno run -A npm:eslint@9.38.0 --fix --config eslint.config.mjs"],
  "src/**.{ts,json}": ["deno run -A npm:cspell@9.2.1"],
};
