import { fetchAvatar, ubiquityAvatarUrl } from "../fetch-github/fetch-avatar";

export function renderOrgHeaderLabel(orgName: string): void {
  const brandingDiv = document.getElementById("branding");
  if (!brandingDiv) return;

  // Fetch the organization logo from the cache
  const logoUrl = fetchAvatar(orgName) ?? ubiquityAvatarUrl;

  const img = document.createElement("img");
  img.src = logoUrl;
  img.alt = `${orgName} Logo`;
  img.id = "logo";

  // Replace the existing SVG with the new image
  const svgLogo = brandingDiv.querySelector("svg#logo");
  if (svgLogo) brandingDiv.replaceChild(img, svgLogo);

  // Update the organization name inside the span with class 'full'
  const orgNameSpan = brandingDiv.querySelector("span.full");
  if (orgNameSpan) orgNameSpan.textContent = `${orgName.replace(/-/g, " ")} | `;
}
