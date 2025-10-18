// Commitlint config for Deno-driven CLI (no external extends)
// Self-contained conventional rules to avoid Node/peer deps.
export default {
  parserPreset: {
    parserOpts: {
      // type(scope)!: subject
      headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
      headerCorrespondence: ["type", "scope", "subject"],
      noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
      revertPattern: /^revert: (.*)$/,
      revertCorrespondence: ["header"],
    },
  },
  rules: {
    "type-enum": [2, "always", ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"]],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 100],
    // Commonly allowed variations; keep non-prescriptive
    "scope-empty": [0],
    "scope-case": [0],
    "subject-case": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
