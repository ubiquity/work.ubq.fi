import { GitHubUser, authenticatedGetGitHubUser } from "./authenticated-get-github-user";
import { checkForGitHubAccessToken } from "./check-for-github-access-token";
import { displayGitHubIssues } from "./display-github-issues";
import { displayGitHubUserInformation } from "./display-github-user-information";

const gitHubToken = checkForGitHubAccessToken();

displayGitHubIssues(gitHubToken)
  .then(authenticatedGetGitHubUser)
  .then((gitHubUser: null | GitHubUser) => {
    if (gitHubUser) {
      console.trace({ gitHubUser });
      displayGitHubUserInformation(gitHubUser);
    }
  })
  .catch((error) => {
    console.error(error);
  });

// const isLight = prefersLightMode();
// if (isLight) {
//   console.trace({ isLight });
//   downloadStylesheet("style/inverted-style.css");
// }

// function downloadStylesheet(url: string) {
//   const xhr = new XMLHttpRequest();
//   xhr.open("GET", url, true);
//   xhr.onreadystatechange = () => {
//     if (xhr.readyState === XMLHttpRequest.DONE) {
//       if (xhr.status === 200) {
//         const style = document.createElement("style");
//         style.textContent = xhr.responseText;
//         document.head.appendChild(style);
//       } else {
//         console.error("Failed to load stylesheet", url);
//       }
//     }
//   };
//   xhr.send();
// }
// function prefersLightMode() {
//   return window.matchMedia("(prefers-color-scheme: light)").matches;
// }
