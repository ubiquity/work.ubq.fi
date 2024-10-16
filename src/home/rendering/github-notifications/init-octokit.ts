import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../../getters/get-github-access-token";

export async function initOctokit(): Promise<Octokit> {
  const accessToken = await getGitHubAccessToken();
  if (!accessToken) {
    console.warn("GitHub access token not found");
    return new Octokit();
  }
  return new Octokit({ auth: accessToken });
}
