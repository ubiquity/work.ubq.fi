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
  try {
    const { user, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes: "public_repo", // Default scope for newcomers
      },
    });

    if (error) {
      console.error("Error logging in:", error);
      return;
    }

    const { data, error: fetchError } = await supabase.from("users").select("userType").eq("id", user.id).single();

    if (fetchError) {
      console.error("Error fetching user data:", fetchError);
      return;
    }

    const userType = data.userType;

    const scopes = userType === "core" ? "repo" : "public_repo";

    // Request GitHub login with the appropriate scopes
    const { error: loginError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        scopes,
      },
    });

    if (loginError) {
      console.error("Error during GitHub login:", loginError);
    } else {
      console.log("GitHub login successful!");
    }
  } catch (error) {
    console.error("Error during GitHub login:", error);
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
