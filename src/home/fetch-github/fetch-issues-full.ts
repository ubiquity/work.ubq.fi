import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { PreviewToFullMapping } from "./preview-to-full-mapping";
import { saveImageToDB } from "../getters/get-indexed-db";

export const previewToFullMapping = new PreviewToFullMapping().getMapping();

export const organizationImageCache = [] as { [organization: string]: Blob | null }[];

export function fetchIssuesFull(previews: GitHubIssue[]) {
  const authToken = getGitHubAccessToken();
  if (!authToken) throw new Error("No auth token found");
  const octokit = new Octokit({ auth: getGitHubAccessToken() });
  const urlPattern = /https:\/\/github\.com\/(?<org>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue_number>\d+)/;

  const cachedPreviews = previews || (getLocalStore("gitHubIssuesPreview") as GitHubIssue[]);

  const issueFetchPromises = cachedPreviews.map((preview) => {
    const match = preview.body.match(urlPattern);

    if (!match || !match.groups) {
      console.error("Invalid issue body URL format");
      return Promise.resolve(null);
    }

    const { org, repo, issue_number } = match.groups;

    return octokit
      .request("GET /repos/{org}/{repo}/issues/{issue_number}", { issue_number, repo, org })
      .then(({ data: response }) => {
        const full = response as GitHubIssue;

        // Update the cache with the fetched issue if it's more recent than the cached issue
        const cachedIssues = (getLocalStore("gitHubIssuesFull") || []) as GitHubIssue[];
        const cachedIssuesMap = new Map(cachedIssues.map((issue) => [issue.id, issue]));
        const cachedIssue = cachedIssuesMap.get(full.id);
        if (!cachedIssue || new Date(full.updated_at) > new Date(cachedIssue.updated_at)) {
          cachedIssuesMap.set(full.id, full);
          const updatedCachedIssues = Array.from(cachedIssuesMap.values());
          localStorage.setItem("gitHubIssuesFull", JSON.stringify(updatedCachedIssues));
        }

        previewToFullMapping.set(preview.id, full);
        const issueElement = document.querySelector(`[data-preview-id="${preview.id}"]`);
        issueElement?.setAttribute("data-full-id", full.id.toString());

        localStorage.setItem("gitHubIssuesFull", JSON.stringify(Array.from(previewToFullMapping.entries())));
        return { full, issueElement };
      })
      .then(({ full }) => {
        const urlMatch = full.html_url.match(urlPattern);
        const orgName = urlMatch?.groups?.org;

        if (orgName) {
          const orgCacheEntry = organizationImageCache.find((entry) => entry[orgName] !== undefined);
          if (orgCacheEntry) {
            return; // no redundant requests
          } else {
            organizationImageCache.push({ [orgName]: null });
          }
          return octokit.rest.orgs.get({ org: orgName }).then(({ data }) => {
            const avatarUrl = data.avatar_url;
            // Fetch the image as a Blob and save it to IndexedDB
            return fetch(avatarUrl)
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
                return full;
              });
          });
        }
        return full;
      });
  });

  return issueFetchPromises;
}
