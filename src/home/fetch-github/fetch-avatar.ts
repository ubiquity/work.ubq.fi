import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getImageFromCache, saveImageToCache } from "../getters/get-indexed-db";
import { renderErrorInModal } from "../rendering/display-popup-modal";
import { organizationImageCache } from "./fetch-issues-full";

export async function fetchAvatar(orgName: string) {
  // Check local cache first
  const cachedAvatar = organizationImageCache.get(orgName);
  if (cachedAvatar) {
    return Promise.resolve();
  }

  // If not in local cache, check IndexedDB
  const avatarBlob = await getImageFromCache({ dbName: "GitHubAvatars", storeName: "ImageStore", orgName: `avatarUrl-${orgName}` });
  if (avatarBlob) {
    // If the avatar Blob is found in IndexedDB, add it to the cache
    organizationImageCache.set(orgName, avatarBlob);
    return Promise.resolve();
  }

  // If not in IndexedDB, fetch from network
  const octokit = new Octokit({ auth: await getGitHubAccessToken() });
  try {
    const {
      data: { avatar_url: avatarUrl },
    } = await octokit.rest.orgs.get({ org: orgName });
    if (avatarUrl) {
      // Fetch the image as a Blob and save it to IndexedDB
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      await saveImageToCache({
        dbName: "GitHubAvatars",
        storeName: "ImageStore",
        keyName: "name",
        orgName: `avatarUrl-${orgName}`,
        avatarBlob: blob,
      });
      organizationImageCache.set(orgName, blob);
    }
  } catch (error) {
    renderErrorInModal(error as Error, `Failed to fetch avatar for organization ${orgName}: ${error}`);
    const {
      data: { avatar_url: avatarUrl },
    } = await octokit.rest.users.getByUsername({ username: orgName });
    if (avatarUrl) {
      // Fetch the image as a Blob and save it to IndexedDB
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      await saveImageToCache({
        dbName: "GitHubAvatars",
        storeName: "ImageStore",
        keyName: "name",
        orgName: `avatarUrl-${orgName}`,
        avatarBlob: blob,
      });
      organizationImageCache.set(orgName, blob);
    }
  }
}
