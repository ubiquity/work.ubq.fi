import { createClient } from "@supabase/supabase-js";
import { toolbar } from "../ready-toolbar";

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error("SUPABASE_URL not found");
const supabaseAnonKey = process.env.SUPABASE_KEY;
if (!supabaseAnonKey) throw new Error("SUPABASE_KEY not found");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabase() {
  return supabase;
}

async function gitHubLoginButtonHandler() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: "github" });
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
