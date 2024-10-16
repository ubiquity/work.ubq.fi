import { Octokit } from "@octokit/rest";
import { GitHubNotification } from "../../github-types";

type GraphQlTaskResponse = {
  repository: {
    pullRequest: {
      timelineItems: {
        nodes: Array<{
          subject?: { labels: { nodes: Array<{ name: string }> } };
          source?: { labels: { nodes: Array<{ name: string }> } };
        }>;
      };
    };
  };
};

export async function isAssociatedWithTask(notification: GitHubNotification, octokit: Octokit): Promise<boolean> {
  if (notification.subject.type === "Issue") {
    // Have to load it because devpool-issues.json doesn't show assigned tasks.
    // If they are working on it then they should be assigned.
    // @TODO: load all issues, even if assigned, in the directory. This will save network requests from the client.

    const issueLabels = await octokit.issues.listLabelsOnIssue({
      owner: notification.repository.owner.login,
      repo: notification.repository.name,
      issue_number: parseInt(notification.subject.url.split("/").pop() || "0", 10),
    });

    const hasPriceLabel = issueLabels.data.some((label) => label.name.startsWith("Price: "));
    if (hasPriceLabel) {
      return true;
    }
  } else if (notification.subject.type === "PullRequest") {
    try {
      const [owner, repo, , pullNumber] = notification.subject.url.split("/").slice(-4);

      const query = /* GraphQL */ `
        query ($owner: String!, $repo: String!, $pullNumber: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $pullNumber) {
              timelineItems(first: 20, itemTypes: [CONNECTED_EVENT, CROSS_REFERENCED_EVENT]) {
                nodes {
                  ... on ConnectedEvent {
                    subject {
                      ... on Issue {
                        labels(first: 10) {
                          nodes {
                            name
                          }
                        }
                      }
                    }
                  }
                  ... on CrossReferencedEvent {
                    source {
                      ... on Issue {
                        labels(first: 10) {
                          nodes {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const variables = {
        owner,
        repo,
        pullNumber: parseInt(pullNumber),
      };

      const response: GraphQlTaskResponse = await octokit.graphql(query, variables);

      const linkedItems = response.repository.pullRequest.timelineItems.nodes;

      for (const item of linkedItems) {
        const labels = item.subject?.labels?.nodes || item.source?.labels?.nodes;
        if (labels && labels.some((label) => label.name.toLowerCase().startsWith("priority: "))) {
          return true;
        }
      }
    } catch (error) {
      console.error("Error checking linked issues for priority labels:", error);
    }
  }
  return false;
}
