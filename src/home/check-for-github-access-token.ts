import { renderGitHubLoginButton } from "./github-login-button";

let gitHubAccessToken: null | string = null;

export function checkForGitHubAccessToken(): string | null {
  const accessToken = localStorage.getItem("provider_token");
  const expiresAt = localStorage.getItem("expires_at");

  if (expiresAt && parseInt(expiresAt, 10) < Date.now() / 1000) {
    // expired
    localStorage.removeItem("provider_token");
    localStorage.removeItem("expires_at");
  }

  if (accessToken) {
    gitHubAccessToken = accessToken;
    return accessToken;
  } else {
    renderGitHubLoginButton();
    return null;
  }
}

export function getExistingSessionToken() {
  return gitHubAccessToken;
}
