import { createClient } from "@supabase/supabase-js";
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
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo",
    },
  });
  if (error) {
    console.error("Error logging in:", error);
  }
}
const gitHubLoginButton = document.createElement("button");
const buttonTarget = document.getElementById("github-login-button-target");
export function renderGitHubLoginButton() {
  gitHubLoginButton.id = "github-login-button";
  gitHubLoginButton.innerHTML = "<span>Login</span><span class='full'>&nbsp;With GitHub</span>";
  gitHubLoginButton.addEventListener("click", gitHubLoginButtonHandler);
  if (buttonTarget) {
    buttonTarget.appendChild(gitHubLoginButton);
  }
  if (toolbar) {
    toolbar.classList.add("ready");
  }
}
export { gitHubLoginButton };
