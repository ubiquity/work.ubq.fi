import { marked } from "marked";

import { mapping } from "../fetch-github/fetch-issues-full";
import { GitHubIssueWithNewFlag } from "../fetch-github/preview-to-full-mapping";
import { getLocalStore } from "../getters/get-local-store";
import { AvatarCache } from "../github-types";
import { issuesContainer, preview, previewBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";

const openNewLinkIcon = `<span class="open-new-link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"></path></svg></span>`;

export function renderGitHubIssues(container: HTMLDivElement, issues: GitHubIssueWithNewFlag[]) {
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  const avatarCache = (getLocalStore("avatarCache") as AvatarCache) || {};
  const fetchInProgress = new Set(); // Track in-progress fetches
  const existingIssueIds = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-issue-id")));

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  for (const issue of issues) {
    if (!existingIssueIds.has(issue.id.toString())) {
      const issueWrapper = everyNewIssue({ issue, avatarCache, fetchInProgress, container });
      setTimeout(() => issueWrapper.classList.add("active"), delay);
      delay += baseDelay;
    }
  }
  container.classList.add("ready");
}

function everyNewIssue({
  issue,
  avatarCache,
  fetchInProgress,
  container,
}: {
  issue: GitHubIssueWithNewFlag;
  avatarCache: AvatarCache;
  fetchInProgress: Set<unknown>;
  container: HTMLDivElement;
}) {
  const issueWrapper = document.createElement("div");
  const issueElement = document.createElement("div");
  issueElement.setAttribute("data-issue-id", issue.id.toString());
  issueElement.classList.add("issue-element-inner");

  if (issue.isNew) {
    issueWrapper.classList.add("new-issue");
  }

  const urlPattern = /https:\/\/github\.com\/([^/]+)\/([^/]+)\//;
  const match = issue.body.match(urlPattern);
  const organizationName = match?.[1];
  const repositoryName = match?.[2];
  const labels = parseAndGenerateLabels(issue);
  setUpIssueElement(issueElement, issue, organizationName, repositoryName, labels, match);
  issueWrapper.appendChild(issueElement);

  // Set the issueWrapper background-image to the organization's avatar
  if (organizationName) {
    organizationAvatar(avatarCache, organizationName, issueElement, fetchInProgress);
  }
  container.appendChild(issueWrapper);
  return issueWrapper;
}

function setUpIssueElement(
  issueElement: HTMLDivElement,
  issue: GitHubIssueWithNewFlag,
  organizationName: string | undefined,
  repositoryName: string | undefined,
  labels: string[],
  match: RegExpMatchArray | null
) {
  issueElement.innerHTML = `
      ${openNewLinkIcon}<div class="info"><div class="title"><h3>${
        issue.title
      }</h3></div><div class="partner"><p class="organization-name">${organizationName}</p><p class="repository-name">${repositoryName}</p></div></div><div class="labels">${labels.join(
        ""
      )}<img /></div>`;

  issueElement.addEventListener("click", function () {
    const previewId = Number(this.getAttribute("data-issue-id"));
    console.trace({ mapping, previewId });
    const full = mapping.get(previewId);
    if (!full) {
      window.open(match?.input, "_blank");
    } else {
      previewIssue(issue);
    }
  });
}

function parseAndGenerateLabels(issue: GitHubIssueWithNewFlag) {
  type LabelKey = "Pricing: " | "Time: " | "Priority: ";

  const labelOrder: Record<LabelKey, number> = { "Pricing: ": 1, "Time: ": 2, "Priority: ": 3 };

  issue.labels.sort((a, b) => {
    const matchA = a.name.match(/^(Pricing|Time|Priority): /)?.[0] as LabelKey | undefined;
    const matchB = b.name.match(/^(Pricing|Time|Priority): /)?.[0] as LabelKey | undefined;
    const orderA = matchA ? labelOrder[matchA] : 0;
    const orderB = matchB ? labelOrder[matchB] : 0;
    return orderA - orderB;
  });

  // Filter labels that begin with specific prefixes
  const filteredLabels = issue.labels.filter((label) => {
    return label.name.startsWith("Time: ") || label.name.startsWith("Pricing: ") || label.name.startsWith("Priority: ");
  });

  // Map the filtered labels to HTML elements
  const labels = filteredLabels.map((label) => {
    // Remove the prefix from the label name
    const name = label.name.replace(/(Time|Pricing|Priority): /, "");
    if (label.name.startsWith("Pricing: ")) {
      return `<label class="pricing">${name}</label>`;
    } else {
      return `<label class="label">${name}</label>`;
    }
  });
  return labels;
}

function organizationAvatar(avatarCache: AvatarCache, organizationName: string, issueElement: HTMLDivElement, fetchInProgress: Set<unknown>) {
  const cachedAvatar = avatarCache[organizationName];
  const image = issueElement.querySelector("img") as HTMLImageElement;
  if (cachedAvatar) {
    image.src = cachedAvatar;
  } else if (!fetchInProgress.has(organizationName)) {
    // Mark this organization's avatar as being fetched
    fetchInProgress.add(organizationName);

    // Update the avatarCache synchronously here
    avatarCache[organizationName] = null; // Placeholder value to indicate fetch in progress
    localStorage.setItem("avatarCache", JSON.stringify(avatarCache));

    fetch(`https://api.github.com/orgs/${organizationName}`)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.avatar_url) {
          avatarCache[organizationName] = data.avatar_url;
          localStorage.setItem("avatarCache", JSON.stringify(avatarCache));
          if (data.avatar_url) {
            updateImageSrc(image, data.avatar_url);
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching avatar:", error);
      })
      .finally(() => {
        // Fetch is complete, remove from the in-progress set
        fetchInProgress.delete(organizationName);
      });
  }
}

// Function to update and show the preview
function previewIssue(issuePreview: GitHubIssueWithNewFlag) {
  const issueFull = mapping.get(issuePreview.id);

  if (!issueFull) {
    throw new Error("Issue not found");
  }

  // Update the title and body for the new issue
  titleHeader.textContent = issuePreview.title;
  titleAnchor.href = issueFull.html_url;
  previewBodyInner.innerHTML = marked(issueFull.body) as string;

  // Show the preview
  preview.classList.add("active"); //  = 'block';
  issuesContainer?.classList.add("preview-active");
}

function updateImageSrc(imageElement: HTMLImageElement, src: string) {
  imageElement.src = src;
}
