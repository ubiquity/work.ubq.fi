import { POSTRequestBody, ValidationResult } from "./types.ts";
import { Octokit } from "npm:@octokit/rest";

export async function validatePOST(request: Request): Promise<ValidationResult> {
  const jsonData: POSTRequestBody = await request.json();

  const { authToken, referralCode, timestamp } = jsonData;

  const octokit = new Octokit({ auth: authToken });

  try {
    const { data: gitHubUser } = await octokit.request("GET /user");
    return { isValid: true, gitHubUser, referralCode, authToken, timestamp };
  } catch (error) {
    console.error("User is not logged in");
    return { isValid: false };
  }
}
