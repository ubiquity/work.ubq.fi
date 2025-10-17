import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { fetchAvatar, ubiquityAvatarUrl } from "../fetch-github/fetch-avatar";
import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { renderErrorInModal } from "./display-popup-modal";
import { getLabelText } from "../sorting/label-utils";
import { renderPreviewIssueNav } from "./render-org-header";
import { bottomBar, bottomBarClearLabels, closeModal, modal, modalBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
import { setupKeyboardNavigation } from "./setup-keyboard-navigation";
import { waitForElement } from "./utils";

const LABEL_PREFIX_REGEX = /^(Price: |Time: |Priority: )/;

export function renderGitHubIssues(tasks: GitHubIssue[], skipAnimation: boolean) {
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
        if (skipAnimation) {
          issueWrapper.classList.add("active");
        } else {
          setTimeout(() => issueWrapper.classList.add("active"), delay);
          delay += baseDelay;
        }
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
      if (!full || !full.body) {
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

  const labelOrder: Record<LabelKey, number> = { "Price: ": 1, "Time: ": 2, "Priority: ": 3 } as const;

  const acc = { labels: [] as { order: number; label: string }[], otherLabels: [] as string[] };

  for (const label of task.labels || []) {
    const name = getLabelText(label);
    if (!name) continue;

    const match = name.match(LABEL_PREFIX_REGEX);
    if (match) {
      const key = match[0] as LabelKey;
      const value = name.replace(match[0], "");
      const cssClass = key.toLowerCase().replace(": ", "").trim();
      const labelStr = `<label class="${cssClass}">${value}</label>`;
      const order = labelOrder[key];
      acc.labels.push({ order, label: labelStr });
    } else if (!name.startsWith("Partner: ") && !name.startsWith("id: ") && !name.startsWith("Unavailable")) {
      acc.otherLabels.push(name);
    }
  }

  // Sort and merge labels
  acc.labels.sort((a, b) => a.order - b.order);

  if (acc.otherLabels.length) {
    const otherLabelName = acc.otherLabels.shift() as string;
    acc.labels.unshift({ order: 0, label: `<label class="label full">${otherLabelName}</label>` });
  }

  return acc.labels.map((l) => l.label);
}

// Function to update and show the preview
function previewIssue(gitHubIssue: GitHubIssue) {
  void viewIssueDetails(gitHubIssue);
}

// Loads the issue preview modal with the issue details
export async function viewIssueDetails(full: GitHubIssue) {
  // Update the title and body for the new issue
  titleHeader.textContent = full.title;
  titleAnchor.href = full.html_url;
  if (!full.body) return;

  // Remove any existing cloned labels from the bottom bar
  bottomBarClearLabels();

  // Wait for the issue element to exist, useful when loading issue from URL
  const issueElement = await waitForElement(`div[data-issue-id="${full.id}"]`);

  const [ownerLogin] = full.repository_url.split("/").slice(-2);

  if (ownerLogin) {
    renderPreviewIssueNav(ownerLogin);
  }

  const labelsDiv = issueElement.querySelector(".labels");
  if (labelsDiv) {
    // Clone the labels div and remove the img child if it exists
    const clonedLabels = labelsDiv.cloneNode(true) as HTMLElement;
    const imgElement = clonedLabels.querySelector("img");
    if (imgElement) clonedLabels.removeChild(imgElement);

    // Add an extra class and set padding
    clonedLabels.classList.add("cloned-labels");

    // Prepend the cloned labels to the modal body
    bottomBar.prepend(clonedLabels);
  }

  // Use footnote extension for `marked`
  marked.use(markedFootnote());

  // Set the issue body content using `marked`
  modalBodyInner.innerHTML = marked(full.body) as string;

  // Show the preview
  modal.classList.add("active");
  modal.classList.remove("error");
  document.body.classList.add("preview-active");

  updateUrlWithIssueId(full.id);
}

// Listen for changes in view toggle and update the URL accordingly
export const proposalViewToggle = document.getElementById("view-toggle") as HTMLInputElement;
proposalViewToggle.addEventListener("change", () => {
  const newURL = new URL(window.location.href);
  if (proposalViewToggle.checked) {
    newURL.searchParams.set("proposal", "true");
  } else {
    newURL.searchParams.delete("proposal");
  }
  window.history.replaceState({}, "", newURL.toString());
});

// Adds issue ID to url in format (i.e http://localhost:8080/?issue=2559612103)
function updateUrlWithIssueId(issueID: number) {
  const newURL = new URL(window.location.href);
  newURL.searchParams.set("issue", String(issueID));

  // Set issue in URL
  window.history.replaceState({ issueID }, "", newURL.toString());
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

  if (!issue) {
    const newURL = new URL(window.location.href);
    newURL.searchParams.delete("issue");
    window.history.pushState({}, "", newURL.toString());
    return;
  }

  void viewIssueDetails(issue);
}

export function applyAvatarsToIssues() {
  const container = taskManager.getContainer();
  const issueElements = Array.from(container.querySelectorAll(".issue-element-inner"));

  issueElements.forEach((issueElement) => {
    const orgName = issueElement.querySelector(".organization-name")?.textContent;
    if (orgName) {
      const avatarUrl = fetchAvatar(orgName) ?? ubiquityAvatarUrl;
      if (avatarUrl) {
        const avatarImg = issueElement.querySelector("img");
        if (avatarImg) {
          avatarImg.src = avatarUrl;
        }
      }
    }
  });
}
