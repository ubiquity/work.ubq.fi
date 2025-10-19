import { GitHubLabel } from "../github-types.ts";

export function getLabelText(label: GitHubLabel): string {
  return typeof label === "string" ? label : label?.name || "";
}
