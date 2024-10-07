import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getImageFromCache, saveImageToCache } from "../getters/get-indexed-db";
import { renderErrorInModal } from "../rendering/display-popup-modal";
import { organizationImageCache } from "./fetch-issues-full";

// Map to track ongoing avatar fetches
const pendingFetches: Map<string, Promise<Blob | void>> = new Map();

export async function fetchAvatar(orgName: string): Promise<Blob | void> {
  // Check if the avatar is already cached in memory
  const cachedAvatar = organizationImageCache.get(orgName);
  if (cachedAvatar) {
    console.log(`Returning cached avatar for ${orgName}`);
    return cachedAvatar;
  }

  // If there's a pending fetch for this organization, wait for it to complete
  if (pendingFetches.has(orgName)) {
    console.log(`Waiting for ongoing fetch for ${orgName}`);
    return pendingFetches.get(orgName);
  }

  // Start the fetch process and store the promise in the pending fetches map
  const fetchPromise = (async () => {
    console.log(`Attempting to fetch avatar for ${orgName}`);

    // Step 1: Try to get the avatar from IndexedDB
    const avatarBlob = await getImageFromCache({ dbName: "GitHubAvatars", storeName: "ImageStore", orgName: `avatarUrl-${orgName}` });
    if (avatarBlob) {
      console.log(`Avatar found in IndexedDB for ${orgName}`);
      organizationImageCache.set(orgName, avatarBlob); // Cache it in memory
      return avatarBlob;
    }

    // Step 2: No avatar in IndexedDB, fetch from network
    const octokit = new Octokit({ auth: await getGitHubAccessToken() });

    try {
      const {
        data: { avatar_url: avatarUrl },
      } = await octokit.rest.orgs.get({ org: orgName });

      if (avatarUrl) {
        console.log(`Fetching avatar from network for ${orgName}`);
        const response = await fetch(avatarUrl);
        const blob = await response.blob();

        // Cache the fetched avatar in both memory and IndexedDB
        await saveImageToCache({
          dbName: "GitHubAvatars",
          storeName: "ImageStore",
          keyName: "name",
          orgName: `avatarUrl-${orgName}`,
          avatarBlob: blob,
        });

        organizationImageCache.set(orgName, blob);
        console.log(`Avatar cached for ${orgName}`);
        return blob;
      }
    } catch (error) {
      renderErrorInModal(error as Error, `Failed to fetch avatar for organization ${orgName}: ${error}`);
    }

    // Step 3: Try fetching for users if the organization lookup failed
    try {
      const {
        data: { avatar_url: avatarUrl },
      } = await octokit.rest.users.getByUsername({ username: orgName });

      if (avatarUrl) {
        console.log("Fetching avatar from network by user", orgName);
        const response = await fetch(avatarUrl);
        const blob = await response.blob();

        // Cache the fetched avatar in both memory and IndexedDB
        await saveImageToCache({
          dbName: "GitHubAvatars",
          storeName: "ImageStore",
          keyName: "name",
          orgName: `avatarUrl-${orgName}`,
          avatarBlob: blob,
        });

        organizationImageCache.set(orgName, blob);
        console.log(`Avatar cached for user ${orgName}`);

        return blob;
      }
    } catch (innerError) {
      renderErrorInModal(innerError as Error, `Failed to fetch avatar for user ${orgName}: ${innerError}`);
    }
  })();

  pendingFetches.set(orgName, fetchPromise);

  // Wait for the fetch to complete
  try {
    const result = await fetchPromise;
    return result;
  } finally {
    // Remove the pending fetch once it completes
    pendingFetches.delete(orgName);
  }
}
