// Lazy-load supabase at runtime in the browser from CDN to avoid bundling issues
let supabase: any;
async function ensureSupabase() {
  if (!supabase) {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.0");
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}
import { renderErrorInModal } from "./display-popup-modal";

declare const SUPABASE_URL: string; // @DEV: passed in at build time check build/esbuild-build.ts
declare const SUPABASE_ANON_KEY: string; // @DEV: passed in at build time check build/esbuild-build.ts
declare const NODE_ENV: string; // @DEV: passed in at build time check build/esbuild-build.ts
declare const GIT_REVISION: string; // @DEV: passed in at build time check build/esbuild-build.ts
declare const SUPABASE_STORAGE_KEY: string; // @DEV: passed in at build time check build/esbuild-build.ts

export function getSupabase() {
  if (!supabase) throw new Error("Supabase client not initialized yet");
  return supabase;
}

export async function checkSupabaseSession() {
  // In testing mode, we directly read the storage since we cannot use Supabase for auth operations
  if (NODE_ENV === "test") {
    const stored = localStorage.getItem(`sb-${SUPABASE_STORAGE_KEY}-auth-token`);
    if (!stored) return null;
    return JSON.parse(stored);
  }

  const {
    data: { session },
  } = await (await ensureSupabase()).auth.getSession();

  return session;
}

async function gitHubLoginButtonHandler(scopes = "public_repo read:org") {
  // Avoid carrying any existing hash to prevent double-hash fragments after OAuth redirect
  const { origin, pathname, search } = window.location;
  const redirectTo = `${origin}${pathname}${search}`;
  const client = await ensureSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes,
      redirectTo,
    },
  });
  if (error) {
    renderErrorInModal(error, "Error logging in");
  }
}

// Rebranded: Enable Private Issues button (requests 'repo' scope)
const enablePrivateIssuesButton = document.createElement("button");
export function renderEnablePrivateIssuesButton() {
  enablePrivateIssuesButton.id = "enable-private-issues-button";
  enablePrivateIssuesButton.setAttribute("aria-label", "Enable Private Issues");
  enablePrivateIssuesButton.innerHTML = `<span title="Enable access to private issues"><svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M240-640h360v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85h-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640Zm0 480h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM240-160v-400 400Z"/></svg><span/>`;
  enablePrivateIssuesButton.addEventListener("click", () => gitHubLoginButtonHandler("repo read:org"));
  return enablePrivateIssuesButton;
}

const gitHubLoginButton = document.createElement("button");
export const authenticationElement = document.getElementById("authentication") as HTMLDivElement;
export function renderGitHubLoginButton() {
  gitHubLoginButton.id = "github-login-button";
  gitHubLoginButton.innerHTML = "<span>Login</span><span class='full'>&nbsp;With GitHub</span>";
  gitHubLoginButton.addEventListener("click", () => gitHubLoginButtonHandler());
  if (authenticationElement) {
    authenticationElement.appendChild(gitHubLoginButton);
    authenticationElement.classList.add("ready");
  }
}

export function renderGitRevision() {
  const gitRevision = document.getElementById("git-revision") as HTMLAnchorElement;
  if (!gitRevision) throw new Error("Could not find element with id 'git-revision'");
  gitRevision.href = `https://github.com/ubiquity/work.ubq.fi/commit/${GIT_REVISION}`;
  gitRevision.textContent = GIT_REVISION;
}

export { gitHubLoginButton };
