import { CustomRequest } from "./types";
import { OAuthToken } from "../src/home/getters/get-github-access-token";

export async function validatePOST(url: URL, request: CustomRequest): Promise<boolean> {
  try {
    const jsonData: unknown = await request.json();

    const authToken = jsonData as OAuthToken;

    const githubUserId = authToken?.user?.id;

    const key = url.searchParams.get("key");

    if (githubUserId && githubUserId == key) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Invalid JSON");
    return false;
  }
}
