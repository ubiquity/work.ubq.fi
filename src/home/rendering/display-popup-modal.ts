import { toolbar } from "../ready-toolbar";
import { preview, previewBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
export function displayPopupMessage({ modalHeader, modalBody, isError, url }: { modalHeader: string; modalBody: string; isError: boolean; url?: string }) {
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
  }

  if (isError) {
    preview.classList.add("error");
  } else {
    preview.classList.remove("error");
  }
  console.trace({
    modalHeader,
    modalBody,
    isError,
    url,
  });
}

export function renderErrorInModal(error: Error, info?: string) {
  if (info) {
    console.error(error);
  } else {
    console.error(info ?? error.message);
  }
  displayPopupMessage({
    modalHeader: error.name,
    modalBody: info ?? error.message,
    isError: true,
  });
  return false;
}
