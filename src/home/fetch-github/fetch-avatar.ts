import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getImageFromDB, saveImageToDB } from "../getters/get-indexed-db";
import { organizationImageCache } from "./fetch-issues-full";

export async function fetchAvatar(orgName: string) {
  // Check local cache first
  const cachedAvatar = organizationImageCache.find((entry) => entry[orgName] !== undefined);
  if (cachedAvatar) {
    return Promise.resolve();
  }

  // If not in local cache, check IndexedDB
  const avatarBlob = await getImageFromDB({ dbName: "ImageDatabase", storeName: "ImageStore", orgName: `avatarUrl-${orgName}` });
  if (avatarBlob) {
    // If the avatar Blob is found in IndexedDB, add it to the cache
    organizationImageCache.push({ [orgName]: avatarBlob });
    return Promise.resolve();
  }

  // If not in IndexedDB, fetch from network
  const octokit = new Octokit({ auth: getGitHubAccessToken() });
  return octokit.rest.orgs
    .get({ org: orgName })
    .then(async ({ data: { avatar_url: avatarUrl } }) => {
      if (avatarUrl) {
        // Fetch the image as a Blob and save it to IndexedDB
        await fetch(avatarUrl)
          .then((response) => response.blob())
          .then(async (blob) => {
            await saveImageToDB({
              dbName: "ImageDatabase",
              storeName: "ImageStore",
              keyName: "name",
              orgName: `avatarUrl-${orgName}`,
              avatarBlob: blob,
            });
            organizationImageCache.push({ [orgName]: blob });
          });
      }
    })
    .catch((error) => {
      console.error(`Failed to fetch avatar for organization ${orgName}: ${error}`);
    });
}