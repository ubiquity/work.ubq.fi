import { isOrgMemberWithoutScope } from "../getters/get-github-access-token";
import { GitHubUser } from "../github-types";
import { getSupabase, renderAugmentAccessButton } from "./render-github-login-button";

export async function displayGitHubUserInformation(gitHubUser: GitHubUser) {
  const toolbar = document.getElementById("toolbar");
  const authenticatedDivElement = document.createElement("div");
  const containerDivElement = document.createElement("div");
  authenticatedDivElement.id = "authenticated";
  authenticatedDivElement.classList.add("user-container");
  if (!toolbar) throw new Error("toolbar not found");

  const img = document.createElement("img");
  if (gitHubUser.avatar_url) {
    img.src = gitHubUser.avatar_url;
  } else {
    img.style.width = "50px";
    img.style.height = "50px";
    img.style.backgroundColor = "#808080";
  }
  img.alt = gitHubUser.login;
  authenticatedDivElement.appendChild(img);

  const divNameElement = document.createElement("div");

  divNameElement.textContent = gitHubUser.name;
  divNameElement.classList.add("full");
  authenticatedDivElement.appendChild(divNameElement);

  authenticatedDivElement.addEventListener("click", async function signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      alert(error);
    }
    window.location.reload();
  });

  containerDivElement.appendChild(authenticatedDivElement);

  if (await isOrgMemberWithoutScope()) {
    const accessButton = renderAugmentAccessButton();
    containerDivElement.appendChild(accessButton);
  }

  toolbar.appendChild(containerDivElement);
  toolbar.setAttribute("data-authenticated", "true");
  toolbar.classList.add("ready");
}
