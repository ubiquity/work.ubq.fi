import { Octokit } from "@octokit/rest";
import { createClient } from "@supabase/supabase-js";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { toolbar } from "../ready-toolbar";

declare const SUPABASE_URL: string; // @DEV: passed in at build time check build/esbuild-build.ts
declare const SUPABASE_ANON_KEY: string; // @DEV: passed in at build time check build/esbuild-build.ts

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getSupabase() {
  return supabase;
}

export async function checkSupabaseSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

async function gitHubLoginButtonHandler() {
  const scopes = "public_repo";
  // TODO check user member?
  try {
    console.log("1. gitHubLoginButtonHandler");
    const octokit = new Octokit({ auth: await getGitHubAccessToken() });
    console.log("2. gitHubLoginButtonHandler");
    const data = await octokit.rest.orgs.get();
    console.log("3. gitHubLoginButtonHandler");
    console.log(data);
  } catch (e) {
    console.error(e);
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes,
    },
  });
  if (error) {
    console.error("Error logging in:", error);
  }
}
const gitHubLoginButton = document.createElement("button");
export function renderGitHubLoginButton() {
  gitHubLoginButton.id = "github-login-button";
  gitHubLoginButton.innerHTML = "<span>Login</span><span class='full'>&nbsp;With GitHub</span>";
  gitHubLoginButton.addEventListener("click", gitHubLoginButtonHandler);
  if (toolbar) {
    toolbar.appendChild(gitHubLoginButton);
    toolbar.classList.add("ready");
  }
}
export { gitHubLoginButton };
