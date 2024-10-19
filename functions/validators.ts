import { CustomRequest, POSTRequestBody, ValidationResult } from "./types";
import { Octokit } from "@octokit/rest";

export async function validatePOST(request: CustomRequest): Promise<ValidationResult> {
  try {
    const jsonData: POSTRequestBody = await request.json();

    const { authToken, referralCode } = jsonData;

    if (!authToken || !referralCode) {
      console.error("Missing authToken or referralCode");
      return { isValid: false };
    }

    const providerToken = authToken.provider_token;

    if (!providerToken) {
      console.error("Missing provider token");
      return { isValid: false };
    }

    const octokit = new Octokit({ auth: providerToken });

    try {
      await octokit.request("GET /user");

      const githubUserId = authToken.user?.user_metadata?.provider_id;

      if (githubUserId) {
        return { isValid: true, githubUserId: githubUserId, referralCode: referralCode };
      } else {
        console.error("Missing GitHub user ID");
        return { isValid: false };
      }
    } catch (error) {
      console.error("User is not logged in");
      return { isValid: false };
    }
  } catch (error) {
    console.error("Invalid JSON");
    return { isValid: false };
  }
}
