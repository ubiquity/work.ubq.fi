import { Octokit } from "@octokit/rest";
import { GitHubNotification } from "../../github-types";

export async function getPriorityLevel(notification: GitHubNotification, octokit: Octokit): Promise<number> {
  try {
    let labels = [];

    if (notification.subject.type === "PullRequest") {
      const { data: pullRequest } = await octokit.request(`GET ${notification.subject.url}`);
      labels = pullRequest.labels.map((label: { name: string }) => label.name);
    } else if (notification.subject.type === "Issue") {
      const { data: issue } = await octokit.request(`GET ${notification.subject.url}`);
      labels = issue.labels.map((label: { name: string }) => label.name);
    }

    const priorityLabel = labels.find((label: string) => /^Priority:\s*\d+\s*\([A-Za-z]+\)$/.test(label));
    if (priorityLabel) {
      const priorityNumber = parseInt(priorityLabel.match(/\d+/)[0], 10);
      return priorityNumber;
    }

    return -1; // Default priority level
  } catch (error) {
    console.error(`Error fetching priority level: ${error}`);
    return -1; // Default priority level on error
  }
}
