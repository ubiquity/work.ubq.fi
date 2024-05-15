import { toolbar } from "../ready-toolbar";
import { gitHubLoginButton } from "./render-github-login-button";
import { preview, previewBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
export function displayPopupMessage(header: string, message: string, url?: string) {
  titleHeader.textContent = header;
  if (url) {
    titleAnchor.href = url;
  }
  previewBodyInner.innerHTML = message;

  preview.classList.add("active");
  document.body.classList.add("preview-active");

  if (toolbar) {
    toolbar.scrollTo({
      left: toolbar.scrollWidth,
      behavior: "smooth",
    });

    gitHubLoginButton?.classList.add("highlight");
  }
}

export class Popup {
  private _timeoutId: number | null = null;
  private _popupElement: HTMLElement;

  constructor() {
    this._popupElement = document.createElement("div");
    this._popupElement.classList.add("popup");
    document.body.appendChild(this._popupElement);
  }

  public show(message: string): void {
    this._popupElement.textContent = message;
    this._popupElement.classList.add("active");

    // Clear any existing timeouts
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }

    // Set a new timeout to hide the popup after 20 seconds
    this._timeoutId = window.setTimeout(() => {
      this._hide();
    }, 20000);
  }

  private _hide(): void {
    this._popupElement.classList.remove("active");
  }
}
