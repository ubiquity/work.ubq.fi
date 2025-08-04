import { fetchAvatar, ubiquityAvatarUrl } from "../fetch-github/fetch-avatar";
import { createUbiquitySvg } from "./create-ubiquity-svg";

function updateBrandingImage(orgName: string): void {
  const brandingDiv = document.getElementById("branding");
  if (!brandingDiv) return;

  // Fetch the organization logo from the cache
  const logoUrl = fetchAvatar(orgName) ?? ubiquityAvatarUrl;

  const img = document.createElement("img");
  img.src = logoUrl;
  img.alt = `${orgName} Logo`;
  img.id = "logo";

  // Replace the existing SVG with the new image
  const svgLogo = brandingDiv.querySelector("svg#logo") ?? brandingDiv.querySelector("img#logo");
  if (svgLogo) brandingDiv.replaceChild(img, svgLogo);
}

function updateBrandingName(orgName: string): void {
  const brandingDiv = document.getElementById("branding");
  if (!brandingDiv) return;

  // Update the organization name inside the span with class 'full'
  const orgNameSpan = brandingDiv.querySelector("span.full");
  if (orgNameSpan) orgNameSpan.textContent = `${orgName.replace(/-/g, " ")} | `;
}

function updatePreviewName(orgName: string): void {
  const labelElement = document.querySelector('label[for="view-toggle"]') as HTMLLabelElement;
  labelElement?.classList.add("issue-preview");

  const brandingDiv = document.getElementById("branding");
  if (!brandingDiv) return;

  const previewNameSpan = brandingDiv.querySelector("span.preview") as HTMLElement;
  if (previewNameSpan) {
    previewNameSpan.textContent = orgName.replace(/-/g, " ");
  }
}

export function renderOrgHeaderLabel(orgName: string): void {
  updateBrandingImage(orgName);
  updateBrandingName(orgName);
}

export function renderPreviewIssueNav(orgName: string): void {
  updateBrandingImage(orgName);
  updatePreviewName(orgName);
}

export function resetOrgHeaderLabel(): void {
  const labelElement = document.querySelector('label[for="view-toggle"]') as HTMLLabelElement;
  labelElement?.classList.remove("issue-preview");

  const brandingDiv = document.getElementById("branding");
  if (!brandingDiv) return;

  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const urlOrgName = pathSegments.length > 0 ? pathSegments[0] : null;

  const currentLogo = brandingDiv.querySelector("img#logo") ?? brandingDiv.querySelector("svg#logo");
  if (!urlOrgName && currentLogo) {
    currentLogo.replaceWith(createUbiquitySvg());
  } else if (urlOrgName) {
    renderOrgHeaderLabel(urlOrgName);
  }
}
