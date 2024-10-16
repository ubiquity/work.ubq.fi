import { Octokit } from "@octokit/rest";
import { GitHubNotification } from "../../github-types";

export async function getLinkBackCount(notification: GitHubNotification, octokit: Octokit): Promise<number> {
  try {
    const [owner, repo, , number] = notification.subject.url.split("/").slice(-4);
    const { data: timeline } = await octokit.issues.listEventsForTimeline({
      owner,
      repo,
      issue_number: parseInt(number),
    });
    const linkBacks = timeline.filter((event: { event: string }) => event.event === "cross-referenced");
    return linkBacks.length;
  } catch (error) {
    console.error("Error fetching linkBack count:", error);
    return -1;
  }
}
