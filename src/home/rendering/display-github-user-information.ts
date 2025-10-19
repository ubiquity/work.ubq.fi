import { GitHubUser } from "../github-types.ts";
import { toolbar } from "../ready-toolbar.ts";
import { renderErrorInModal } from "./display-popup-modal.ts";
import { authenticationElement, getSupabase, renderEnablePrivateIssuesButton } from "./render-github-login-button.ts";
import { isMissingRepoScope } from "../getters/get-github-access-token.ts";

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

  authenticatedDivElement.addEventListener("click", async function signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      renderErrorInModal(error, "Error logging out");
      alert("Error logging out");
    }
    window.location.replace("/");
  });

  // If token lacks 'repo' scope, offer to enable private issues via re-auth
  try {
    if (await isMissingRepoScope()) {
      const privateIssuesButton = renderEnablePrivateIssuesButton();
      containerDivElement.appendChild(privateIssuesButton);
      authenticationElement.appendChild(containerDivElement);
    }
  } catch (e) {
    // Non-fatal: failure to detect scopes shouldn't break UI
    console.warn("Unable to detect GitHub scopes", e);
  }

  authenticationElement.appendChild(authenticatedDivElement);
  toolbar.setAttribute("data-authenticated", "true");
  toolbar.classList.add("ready");
}
