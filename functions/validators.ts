import { POSTRequestBody, ValidationResult } from "./types";
import { GitHubUserResponse } from "../src/home/github-types";
import { Octokit } from "npm:@octokit/rest";

export async function validatePOST(request: Request): Promise<ValidationResult> {
  const jsonData: POSTRequestBody = await request.json();

  const { authToken, referralCode, timestamp } = jsonData;

  const octokit = new Octokit({ auth: authToken });

  try {
    const response = (await octokit.request("GET /user")) as GitHubUserResponse;

    const gitHubUser = response.data;

    return { isValid: true, gitHubUser: gitHubUser, referralCode: referralCode, authToken: authToken, timestamp };
  } catch (error) {
    console.error("User is not logged in");
    return { isValid: false };
  }
}
