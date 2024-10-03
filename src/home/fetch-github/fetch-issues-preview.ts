import { displayPopupMessage } from "../rendering/display-popup-modal";

export function rateLimitModal(message: string) {
  displayPopupMessage({ modalHeader: `GitHub API rate limit exceeded.`, modalBody: message, isError: false });
}
