export function renderServiceMessage() {
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get("message");
  if (message) {
    const serviceMessageContainer = document.querySelector("#bottom-bar > div");
    if (serviceMessageContainer) {
      serviceMessageContainer.textContent = message;
      serviceMessageContainer.parentElement?.classList.add("ready");
    }
  }
}
