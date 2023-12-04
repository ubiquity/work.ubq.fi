import { marked } from "marked";

import { GitHubIssueWithNewFlag } from "./fetch-github-issues";

// Create the preview elements outside of the previewIssue function
const preview = document.createElement("div");
preview.classList.add("preview");
const previewContent = document.createElement("div");
previewContent.classList.add("preview-content");
const previewHeader = document.createElement("div");
previewHeader.classList.add("preview-header");
const titleAnchor = document.createElement("a");
titleAnchor.setAttribute("target", "_blank");
titleAnchor.href = "#";
const titleHeader = document.createElement("h1");
const closeButton = document.createElement("button");
closeButton.classList.add("close-preview");
closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"/></svg>`;
const previewBody = document.createElement("div");
previewBody.classList.add("preview-body");
const previewBodyInner = document.createElement("div");
previewBodyInner.classList.add("preview-body-inner");

// Assemble the preview box
previewHeader.appendChild(closeButton);
titleAnchor.appendChild(titleHeader);
const openNewLinkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`;
const openNewLink = document.createElement("span");
openNewLink.classList.add("open-new-link");
openNewLink.innerHTML = openNewLinkIcon;
titleAnchor.appendChild(openNewLink);

previewHeader.appendChild(titleAnchor);
previewBody.appendChild(previewBodyInner);
previewContent.appendChild(previewHeader);
previewContent.appendChild(previewBody);
preview.appendChild(previewContent);
document.body.appendChild(preview);

// Initially hide the preview
// preview.classList.add("inactive"); //  = 'none';

const issuesContainer = document.getElementById("issues-container");

// Event listeners for closing the preview
preview.addEventListener("click", (event) => {
  if (event.target === preview) {
    preview.classList.remove("active"); //  = 'none';
    issuesContainer?.classList.remove("preview-active");
  }
});

closeButton.addEventListener("click", () => {
  preview.classList.remove("active"); //  = 'none';
  issuesContainer?.classList.remove("preview-active");
});

export async function renderGitHubIssues(container: HTMLDivElement, issues: GitHubIssueWithNewFlag[]) {
  const avatarCache: Record<string, string> = JSON.parse(localStorage.getItem("avatarCache") || "{}");
  const fetchInProgress = new Set(); // Track in-progress fetches
  const existingIssueIds = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-issue-id")));

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  for (const issue of issues) {
    if (!existingIssueIds.has(issue.id.toString())) {
      const issueWrapper = document.createElement("div");
      const issueElement = document.createElement("div");
      issueElement.setAttribute("data-issue-id", issue.id.toString());

      if (issue.isNew) {
        issueWrapper.classList.add("new-issue");
      }
      // issueWrapper.classList.add("issue-element-wrapper", "new-issue"); // Add "new-issue" class here
      issueElement.classList.add("issue-element-inner");
      setTimeout(() => issueWrapper.classList.add("active"), delay);

      delay += baseDelay;

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const mirrorUrls = issue.body.match(urlRegex);

      const urlPattern = /https:\/\/github\.com\/([^/]+)\/([^/]+)\//;
      const match = mirrorUrls?.shift()?.match(urlPattern);
      const organizationName = match?.[1];
      const repositoryName = match?.[2];

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

      issueElement.innerHTML = `
      <div class="info"><div class="title"><h3>${
        issue.title
      }</h3></div><div class="partner"><p class="organization-name">${organizationName}</p><p class="repository-name">${repositoryName}</p></div></div><div class="labels">${labels.join(
        ""
      )}<img /></div>`;

      issueElement.addEventListener("click", () => {
        console.log(issue);
        const isLocal = issuesSynced();
        if (isLocal) {
          previewIssue(issue);
        } else {
          window.open(match?.input, "_blank");
        }
      });

      issueWrapper.appendChild(issueElement);

      // Set the issueWrapper background-image to the organization's avatar
      if (organizationName) {
        const cachedAvatar = avatarCache[organizationName];
        const image = issueElement.querySelector("img") as HTMLImageElement;
        if (cachedAvatar) {
          image.src = cachedAvatar;
        } else if (!fetchInProgress.has(organizationName)) {
          // Mark this organization's avatar as being fetched
          fetchInProgress.add(organizationName);

          try {
            const response = await fetch(`https://api.github.com/orgs/${organizationName}`);
            const data = await response.json();
            if (data && data.avatar_url) {
              avatarCache[organizationName] = data.avatar_url;
              localStorage.setItem("avatarCache", JSON.stringify(avatarCache));
              image.src = data.avatar_url;
            }
          } catch (error) {
            console.error("Error fetching avatar:", error);
          } finally {
            // Fetch is complete, remove from the in-progress set
            fetchInProgress.delete(organizationName);
          }
        }
      }

      container.appendChild(issueWrapper);
    }
  }
  container.classList.add("ready");
}

function issuesSynced() {
  const gitHubIssuesFull = localStorage.getItem("githubIssuesFull");
  if (!gitHubIssuesFull) return false;
  const issuesFull = JSON.parse(gitHubIssuesFull);
  if (!issuesFull) return false;
  else return true;
}

// Function to update and show the preview
function previewIssue(issuePreview: GitHubIssueWithNewFlag) {
  const issuesFull = JSON.parse(localStorage.getItem("githubIssuesFull") || "[]");
  // console.trace({
  //   issuesFull,
  //   issue: issuePreview,
  // });
  const issuePreviewUrl = issuePreview.body.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+/)?.[0];
  if (!issuePreviewUrl) throw new Error("Issue preview URL not found");

  const issueFull = findIssueByUrl(issuesFull, issuePreviewUrl);
  if (!issueFull) throw new Error("Issue not found");

  // Update the title and body for the new issue
  titleHeader.textContent = issuePreview.title;
  titleAnchor.href = issuePreviewUrl;
  previewBodyInner.innerHTML = marked(issueFull.body) as string;

  // Show the preview
  preview.classList.add("active"); //  = 'block';
  issuesContainer?.classList.add("preview-active");
}

// Function to find an issue by URL
function findIssueByUrl(issues: GitHubIssueWithNewFlag[], url: string) {
  return issues.find((issue) => issue.html_url === url);
}
