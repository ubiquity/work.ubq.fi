import { toolbar } from "../ready-toolbar";
import { modal, modalBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
export function displayPopupMessage({ modalHeader, modalBody, isError, url }: { modalHeader: string; modalBody: string; isError: boolean; url?: string }) {
  titleHeader.textContent = modalHeader;
  if (url) {
    titleAnchor.href = url;
  }
  modalBodyInner.innerHTML = modalBody;

  modal.classList.add("active");
  document.body.classList.add("preview-active");

  if (toolbar) {
    toolbar.scrollTo({
      left: toolbar.scrollWidth,
      behavior: "smooth",
    });
  }

  if (isError) {
    modal.classList.add("error");
  } else {
    modal.classList.remove("error");
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
