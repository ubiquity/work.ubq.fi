import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error("SUPABASE_URL not found");
const supabaseAnonKey = process.env.SUPABASE_KEY;
if (!supabaseAnonKey) throw new Error("SUPABASE_KEY not found");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabase() {
  return supabase;
}

async function gitHubLoginButton() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: "https://wfzpewmlyiozupulbuur.supabase.co/auth/v1/callback",
    },
  });

  if (error) {
    console.error("Error logging in:", error);
  }
}

export function renderGitHubLoginButton() {
  const button = document.createElement("button");
  button.id = "github-login-button";
  button.innerHTML = "<span>Login</span><span class='full'>&nbsp;With GitHub</span>";
  button.addEventListener("click", gitHubLoginButton);
  const toolbar = document.getElementById("toolbar");
  if (!toolbar) throw new Error("toolbar not found");
  toolbar.appendChild(button);
  toolbar.classList.add("ready");
}
