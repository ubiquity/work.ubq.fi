import { marked } from "marked";
import { organizationImageCache } from "../fetch-github/fetch-issues-full";
import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { renderErrorInModal } from "./display-popup-modal";
import { closeModal, modal, modalBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
import { setupKeyboardNavigation } from "./setup-keyboard-navigation";
import { isProposalOnlyViewer } from "../fetch-github/fetch-and-display-previews";

export function renderGitHubIssues(tasks: GitHubIssue[]) {
  const container = taskManager.getContainer();
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  const existingIssueIds = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-issue-id")));

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  for (const task of tasks) {
    if (!existingIssueIds.has(task.id.toString())) {
      const issueWrapper = everyNewIssue({ gitHubIssue: task, container });
      if (issueWrapper) {
        setTimeout(() => issueWrapper.classList.add("active"), delay);
        delay += baseDelay;
      }
    }
  }
  container.classList.add("ready");
  // Call this function after the issues have been rendered
  setupKeyboardNavigation(container);

  // Scroll to the top of the page
  window.scrollTo({ top: 0 });
}

function everyNewIssue({ gitHubIssue, container }: { gitHubIssue: GitHubIssue; container: HTMLDivElement }) {
  const issueWrapper = document.createElement("div");
  const issueElement = document.createElement("div");
  issueElement.setAttribute("data-issue-id", gitHubIssue.id.toString());
  issueElement.classList.add("issue-element-inner");

  const labels = parseAndGenerateLabels(gitHubIssue);
  const [organizationName, repositoryName] = gitHubIssue.repository_url.split("/").slice(-2);
  setUpIssueElement(issueElement, gitHubIssue, organizationName, repositoryName, labels, gitHubIssue.html_url);
  issueWrapper.appendChild(issueElement);

  container.appendChild(issueWrapper);
  return issueWrapper;
}

function setUpIssueElement(issueElement: HTMLDivElement, task: GitHubIssue, organizationName: string, repositoryName: string, labels: string[], url: string) {
  const image = `<img />`;

  issueElement.innerHTML = `
      <div class="info"><div class="title"><h3>${
        task.title
      }</h3></div><div class="partner"><p class="organization-name">${organizationName}</p><p class="repository-name">${repositoryName}</p></div></div><div class="labels">${labels.join(
        ""
      )}${image}</div>`;

  issueElement.addEventListener("click", () => {
    try {
      const issueWrapper = issueElement.parentElement;

      if (!issueWrapper) {
        throw new Error("No issue container found");
      }

      Array.from(issueWrapper.parentElement?.children || []).forEach((sibling) => {
        sibling.classList.remove("selected");
      });

      issueWrapper.classList.add("selected");

      const full = task;
      if (!full) {
        window.open(url, "_blank");
      } else {
        previewIssue(task);
      }
    } catch (error) {
      return renderErrorInModal(error as Error);
    }
  });
}

function parseAndGenerateLabels(task: GitHubIssue) {
  type LabelKey = "Price: " | "Time: " | "Priority: ";

  const labelOrder: Record<LabelKey, number> = { "Price: ": 1, "Time: ": 2, "Priority: ": 3 };

  const { labels, otherLabels } = task.labels.reduce(
    (acc, label) => {
      // check if label is a single string
      if (typeof label === "string") {
        return {
          labels: [],
          otherLabels: [],
        };
      }

      // check if label.name exists
      if (!label.name) {
        return {
          labels: [],
          otherLabels: [],
        };
      }

      const match = label.name.match(/^(Price|Time|Priority): /);
      if (match) {
        const name = label.name.replace(match[0], "");
        const labelStr = `<label class="${match[1].toLowerCase().trim()}">${name}</label>`;
        acc.labels.push({ order: labelOrder[match[0] as LabelKey], label: labelStr });
      } else if (!label.name.startsWith("Partner: ") && !label.name.startsWith("id: ") && !label.name.startsWith("Unavailable")) {
        acc.otherLabels.push(label.name);
      }
      return acc;
    },
    { labels: [] as { order: number; label: string }[], otherLabels: [] as string[] }
  );

  // Sort labels
  labels.sort((a: { order: number }, b: { order: number }) => a.order - b.order);

  // Log the other labels
  if (otherLabels.length) {
    const otherLabelName = otherLabels.shift() as string;
    labels.unshift({ order: 0, label: `<label class="label full">${otherLabelName}</label>` });
  }

  return labels.map((label) => label.label);
}

// Function to update and show the preview
function previewIssue(gitHubIssue: GitHubIssue) {
  viewIssueDetails(gitHubIssue);
}

export function viewIssueDetails(full: GitHubIssue) {
  // Update the title and body for the new issue
  titleHeader.textContent = full.title;
  titleAnchor.href = full.html_url;
  if (!full.body) return;
  modalBodyInner.innerHTML = marked(full.body) as string;

  // Show the preview
  modal.classList.add("active");
  modal.classList.remove("error");
  document.body.classList.add("preview-active");

  updateUrlWithIssueId(full.id);
}

// Adds issue ID to url in format (i.e http://localhost:8080/?issue=2559612103)
function updateUrlWithIssueId(issueID: number) {
  const newURL = new URL(window.location.href);
  newURL.searchParams.set("issue", String(issueID));

  if (isProposalOnlyViewer) {
    newURL.searchParams.set("proposal", "true");
  }

  // Push to history
  window.history.pushState({ issueID }, "", newURL.toString());
}

// Opens the preview modal if a URL contains an issueID
export function loadIssueFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const issueID = urlParams.get("issue");

  // If no issue ID in the URL, don't load issue
  if (!issueID) {
    closeModal();
    return;
  }

  // If ID doesn't exist, don't load issue
  const issue: GitHubIssue = taskManager.getGitHubIssueById(Number(issueID)) as GitHubIssue;
  console.log(issue);
  console.log(issueID);
  if (!issue) {
    console.log("deleting");
    const newURL = new URL(window.location.href);
    newURL.searchParams.delete("issue");
    newURL.searchParams.delete("proposal");
    window.history.pushState({}, "", newURL.toString());
    return;
  }

  viewIssueDetails(issue);
}

// This ensure previews load for the URL
window.addEventListener("popstate", () => {
  location.reload();
});

export function applyAvatarsToIssues() {
  const container = taskManager.getContainer();
  const issueElements = Array.from(container.querySelectorAll(".issue-element-inner"));

  issueElements.forEach((issueElement) => {
    const orgName = issueElement.querySelector(".organization-name")?.textContent;
    if (orgName) {
      const avatarUrl = organizationImageCache.get(orgName);
      if (avatarUrl) {
        const avatarImg = issueElement.querySelector("img");
        if (avatarImg) {
          avatarImg.src = URL.createObjectURL(avatarUrl);
        }
      }
    }
  });
}
