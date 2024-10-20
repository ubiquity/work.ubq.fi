import { trackDevRelReferral } from "./devrel-tracker";
import { getGitHubAccessToken } from "./getters/get-github-access-token";
import { getGitHubUser } from "./getters/get-github-user";
import { GitHubUser } from "./github-types";
import { displayGitHubUserInformation } from "./rendering/display-github-user-information";
import { renderGitHubLoginButton } from "./rendering/render-github-login-button";

export async function authentication() {
  const accessToken = await getGitHubAccessToken();
  if (!accessToken) {
    renderGitHubLoginButton();
  }

  const gitHubUser: null | GitHubUser = await getGitHubUser();
  if (gitHubUser) {
    await trackDevRelReferral();
    await displayGitHubUserInformation(gitHubUser);
  }
}
