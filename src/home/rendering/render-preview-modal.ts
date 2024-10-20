export const modal = document.createElement("div");
modal.classList.add("preview");
const modalContent = document.createElement("div");
modalContent.classList.add("preview-content");
const modalHeader = document.createElement("div");
modalHeader.classList.add("preview-header");
export const titleAnchor = document.createElement("a");
titleAnchor.setAttribute("target", "_blank");
export const titleHeader = document.createElement("h1");
const closeButton = document.createElement("button");
closeButton.classList.add("close-preview");
closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"/></svg>`;
const modalBody = document.createElement("div");
modalBody.classList.add("preview-body");
export const modalBodyInner = document.createElement("div");
modalBodyInner.classList.add("preview-body-inner");
modalHeader.appendChild(closeButton);
titleAnchor.appendChild(titleHeader);
const openNewLinkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`;
const openNewLink = document.createElement("span");
openNewLink.classList.add("open-new-link");
openNewLink.innerHTML = openNewLinkIcon;

const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#808080"><path d="M109-120q-11 0-20-5.5T75-140q-5-9-5.5-19.5T75-180l370-640q6-10 15.5-15t19.5-5q10 0 19.5 5t15.5 15l370 640q6 10 5.5 20.5T885-140q-5 9-14 14.5t-20 5.5H109Zm69-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm0-120q17 0 28.5-11.5T520-400v-120q0-17-11.5-28.5T480-560q-17 0-28.5 11.5T440-520v120q0 17 11.5 28.5T480-360Zm0-100Z"/></svg>`;
const error = document.createElement("span");
error.classList.add("error");
error.innerHTML = errorIcon;

titleAnchor.appendChild(error);
titleAnchor.appendChild(openNewLink);
modalHeader.appendChild(titleAnchor);
modalBody.appendChild(modalBodyInner);
modalContent.appendChild(modalHeader);
modalContent.appendChild(modalBody);
modal.appendChild(modalContent);
document.body.appendChild(modal);
export const issuesContainer = document.getElementById("issues-container");

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

  const newURL = new URL(window.location.href);
  newURL.searchParams.delete("issue");
  newURL.searchParams.delete("proposal");
  window.history.replaceState({}, "", newURL.toString());
}
