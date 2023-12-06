import { Octokit } from "@octokit/rest";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { getLocalStore } from "../getters/get-local-store";
import { GitHubIssue } from "../github-types";
import { PreviewToFullMapping } from "./preview-to-full-mapping";

export const previewToFullMapping = new PreviewToFullMapping().getMapping();

export const organizationImageCache = [] as { [organization: string]: string | null }[];

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

        previewToFullMapping.set(preview.id, full);
        const issueElement = document.querySelector(`[data-preview-id="${preview.id}"]`);
        issueElement?.setAttribute("data-full-id", full.id.toString());
        // const imageElement = issueElement?.querySelector("img");

        localStorage.setItem("gitHubIssuesFull", JSON.stringify(Array.from(previewToFullMapping.entries())));
        return { full, issueElement };
      })
      .then(({ full, issueElement }) => {
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
            const orgCacheEntryIndex = organizationImageCache.findIndex((entry) => Object.prototype.hasOwnProperty.call(entry, orgName));
            if (orgCacheEntryIndex !== -1) {
              organizationImageCache[orgCacheEntryIndex][orgName] = avatarUrl;
            } else {
              organizationImageCache.push({ [orgName]: avatarUrl });
            }

            // now check every issue element for the same org name
            previewToFullMapping.forEach((full) => {
              const _issueElement = document.querySelector(`[data-full-id="${full.id}"]`);
              const _urlMatch = full.html_url.match(urlPattern);
              const _orgName = _urlMatch?.groups?.org;

              if (orgName == _orgName) {
                const imageElement = _issueElement?.querySelector("img");
                if (imageElement) {
                  imageElement.src = avatarUrl;
                }
              }
            });

            const imageElement = issueElement?.querySelector("img");
            if (imageElement) {
              imageElement.src = avatarUrl;
            }
            return full;
          });
        }
        return full;
      });
  });

  return issueFetchPromises;
}
