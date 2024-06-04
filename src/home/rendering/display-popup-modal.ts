import { toolbar } from "../ready-toolbar";
import { gitHubLoginButton } from "./render-github-login-button";
import { preview, previewBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
export function displayPopupMessage(modalHeader: string, modalBody: string, isError: boolean, url?: string) {
  titleHeader.textContent = modalHeader;
  if (url) {
    titleAnchor.href = url;
  }
  previewBodyInner.innerHTML = modalBody;

  preview.classList.add("active");
  document.body.classList.add("preview-active");

  if (toolbar) {
    toolbar.scrollTo({
      left: toolbar.scrollWidth,
      behavior: "smooth",
    });

    if (isError) {
      preview.classList.add("error");
    } else {
      preview.classList.remove("error");
      gitHubLoginButton?.classList.add("highlight");
    }
  }
}

export function showError(error: string, showToast = false, description?: string) {
  console.error(error, description);

  if (showToast) {
    displayPopupMessage("Something went wrong", error, true);
  }
}
