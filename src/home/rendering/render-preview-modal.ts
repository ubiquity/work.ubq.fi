export const modal = document.getElementById("preview-modal") as HTMLDivElement;
export const titleAnchor = document.getElementById("preview-title-anchor") as HTMLAnchorElement;
export const titleHeader = document.getElementById("preview-title") as HTMLHeadingElement;
export const modalBodyInner = document.getElementById("preview-body-inner") as HTMLDivElement;
export const bottomBar = document.getElementById("bottom-bar") as HTMLDivElement;
export const issuesContainer = document.getElementById("issues-container");

const closeButton = modal.querySelector(".close-preview") as HTMLButtonElement;

closeButton.addEventListener("click", closeModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

export function closeModal() {
  modal.classList.remove("active");
  document.body.classList.remove("preview-active");
  issuesContainer?.classList.remove("keyboard-selection");
  bottomBarClearLabels();

  const newURL = new URL(window.location.href);
  newURL.searchParams.delete("issue");
  window.history.replaceState({}, "", newURL.toString());
}

export function bottomBarClearLabels() {
  const existingClonedLabels = bottomBar.querySelector(".labels.cloned-labels");
  if (existingClonedLabels) {
    bottomBar.removeChild(existingClonedLabels);
  }
}
