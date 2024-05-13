declare const SUPABASE_STORAGE_KEY: string; // @DEV: passed in at build time check build/esbuild-build.ts
import { Octokit } from "@octokit/rest";
import { checkSupabaseSession } from "../rendering/render-github-login-button";
import { getLocalStore } from "./get-local-store";

/**
 * Checks if the logged-in user is part of Ubiquity's Org, and didn't grant the 'repo' scope
 */
export async function isOrgMemberWithoutScope() {
  const octokit = new Octokit({ auth: await getGitHubAccessToken() });
  try {
    await octokit.orgs.getMembershipForAuthenticatedUser({
      org: "ubiquity",
    });
  } catch (e) {
    if (e && typeof e === "object" && "status" in e && e.status === 404) {
      return false;
    }
    throw e;
  }
  const { headers } = await octokit.request("HEAD /");
  if (headers) {
    const scopes = headers["x-oauth-scopes"]?.split(", ");
    return !scopes?.includes("repo");
  }
  return false;
}

export async function getGitHubAccessToken(): Promise<string | null> {
  // better to use official function, looking up localstorage has flaws
  const oauthToken = await checkSupabaseSession();

  const expiresAt = oauthToken?.expires_at;
  if (expiresAt) {
    if (expiresAt < Date.now() / 1000) {
      localStorage.removeItem(`sb-${SUPABASE_STORAGE_KEY}-auth-token`);
      return null;
    }
  }

  const accessToken = oauthToken?.provider_token;
  if (accessToken) {
    return accessToken;
  }

  return null;
}

export function getGitHubUserName(): string | null {
  const oauthToken = getLocalStore(`sb-${SUPABASE_STORAGE_KEY}-auth-token`) as OAuthToken | null;

  const username = oauthToken?.user?.user_metadata?.user_name;
  if (username) {
    return username;
  }

  return null;
}

export interface OAuthToken {
  provider_token: string;
  access_token: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at: string;
    phone: string;
    confirmed_at: string;
    last_sign_in_at: string;
    app_metadata: { provider: string; providers: string[] };
    user_metadata: {
      avatar_url: string;
      email: string;
      email_verified: boolean;
      full_name: string;
      iss: string;
      name: string;
      phone_verified: boolean;
      preferred_username: string;
      provider_id: string;
      sub: string;
      user_name: string;
    };
    identities: [
      {
        id: string;
        user_id: string;
        identity_data: {
          avatar_url: string;
          email: string;
          email_verified: boolean;
          full_name: string;
          iss: string;
          name: string;
          phone_verified: boolean;
          preferred_username: string;
          provider_id: string;
          sub: string;
          user_name: string;
        };
        provider: string;
        last_sign_in_at: string;
        created_at: string;
        updated_at: string;
      },
    ];
    created_at: string;
    updated_at: string;
  };
}
