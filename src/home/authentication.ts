import { ReferralInsert } from "../../supabase/tables/referrals";
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
    const referral: ReferralInsert = {
      referralCode: localStorage.getItem("ref") ?? "",
      username: gitHubUser.login,
      userId: gitHubUser.id,
    };
    await trackDevRelReferral(referral);
    await displayGitHubUserInformation(gitHubUser);
  }
}
