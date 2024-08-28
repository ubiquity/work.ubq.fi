import { RequestError } from "@octokit/request-error";
import { Octokit } from "@octokit/rest";
import { getGitHubUser } from "../getters/get-github-user";
import { renderErrorInModal } from "../rendering/display-popup-modal";
import { rateLimitModal } from "./fetch-issues-preview";
import { gitHubLoginButton } from "../rendering/render-github-login-button";
import { preview } from "../rendering/render-preview-modal";
import { toolbar } from "../ready-toolbar";

type RateLimit = {
  reset: number | null;
  user: boolean;
};

export async function handleRateLimit(octokit?: Octokit, error?: RequestError) {
  const rate: RateLimit = {
    reset: null,
    user: false,
  };

  preview.classList.add("active");
  document.body.classList.add("preview-active");

  if (toolbar) {
    toolbar.scrollTo({
      left: toolbar.scrollWidth,
      behavior: "smooth",
    });

    gitHubLoginButton?.classList.add("highlight");
  }

  if (error?.response?.headers["x-ratelimit-reset"]) {
    rate.reset = parseInt(error.response.headers["x-ratelimit-reset"]);
  }

  if (octokit) {
    try {
      const core = await octokit.rest.rateLimit.get();
      const remaining = core.data.resources.core.remaining;
      const reset = core.data.resources.core.reset;

      rate.reset = !rate.reset && remaining === 0 ? reset : rate.reset;
      rate.user = (await getGitHubUser()) ? true : false;
    } catch (err) {
      renderErrorInModal(err as Error, "Error handling GitHub rate limit");
    }
  }

  const resetParsed = rate.reset && new Date(rate.reset * 1000).toLocaleTimeString();

  if (!rate.user) {
    rateLimitModal(`You have been rate limited. Please log in to GitHub to increase your GitHub API limits, otherwise you can try again at ${resetParsed}.`);
  } else {
    rateLimitModal(`You have been rate limited. Please try again at ${resetParsed}.`);
  }
}
