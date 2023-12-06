import { previewToFullMapping } from "../fetch-github/fetch-issues-full";
import { displayIssue } from "./render-github-issues";

const keyDownHandlerCurried = keyDownHandler();
const disableKeyBoardNavigationCurried = disableKeyboardNavigation();

let isKeyDownListenerAdded = false;
let isMouseOverListenerAdded = false;

export function setupKeyboardNavigation(container: HTMLDivElement) {
  if (!isKeyDownListenerAdded) {
    document.addEventListener("keydown", keyDownHandlerCurried);
    isKeyDownListenerAdded = true;
  }
  if (!isMouseOverListenerAdded) {
    container.addEventListener("mouseover", disableKeyBoardNavigationCurried);
    isMouseOverListenerAdded = true;
  }
}

function disableKeyboardNavigation() {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  return function disableKeyboardNavigation() {
    container.classList.remove("keyboard-selection");
  };
}

function keyDownHandler() {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  return function keyDownHandler(event: KeyboardEvent) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const issues = Array.from(container.querySelectorAll("#issues-container > div"));
      const activeIndex = issues.findIndex((issue) => issue.classList.contains("selected"));
      const originalIndex = activeIndex === -1 ? -1 : activeIndex;
      let newIndex = originalIndex;

      if (event.key === "ArrowUp" && originalIndex > 0) {
        newIndex = originalIndex - 1;
        event.preventDefault();
      } else if (event.key === "ArrowDown" && originalIndex < issues.length - 1) {
        newIndex = originalIndex + 1;
        event.preventDefault();
      }

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
    } else if (event.key === "Enter") {
      const selectedIssue = container.querySelector("#issues-container > div.selected");
      if (selectedIssue) {
        const previewId = selectedIssue.children[0].getAttribute("data-preview-id");

        if (previewId) {
          const issueFull = previewToFullMapping.get(Number(previewId));
          if (issueFull) {
            window.open(issueFull.html_url, "_blank");
          }
        }
      }
    } else if (event.key === "Escape") {
      disableKeyboardNavigation();
    }
  };
}
