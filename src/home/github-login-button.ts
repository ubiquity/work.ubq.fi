import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error("SUPABASE_URL not found");
const supabaseAnonKey = process.env.SUPABASE_KEY;
if (!supabaseAnonKey) throw new Error("SUPABASE_KEY not found");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  button.textContent = "Login with GitHub";
  button.addEventListener("click", gitHubLoginButton);
  document.getElementById("toolbar")?.appendChild(button);
}
