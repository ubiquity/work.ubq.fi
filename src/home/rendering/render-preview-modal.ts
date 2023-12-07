import { marked } from "marked";
import { previewToFullMapping } from "../fetch-github/fetch-issues-full";
import { GitHubIssue } from "../github-types";

export const previewWrapper = document.createElement("div");
previewWrapper.classList.add("preview");
const previewContent = document.createElement("div");
previewContent.classList.add("preview-content");

const previewHeader = document.createElement("div");
previewHeader.classList.add("preview-header");
export const titleAnchor = document.createElement("a");
titleAnchor.setAttribute("target", "_blank");
titleAnchor.href = "#";
export const titleHeader = document.createElement("h1");
const closeButton = document.createElement("button");
closeButton.classList.add("close-preview");
closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"/></svg>`;
const previewBody = document.createElement("div");
previewBody.classList.add("preview-body");
export const previewBodyInner = document.createElement("div");
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

// Create three preview elements
// for (let i = 0; i < 3; i++) {
const previewClonePrevious = previewContent.cloneNode(true) as HTMLDivElement;
previewClonePrevious.classList.add("previous");
// const previewCloneCurrent = previewContent.cloneNode(true) as HTMLDivElement;
const previewCloneNext = previewContent.cloneNode(true) as HTMLDivElement;
previewCloneNext.classList.add("next");
previewContent.classList.add("current");
// preview.appendChild(previewClonePrevious);
// }

previewWrapper.appendChild(previewClonePrevious);
previewWrapper.appendChild(previewContent);
previewWrapper.appendChild(previewCloneNext);

document.body.appendChild(previewWrapper);
export const issuesContainer = document.getElementById("issues-container");

closeButton.addEventListener("click", closePreview);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePreview();
  }
});

function closePreview() {
  previewWrapper.classList.remove("active");
  document.body.classList.remove("preview-active");
}

// SWIPER

let startTouchX: number;

previewContent.addEventListener("touchstart", (e) => {
  startTouchX = e.touches[0].clientX;
});

previewContent.addEventListener("touchmove", (e) => {
  // Prevent scrolling the background
  e.preventDefault();

  const touchX = e.touches[0].clientX;
  const deltaX = touchX - startTouchX;
  // Apply the movement to the modal's transform property
  previewContent.style.transform = `translateX(${deltaX}px)`;
  previewClonePrevious.style.transform = `translateX(${deltaX}px)`;
  previewCloneNext.style.transform = `translateX(${deltaX}px)`;
});

previewContent.addEventListener("touchend", (e) => {
  const endTouchX = e.changedTouches[0].clientX;
  const threshold = 50; // Minimum distance of swipe to be recognized

  if (Math.abs(startTouchX - endTouchX) > threshold) {
    // Determine swipe direction
    if (startTouchX > endTouchX) {
      loadModalData("left");
    } else {
      loadModalData("right");
    }
  }

  // Reset the transform property to animate back to the center
  previewContent.style.transform = "";
  previewClonePrevious.style.transform = "";
  previewCloneNext.style.transform = "";
});

function loadModalData(direction: "left" | "right") {
  const container = document.getElementById("issues-container") as HTMLDivElement;

  const issues = Array.from(container.children);
  const activeIndex = issues.findIndex((issue) => issue.classList.contains("selected"));
  const originalIndex = activeIndex === -1 ? -1 : activeIndex;

  let newIndex = originalIndex;

  direction === "left" ? (newIndex = originalIndex + 1) : (newIndex = originalIndex - 1);

  if (newIndex == originalIndex) return;

  issues.forEach((issue) => issue.classList.remove("selected"));
  issues[newIndex]?.classList.add("selected");
  issues[newIndex].scrollIntoView({ behavior: "smooth", block: "center" });

  // const previewId = issues[newIndex].children[0].getAttribute("data-preview-id");
  // const issueElement = issues.find((issue) => issue.children[0].getAttribute("data-preview-id") === previewId);

  const indices = {
    previous: {
      preview: issues[newIndex - 1].children[0].getAttribute("data-preview-id"),
      element: null,
    },
    current: {
      preview: issues[newIndex].children[0].getAttribute("data-preview-id"),
      element: null,
    },
    next: {
      preview: issues[newIndex + 1].children[0].getAttribute("data-preview-id"),
      element: null,
    },
  } as {
    previous: {
      preview: string | null;
      element: HTMLDivElement | null;
    };
    current: {
      preview: string | null;
      element: HTMLDivElement | null;
    };
    next: {
      preview: string | null;
      element: HTMLDivElement | null;
    };
  };

  indices.previous.element = issues.find((issue) => issue.children[0].getAttribute("data-preview-id") === indices.previous.preview) as HTMLDivElement;
  indices.current.element = issues.find((issue) => issue.children[0].getAttribute("data-preview-id") === indices.current.preview) as HTMLDivElement;
  indices.next.element = issues.find((issue) => issue.children[0].getAttribute("data-preview-id") === indices.next.preview) as HTMLDivElement;

  if (indices.current.element) {
    const issueCurrent = previewToFullMapping.get(Number(indices.current.preview));
    if (issueCurrent) {
      const issuePrevious = previewToFullMapping.get(Number(indices.previous.preview));
      const issueNext = previewToFullMapping.get(Number(indices.next.preview));
      displayIssueSides(issuePrevious, issueCurrent, issueNext);
    }
  }
}

export function displayIssueSides(issueLeft?: GitHubIssue, issueCurrent?: GitHubIssue, issueRight?: GitHubIssue) {
  if (issueLeft) setUpEach(previewClonePrevious, issueLeft);
  if (issueCurrent) setUpEach(previewContent, issueCurrent);
  if (issueRight) setUpEach(previewCloneNext, issueRight);
}

function setUpEach(target: HTMLDivElement, issue: GitHubIssue) {
  const titleAnchor = target.querySelector("a");
  const titleHeader = target.querySelector("h1");
  const previewBodyInner = target.querySelector(".preview-body-inner");
  if (!titleAnchor) throw new Error("no titleAnchor found");
  if (!titleHeader) throw new Error("no titleHeader found");
  if (!previewBodyInner) throw new Error("no previewBodyInner found");
  titleHeader.textContent = issue.title;
  titleAnchor.href = issue.html_url;
  previewBodyInner.innerHTML = marked(issue.body) as string;
}
