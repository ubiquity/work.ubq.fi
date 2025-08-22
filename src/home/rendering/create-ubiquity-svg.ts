import ubiquitySvgDataUrl from "../../../static/ubiquity-logo.svg";

export function createUbiquitySvg(): SVGElement {
  const decodedSvg = decodeURIComponent(ubiquitySvgDataUrl.replace("data:image/svg+xml,", ""));

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(decodedSvg, "image/svg+xml");
  const svgElement = svgDoc.documentElement.cloneNode(true) as SVGElement;

  svgElement.id = "logo";
  svgElement.setAttribute("fill", "currentColor");
  svgElement.setAttribute("viewBox", "0 0 132 151");

  return svgElement;
}
