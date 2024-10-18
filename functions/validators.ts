import { CustomRequest } from "./types";
import { OAuthToken } from "../src/home/getters/get-github-access-token";
import { Octokit } from "@octokit/rest";

export async function validatePOST(url: URL, request: CustomRequest): Promise<boolean> {
  try {
    const jsonData: unknown = await request.json();
    const authToken = jsonData as OAuthToken;

    const providerToken = authToken?.provider_token;

    if (providerToken) {
      const octokit = new Octokit({ auth: providerToken });

      try {
        await octokit.request("GET /user");

        const githubUserId = authToken?.user?.user_metadata?.provider_id;

        const key = url.searchParams.get("key");

        if (githubUserId && githubUserId === key) {
          return true;
        }

        return false;
      } catch (error) {
        console.error("User is not logged in");
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("Invalid JSON");
    return false;
  }
}
