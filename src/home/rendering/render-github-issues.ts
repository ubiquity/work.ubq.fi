import { marked } from "marked";
import { organizationImageCache, previewToFullMapping } from "../fetch-github/fetch-issues-full";
import { GitHubIssueWithNewFlag } from "../fetch-github/preview-to-full-mapping";
import { GitHubIssue } from "../github-types";
import { preview, previewBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
import { setupKeyboardNavigation } from "./setup-keyboard-navigation";

export function renderGitHubIssues(container: HTMLDivElement, issues: GitHubIssueWithNewFlag[]) {
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  const existingIssueIds = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-preview-id")));

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  for (const issue of issues) {
    if (!existingIssueIds.has(issue.id.toString())) {
      const issueWrapper = everyNewIssue({ issue, container });
      setTimeout(() => issueWrapper.classList.add("active"), delay);
      delay += baseDelay;
    }
  }
  container.classList.add("ready");
  // Call this function after the issues have been rendered
  setupKeyboardNavigation(container);
}

function everyNewIssue({ issue, container }: { issue: GitHubIssueWithNewFlag; container: HTMLDivElement }) {
  const issueWrapper = document.createElement("div");
  const issueElement = document.createElement("div");
  issueElement.setAttribute("data-preview-id", issue.id.toString());
  issueElement.classList.add("issue-element-inner");

  if (issue.isNew) {
    issueWrapper.classList.add("new-issue");
  }

  const urlPattern = /https:\/\/github\.com\/([^/]+)\/([^/]+)\//;
  const match = issue.body.match(urlPattern);
  const organizationName = match?.[1];
  if (!organizationName) {
    const storedIssuesJSON = localStorage.getItem("gitHubIssuesPreview");
    const storedIssues = storedIssuesJSON ? (JSON.parse(storedIssuesJSON) as GitHubIssueWithNewFlag[]) : [];
    const updatedIssues = storedIssues.filter((storedIssue) => storedIssue.id !== issue.id);
    localStorage.setItem("gitHubIssuesPreview", JSON.stringify(updatedIssues));
    throw new Error(`No organization name found for issue ${issue.id}. Assuming its a pull request so removed from cache.`);
  }
  const repositoryName = match?.[2];
  if (!repositoryName) {
    throw new Error("No repository name found");
  }
  const labels = parseAndGenerateLabels(issue);
  setUpIssueElement(issueElement, issue, organizationName, repositoryName, labels, match);
  issueWrapper.appendChild(issueElement);

  container.appendChild(issueWrapper);
  return issueWrapper;
}

function setUpIssueElement(
  issueElement: HTMLDivElement,
  issuePreview: GitHubIssueWithNewFlag,
  organizationName: string,
  repositoryName: string,
  labels: string[],
  match: RegExpMatchArray | null
) {
  let image = `<img />`;

  const avatarUrl = organizationImageCache.get(organizationName);
  if (avatarUrl) {
    image = `<img src="${avatarUrl}" />`;
  }

  const avatarBlob = organizationImageCache.get(organizationName);
  if (avatarBlob) {
    const avatarUrl = URL.createObjectURL(avatarBlob);
    image = `<img src="${avatarUrl}" />`;
  }

  issueElement.innerHTML = `
      <div class="info"><div class="title"><h3>${
        issuePreview.title
      }</h3></div><div class="partner"><p class="organization-name">${organizationName}</p><p class="repository-name">${repositoryName}</p></div></div><div class="labels">${labels.join(
        ""
      )}${image}</div>`;

  issueElement.addEventListener("click", function () {
    const issueWrapper = issueElement.parentElement;

    if (!issueWrapper) {
      throw new Error("No issue container found");
    }

    Array.from(issueWrapper.parentElement?.children || []).forEach((sibling) => {
      sibling.classList.remove("selected");
    });

    issueWrapper.classList.add("selected");

    const previewId = Number(this.getAttribute("data-preview-id"));
    const full = previewToFullMapping.get(previewId);
    console.trace({ full, preview: issuePreview });
    if (!full) {
      window.open(match?.input, "_blank");
    } else {
      previewIssue(issuePreview);
    }
  });
}

function parseAndGenerateLabels(issue: GitHubIssueWithNewFlag) {
  type LabelKey = "Pricing: " | "Time: " | "Priority: ";

  const labelOrder: Record<LabelKey, number> = { "Pricing: ": 1, "Time: ": 2, "Priority: ": 3 };

  const { labels, otherLabels } = issue.labels.reduce(
    (acc, label) => {
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
function previewIssue(issuePreview: GitHubIssueWithNewFlag) {
  const issueFull = previewToFullMapping.get(issuePreview.id);

  if (!issueFull) {
    throw new Error("Issue not found");
  }

  displayIssue(issueFull);
}

export function displayIssue(issueFull: GitHubIssue) {
  // Update the title and body for the new issue
  titleHeader.textContent = issueFull.title;
  titleAnchor.href = issueFull.html_url;
  previewBodyInner.innerHTML = marked(issueFull.body) as string;

  // Show the preview
  preview.classList.add("active"); //  = 'block';
  document.body.classList.add("preview-active");
}
