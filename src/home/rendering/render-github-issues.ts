import { marked } from "marked";
import { organizationImageCache } from "../fetch-github/fetch-issues-full";
import { TaskMaybeFull } from "../fetch-github/preview-to-full-mapping";
import { GitHubIssue } from "../github-types";
import { taskManager } from "../home";
import { renderErrorInModal } from "./display-popup-modal";
import { preview, previewBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
import { setupKeyboardNavigation } from "./setup-keyboard-navigation";

export function renderGitHubIssues(tasks: TaskMaybeFull[]) {
  const container = taskManager.getContainer();
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  const existingIssueIds = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-preview-id")));

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  for (const task of tasks) {
    if (!existingIssueIds.has(task.preview.id.toString())) {
      const issueWrapper = everyNewIssue({ taskPreview: task, container });
      if (issueWrapper) {
        setTimeout(() => issueWrapper.classList.add("active"), delay);
        delay += baseDelay;
      }
    }
  }
  container.classList.add("ready");
  // Call this function after the issues have been rendered
  setupKeyboardNavigation(container);
}

function everyNewIssue({ taskPreview, container }: { taskPreview: TaskMaybeFull; container: HTMLDivElement }) {
  const issueWrapper = document.createElement("div");
  const issueElement = document.createElement("div");
  issueElement.setAttribute("data-preview-id", taskPreview.preview.id.toString());
  issueElement.classList.add("issue-element-inner");

  const urlPattern = /https:\/\/(www\.)?github\.com\/([^/]+)\/([^/]+)\//;
  if (!taskPreview.preview.body) {
    console.warn(`No body found for issue ${taskPreview.preview.id}.`);
    return;
  }
  const match = taskPreview.preview.body.match(urlPattern);
  const organizationName = match?.[2];
  const repositoryName = match?.[3];

  if (!organizationName) {
    console.warn(`No organization name found for issue ${taskPreview.preview.id}.`);
    return;
  }

  if (!repositoryName) {
    console.warn("No repository name found");
    return;
  }
  const labels = parseAndGenerateLabels(taskPreview);
  setUpIssueElement(issueElement, taskPreview, organizationName, repositoryName, labels, match);
  issueWrapper.appendChild(issueElement);

  container.appendChild(issueWrapper);
  return issueWrapper;
}

function setUpIssueElement(
  issueElement: HTMLDivElement,
  task: TaskMaybeFull,
  organizationName: string,
  repositoryName: string,
  labels: string[],
  match: RegExpMatchArray | null
) {
  const image = `<img />`;

  issueElement.innerHTML = `
      <div class="info"><div class="title"><h3>${
        task.preview.title
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

      const full = task.full;
      if (!full) {
        window.open(match?.input, "_blank");
      } else {
        previewIssue(task);
      }
    } catch (error) {
      return renderErrorInModal(error as Error);
    }
  });
}

function parseAndGenerateLabels(task: TaskMaybeFull) {
  type LabelKey = "Pricing: " | "Time: " | "Priority: ";

  const labelOrder: Record<LabelKey, number> = { "Pricing: ": 1, "Time: ": 2, "Priority: ": 3 };

  const { labels, otherLabels } = task.preview.labels.reduce(
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

      const match = label.name.match(/^(Pricing|Time|Priority): /);
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
  labels.sort((a, b) => a.order - b.order);

  // Log the other labels
  if (otherLabels.length) {
    const otherLabelName = otherLabels.shift() as string;
    labels.unshift({ order: 0, label: `<label class="label full">${otherLabelName}</label>` });
  }

  return labels.map((label) => label.label);
}

// Function to update and show the preview
function previewIssue(taskPreview: TaskMaybeFull) {
  const task = taskManager.getTaskByPreviewId(taskPreview.preview.id);

  if (!task) {
    throw new Error("Issue not found");
  }

  if (!task.full) {
    throw new Error("No full issue found");
  }

  viewIssueDetails(task.full);
}

export function viewIssueDetails(full: GitHubIssue) {
  // Update the title and body for the new issue
  titleHeader.textContent = full.title;
  titleAnchor.href = full.html_url;
  if (!full.body) return;
  previewBodyInner.innerHTML = marked(full.body) as string;

  // Show the preview
  preview.classList.add("active");
  preview.classList.remove("error");
  document.body.classList.add("preview-active");
}

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
