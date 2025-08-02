export const modal = document.getElementById("preview-modal") as HTMLDivElement;
export const titleAnchor = document.getElementById("preview-title-anchor") as HTMLAnchorElement;
export const titleHeader = document.getElementById("preview-title") as HTMLHeadingElement;
export const modalBodyInner = document.getElementById("preview-body-inner") as HTMLDivElement;
export const bottomBar = document.getElementById("bottom-bar") as HTMLDivElement;
export const issuesContainer = document.getElementById("issues-container");

const orgContainer = document.getElementById("org-chip") as HTMLAnchorElement | null;
const orgAvatar = document.getElementById("org-avatar") as HTMLImageElement | null;
const orgName = document.getElementById("org-name") as HTMLSpanElement | null;

(window as unknown as { setPreviewOrg?: (params: { login: string; name?: string; avatarUrl?: string; url?: string }) => void }).setPreviewOrg = ({
  login,
  name,
  avatarUrl,
  url,
}) => {
  if (orgName) orgName.textContent = name || login || "";
  if (orgAvatar) {
    orgAvatar.src = avatarUrl || "";
    orgAvatar.alt = `${name || login || ""} avatar`;
  }
  if (orgContainer) {
    if (url) {
      orgContainer.href = url;
      orgContainer.setAttribute("target", "_blank");
      orgContainer.setAttribute("rel", "noopener noreferrer");
    } else {
      orgContainer.removeAttribute("href");
    }
  }
};

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
