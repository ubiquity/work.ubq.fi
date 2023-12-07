import { previewToFullMapping } from "../fetch-github/fetch-issues-full";
import { displayIssue } from "./render-github-issues";

export const preview = document.createElement("div");
preview.classList.add("preview");
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
preview.appendChild(previewContent);
document.body.appendChild(preview);
export const issuesContainer = document.getElementById("issues-container");

closeButton.addEventListener("click", closePreview);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePreview();
  }
});

function closePreview() {
  preview.classList.remove("active");
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
});

previewContent.addEventListener("touchend", (e) => {
  const endTouchX = e.changedTouches[0].clientX;
  const threshold = 50; // Minimum distance of swipe to be recognized

  if (Math.abs(startTouchX - endTouchX) > threshold) {
    // Determine swipe direction
    if (startTouchX > endTouchX) {
      loadModalData({ direction: "left" });
    } else {
      loadModalData({ direction: "right" });
    }
  }

  // Reset the transform property to animate back to the center
  previewContent.style.transform = "";
});

function loadModalData({ direction }: { direction: "left" | "right" }) {
  const container = document.getElementById("issues-container") as HTMLDivElement;

  const issues = Array.from(container.children);
  const activeIndex = issues.findIndex((issue) => issue.classList.contains("selected"));
  const originalIndex = activeIndex === -1 ? -1 : activeIndex;

  let newIndex = originalIndex;

  direction === "left" ? (newIndex = originalIndex + 1) : (newIndex = originalIndex - 1);

  if (newIndex !== originalIndex) {
    // issues[originalIndex]?.classList.remove("selected");

    issues.forEach((issue) => {
      issue.classList.remove("selected");
    });

    issues[newIndex]?.classList.add("selected");
    issues[newIndex].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    container.classList.add("keyboard-selection");

    const previewId = issues[newIndex].children[0].getAttribute("data-preview-id");

    const issueElement = issues.find((issue) => issue.children[0].getAttribute("data-preview-id") === previewId);

    if (issueElement) {
      const issueFull = previewToFullMapping.get(Number(previewId));
      console.trace({ mapping: previewToFullMapping, previewId, issueFull });
      if (issueFull) {
        displayIssue(issueFull);
      }
    }
  }
}
