import { getGitHubAccessToken } from "./getters/get-github-access-token.ts";
import { getGitHubUser } from "./getters/get-github-user.ts";
import { GitHubUser } from "./github-types.ts";
import { trackReferralCode } from "./register-referral.ts";
import { displayGitHubUserInformation } from "./rendering/display-github-user-information.ts";
import { renderGitHubLoginButton } from "./rendering/render-github-login-button.ts";
import { startIssueScraper } from "./scraper/issue-scraper.ts";

export async function authentication() {
  if (!navigator.onLine) {
    console.warn("App is offline. Skipping authentication.");
    return;
  }

  const accessToken = await getGitHubAccessToken();
  if (!accessToken) {
    renderGitHubLoginButton();
  }

  const gitHubUser: null | GitHubUser = await getGitHubUser();
  if (accessToken && gitHubUser) {
    await trackReferralCode();
    await displayGitHubUserInformation(gitHubUser);
    const githubUserName = gitHubUser.login;
    await startIssueScraper(githubUserName);
  } else {
    // Token present but user fetch failed; show login to recover from stale/invalid session
    renderGitHubLoginButton();
  }
}
