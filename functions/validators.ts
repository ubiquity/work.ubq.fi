import { POSTRequestBody, ValidationResult } from "./types";
import { GitHubUserResponse } from "../src/home/github-types";
import { Request } from "@cloudflare/workers-types";
import { Octokit } from "@octokit/rest";

export async function validatePOST(request: Request): Promise<ValidationResult> {
  const jsonData: POSTRequestBody = await request.json();

  const { authToken, referralCode } = jsonData;

  const octokit = new Octokit({ auth: authToken });

  try {
    const response = (await octokit.request("GET /user")) as GitHubUserResponse;

    const githubUser = response.data;

    return { isValid: true, githubUserId: githubUser.id.toString(), referralCode: referralCode };
  } catch (error) {
    console.error("User is not logged in");
    return { isValid: false };
  }
}
