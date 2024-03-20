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
  env: {
    GITHUB_USERNAME: process.env.UBIQUIBOT_GITHUB_USERNAME,
    GITHUB_PASSWORD: process.env.UBIQUIBOT_GITHUB_PASSWORD,
  },
  watchForFileChanges: false,
  video: true,
});
