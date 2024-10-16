import { GitHubNotification } from "../../github-types";

export function constructHtmlUrl(notification: GitHubNotification): string {
  const baseUrl = "https://github.com";
  const repoFullName = notification.repository.full_name;

  function getLastUrlSegment(url: string): string | null {
    const segments = url.split("/");
    return segments.length > 0 ? segments[segments.length - 1] : null;
  }

  try {
    const [, , type, number] = notification.subject.url.split("/").slice(-4);
    let url = `${baseUrl}/${repoFullName}`;

    switch (notification.subject.type) {
      case "Issue":
      case "PullRequest":
        url = `${url}/${type}/${number}`;
        break;
      case "Commit":
        url = `${url}/commit/${number}`;
        break;
      case "Release":
        url = `${url}/releases/tag/${number}`;
        break;
    }

    // Add comment hash if available
    if (notification.subject.latest_comment_url) {
      const commentId = getLastUrlSegment(notification.subject.latest_comment_url);
      if (commentId) {
        url += `#issuecomment-${commentId}`;
      }
    }

    return url;
  } catch (error) {
    console.error("Error constructing HTML URL:", error);
    return `${baseUrl}/${repoFullName}`;
  }
}
