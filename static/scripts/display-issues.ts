import { GitHubIssue } from "../github-types";

window.addEventListener("scroll", updateScale);
updateScale();

export function displayIssues(container: HTMLDivElement, issues: GitHubIssue[]) {
  const existingIssueIds = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-issue-id")));

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  issues.forEach((issue) => {
    if (!existingIssueIds.has(issue.id.toString())) {
      const issueWrapper = document.createElement("div");
      const issueElement = document.createElement("div");
      issueElement.setAttribute("data-issue-id", issue.id.toString());
      issueWrapper.classList.add("issue-element-wrapper");
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
          return `<div class="label pricing">${name}</div>`;
        } else {
          return `<div class="label">${name}</div>`;
        }
      });

      issueElement.innerHTML = `
      <div class="info"><div class="labels">${labels.join(
        ""
      )}</div><div class="partner"><p class="organization-name">${organizationName}</p><p class="repository-name">${repositoryName}</p></div></div>
      <div class="title"><h3>${issue.title}</h3></div>
      `;

      issueElement.addEventListener("click", () => {
        console.log(issue);
        window.open(match?.input, "_blank");
      });

      issueWrapper.appendChild(issueElement);

      // Set the issueWrapper background-image to the organization's avatar
      if (organizationName) {
        fetch(`https://api.github.com/orgs/${organizationName}`)
          .then((response) => response.json())
          .then((data) => {
            if (data && data.avatar_url) {
              issueWrapper.style.backgroundImage = `url("${data.avatar_url}")`;
            }
          })
          .catch((error) => {
            console.error(error);
          });
      }

      container.appendChild(issueWrapper);
    }
  });
}
function updateScale() {
  const viewportHeight = window.innerHeight;
  const elements = Array.from(document.querySelectorAll(".issue-element-wrapper"));

  elements.forEach((element) => {
    const bounds = element.getBoundingClientRect();
    const elementBottom = bounds.bottom; // Get the bottom position of the element

    let scale;

    const OFFSET = (viewportHeight - 32) / viewportHeight;

    if (elementBottom <= viewportHeight * OFFSET) {
      // If the bottom of the element is above the bottom of the viewport, it's at full scale
      scale = 1;
    } else {
      // Calculate the distance from the bottom of the viewport
      const distanceFromBottom = elementBottom - viewportHeight;
      // Normalize the distance based on the height of the viewport
      const distanceRatio = distanceFromBottom / viewportHeight;

      // The scale decreases linearly from the bottom of the viewport to the bottom edge of the element
      scale = OFFSET - distanceRatio;
      // Ensure the scale does not go below 0.5
      scale = Math.max(scale, 0.5);
    }

    //   element.style.transform = `scale(${scale}) translateX(${- scale}vw)`;
    // element.style.filter = `blur(${blurValue}px)`;

    // Add "active" class to elements that are fully scaled
    if (scale === 1) {
      element.classList.add("active");
    } else {
      element.classList.remove("active");
    }
  });
}
