import { organizationImageCache } from "../fetch-github/fetch-issues-full";

export function renderOrgHeaderLabel(orgName: string): void {
  const brandingDiv = document.getElementById("branding");
  if (!brandingDiv) return;

  // Fetch the organization logo from the cache
  const logoBlob = organizationImageCache.get(orgName);

  if (logoBlob) {
    // Convert Blob to a URL
    const logoUrl = URL.createObjectURL(logoBlob);

    const img = document.createElement("img");
    img.src = logoUrl;
    img.alt = `${orgName} Logo`;
    console.log("oi");
    img.id = "logo";

    // Replace the existing SVG with the new image
    const svgLogo = brandingDiv.querySelector("svg#logo");
    if (svgLogo) brandingDiv.replaceChild(img, svgLogo);
  }

  // Update the organization name inside the span with class 'full'
  const orgNameSpan = brandingDiv.querySelector("span.full");
  if (orgNameSpan) orgNameSpan.textContent = `${orgName.replace(/-/g, " ")} | `;
}
