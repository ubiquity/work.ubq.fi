import { authenticatedGetGitHubUser } from "./authenticated-get-github-user";
import { displayGitHubIssues } from "./display-github-issues";
import { displayGitHubUserInformation } from "./display-github-user-information";
displayGitHubIssues()
  .then(async () => {
    const gitHubUser = await authenticatedGetGitHubUser();
    displayGitHubUserInformation(gitHubUser);
    console.trace({ gitHubUser });
  })
  .catch((error) => {
    // Handle any errors
    console.error(error);
  });
