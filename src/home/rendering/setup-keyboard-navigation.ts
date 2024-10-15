import { taskManager } from "../home";
import { viewIssueDetails } from "./render-github-issues";

const keyDownHandlerCurried = keyDownHandler();
const disableKeyBoardNavigationCurried = disableKeyboardNavigationCurry;

let isKeyDownListenerAdded = false;
let isMouseOverListenerAdded = false;
let isScrubButtonsListenerAdded = false;

export function setupKeyboardNavigation(container: HTMLDivElement) {
  if (!isKeyDownListenerAdded) {
    document.addEventListener("keydown", keyDownHandlerCurried);
    isKeyDownListenerAdded = true;
  }
  if (!isMouseOverListenerAdded) {
    container.addEventListener("mouseover", disableKeyBoardNavigationCurried);
    isMouseOverListenerAdded = true;
  }
  if (!isScrubButtonsListenerAdded) {
    setupScrubButtons();
    isScrubButtonsListenerAdded = true;
  }
}

function setupScrubButtons() {
  const scrubLeft = document.getElementById("scrub-left");
  const scrubRight = document.getElementById("scrub-right");

  if (scrubLeft) {
    scrubLeft.addEventListener("click", () => handleScrub("ArrowUp"));
    scrubLeft.addEventListener("touchend", handleTouchEnd);
  }
  if (scrubRight) {
    scrubRight.addEventListener("click", () => handleScrub("ArrowDown"));
    scrubRight.addEventListener("touchend", handleTouchEnd);
  }

  // Prevent zooming on double tap
  document.addEventListener("touchmove", preventZoom, { passive: false });
}

function handleTouchEnd(event: TouchEvent) {
  event.preventDefault();
  const target = event.target as HTMLElement;
  if (target.id === "scrub-left") {
    handleScrub("ArrowUp");
  } else if (target.id === "scrub-right") {
    handleScrub("ArrowDown");
  }
}

function preventZoom(event: TouchEvent) {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}

function handleScrub(direction: "ArrowUp" | "ArrowDown") {
  const event = new KeyboardEvent("keydown", { key: direction });
  keyDownHandlerCurried(event);
}

function disableKeyboardNavigationCurry() {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  return disableKeyboardNavigation(container);
}

function disableKeyboardNavigation(container: HTMLDivElement) {
  container.classList.remove("keyboard-selection");
}

function keyDownHandler() {
  const container = document.getElementById("issues-container") as HTMLDivElement;
  return function keyDownHandler(event: KeyboardEvent) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const issues = Array.from(container.children) as HTMLElement[];
      const visibleIssues = issues.filter((issue) => issue.style.display !== "none");
      const activeIndex = visibleIssues.findIndex((issue) => issue.classList.contains("selected"));
      const originalIndex = activeIndex === -1 ? -1 : activeIndex;
      let newIndex = originalIndex;

      if (event.key === "ArrowUp" && originalIndex > 0) {
        newIndex = originalIndex - 1;
        event.preventDefault();
      } else if (event.key === "ArrowDown" && originalIndex < visibleIssues.length - 1) {
        newIndex = originalIndex + 1;
        event.preventDefault();
      }

      if (newIndex !== originalIndex) {
        visibleIssues.forEach((issue) => {
          issue.classList.remove("selected");
        });

        visibleIssues[newIndex]?.classList.add("selected");
        visibleIssues[newIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        container.classList.add("keyboard-selection");

        const issueId = visibleIssues[newIndex].children[0].getAttribute("data-issue-id");
        if (issueId) {
          const gitHubIssue = taskManager.getGitHubIssueById(parseInt(issueId, 10));
          if (gitHubIssue) {
            viewIssueDetails(gitHubIssue);
          }
        }
      }
    } else if (event.key === "Enter") {
      const selectedIssue = container.querySelector("#issues-container > div.selected");
      if (selectedIssue) {
        const gitHubIssueId = selectedIssue.children[0].getAttribute("data-issue-id");
        if (!gitHubIssueId) {
          return;
        }

        const gitHubIssue = taskManager.getGitHubIssueById(parseInt(gitHubIssueId, 10));
        if (gitHubIssue) {
          window.open(gitHubIssue.html_url, "_blank");
        }
      }
    } else if (event.key === "Escape") {
      disableKeyboardNavigation(container);
    }
  };
}
