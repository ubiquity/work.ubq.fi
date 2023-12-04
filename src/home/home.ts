import { GitHubUser, authenticatedGetGitHubUser } from "./authenticated-get-github-user";
import { checkForGitHubAccessToken } from "./check-for-github-access-token";
import { displayGitHubIssues } from "./display-github-issues";
import { displayGitHubUserInformation } from "./display-github-user-information";

const gitHubToken = checkForGitHubAccessToken();

displayGitHubIssues(gitHubToken)
  .then(authenticatedGetGitHubUser)
  .then((gitHubUser: null | GitHubUser) => {
    if (gitHubUser) {
      displayGitHubUserInformation(gitHubUser);
    }
  })
  .catch((error) => console.error(error));
