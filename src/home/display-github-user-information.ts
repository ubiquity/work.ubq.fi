import { GitHubUser } from "./authenticated-get-github-user";
export function displayGitHubUserInformation(gitHubUser: GitHubUser) {
  const container = document.getElementById("authenticated-container");
  if (!container) throw new Error("container not found");
  const div = document.createElement("div");
  div.textContent = `Logged in as ${gitHubUser.login}`;
  container.appendChild(div);

  const img = document.createElement("img");
  img.src = gitHubUser.avatar_url;
  img.alt = gitHubUser.login;
  img.width = 200;
  img.height = 200;
  container.appendChild(img);

  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(gitHubUser, null, 2);
  container.appendChild(pre);
}
