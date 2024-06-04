import { createClient } from "@supabase/supabase-js";
import { toolbar } from "../ready-toolbar";
import { showError } from "./display-popup-modal";

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

async function gitHubLoginButtonHandler(scopes = "public_repo read:org") {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes,
    },
  });
  if (error) {
    showError(`${error}`, true, "Error logging in:");
  }
}

const augmentAccessButton = document.createElement("button");
export function renderAugmentAccessButton() {
  augmentAccessButton.id = "augment-access-button";
  augmentAccessButton.innerHTML = `<span title="Allow access to private repositories"><svg viewBox="0 0 24 24" class="svg-icon"><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2m0 12H6V10h12z"></path></svg><span/>`;
  augmentAccessButton.addEventListener("click", () => gitHubLoginButtonHandler("repo read:org"));
  return augmentAccessButton;
}

const gitHubLoginButton = document.createElement("button");
export function renderGitHubLoginButton() {
  gitHubLoginButton.id = "github-login-button";
  gitHubLoginButton.innerHTML = "<span>Login</span><span class='full'>&nbsp;With GitHub</span>";
  gitHubLoginButton.addEventListener("click", () => gitHubLoginButtonHandler());
  if (toolbar) {
    toolbar.appendChild(gitHubLoginButton);
    toolbar.classList.add("ready");
  }
}

export { gitHubLoginButton };
