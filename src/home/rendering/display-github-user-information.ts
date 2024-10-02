import { isOrgMemberWithoutScope } from "../getters/get-github-access-token";
import { GitHubUser } from "../github-types";
import { renderErrorInModal } from "./display-popup-modal";
import { getSupabase, renderAugmentAccessButton, authenticationElement } from "./render-github-login-button";
import { toolbar } from "../ready-toolbar";

export async function displayGitHubUserInformation(gitHubUser: GitHubUser) {
  const authenticatedDivElement = document.createElement("div");
  const containerDivElement = document.createElement("div");
  authenticatedDivElement.id = "authenticated";
  authenticatedDivElement.classList.add("user-container");
  if (!toolbar) throw new Error("toolbar not found");

  const img = document.createElement("img");
  if (gitHubUser.avatar_url) {
    img.src = gitHubUser.avatar_url;
  } else {
    img.classList.add("github-avatar-default");
  }
  img.alt = gitHubUser.login;
  authenticatedDivElement.appendChild(img);

  const divNameElement = document.createElement("div");

  // Falls back to login because the name is not required for a GitHub user
  divNameElement.textContent = gitHubUser.name || gitHubUser.login;
  divNameElement.classList.add("full");
  authenticatedDivElement.appendChild(divNameElement);

  authenticatedDivElement.addEventListener("click", async function signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      renderErrorInModal(error, "Error logging out");
      alert("Error logging out");
    }
    window.location.reload();
  });

  if (await isOrgMemberWithoutScope()) {
    const accessButton = renderAugmentAccessButton();
    containerDivElement.appendChild(accessButton);
  }

  authenticationElement.appendChild(authenticatedDivElement);
  toolbar.setAttribute("data-authenticated", "true");
  toolbar.classList.add("ready");
}
