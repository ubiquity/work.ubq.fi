import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { getGitHubUser } from "./getters/get-github-user";
import { GitHubUser } from "./github-types";
import { trackReferralCode } from "./register-referral";
import { displayGitHubUserInformation } from "./rendering/display-github-user-information";
import { getSupabase, renderGitHubLoginButton } from "./rendering/render-github-login-button";
import { issueScraper } from "./scraper/issue-scraper";

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
  if (gitHubUser) {
    await trackReferralCode();
    await displayGitHubUserInformation(gitHubUser);
    // <-- Issue Scraper here -->
    const supabase = getSupabase();
    const githubUserName = gitHubUser.login;
    await issueScraper(githubUserName, supabase, accessToken || undefined);
  }
}
