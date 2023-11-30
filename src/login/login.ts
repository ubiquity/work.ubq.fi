import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error("SUPABASE_URL not found");
const supabaseAnonKey = process.env.SUPABASE_KEY;
if (!supabaseAnonKey) throw new Error("SUPABASE_KEY not found");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function handleGitHubLogin() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: "https://wfzpewmlyiozupulbuur.supabase.co/auth/v1/callback",
      //   https://telegram-ubiquibot.cloudflare-17b.workers.dev/register
    },
  });

  if (error) {
    console.error("Error logging in:", error);
  }
}

const button = document.createElement("button");
button.textContent = "Login with GitHub";
button.addEventListener("click", handleGitHubLogin);
document.body.appendChild(button);

export default handleGitHubLogin;
