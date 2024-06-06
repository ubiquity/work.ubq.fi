import { defineConfig } from "cypress";
import { config } from "dotenv";

config();

export default defineConfig({
  e2e: {
    setupNodeEvents() {},
    baseUrl: "http://localhost:8080",
    experimentalStudio: true,
  },
  viewportHeight: 900,
  viewportWidth: 1440,
  env: readEnvironmentVariables(),
  watchForFileChanges: false,
  video: true,
});

function readEnvironmentVariables() {
  const UBIQUIBOT_GITHUB_USERNAME = process.env["UBIQUIBOT_GITHUB_USERNAME"];
  const UBIQUIBOT_GITHUB_PASSWORD = process.env["UBIQUIBOT_GITHUB_PASSWORD"];

  if (!UBIQUIBOT_GITHUB_USERNAME) {
    throw new Error("Please provide `UBIQUIBOT_GITHUB_USERNAME` environment variable");
  }

  if (!UBIQUIBOT_GITHUB_PASSWORD) {
    throw new Error("Please provide `UBIQUIBOT_GITHUB_PASSWORD` environment variable");
  }
  return { UBIQUIBOT_GITHUB_USERNAME, UBIQUIBOT_GITHUB_PASSWORD };
}
