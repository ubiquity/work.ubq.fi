import { TaskMaybeFull } from "../fetch-github/preview-to-full-mapping";

export function sortIssuesByLatestActivity(issues: TaskMaybeFull[], ordering: "normal" | "reverse" = "normal") {
  return issues.sort((a, b) => {
    const dateA = new Date(a.preview.updated_at);
    const dateB = new Date(b.preview.updated_at);
    return ordering === "normal" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  });
}
