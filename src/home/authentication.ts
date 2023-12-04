import { GitHubUser, authenticatedGetGitHubUser } from "./authenticated-get-github-user";
import { checkForGitHubAccessToken } from "./check-for-github-access-token";
import { displayGitHubUserInformation } from "./display-github-user-information";
import { fetchGitHubIssues } from "./fetch-github-issues";

export function authentication() {
  const gitHubToken = checkForGitHubAccessToken();

  fetchGitHubIssues(gitHubToken)
    .then(authenticatedGetGitHubUser)
    .then((gitHubUser: null | GitHubUser) => {
      if (gitHubUser) {
        displayGitHubUserInformation(gitHubUser);
      }
    })
    .catch((error) => console.error(error));
}
