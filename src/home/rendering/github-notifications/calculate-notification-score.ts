import { EnrichedGitHubNotification } from "./render-github-notifications";

export function calculateNotificationScore(notification: EnrichedGitHubNotification): number {
  let score = 0;

  // Priority level weight
  score += (notification.priorityLevel || 0) * 1000;

  // Age weight (older notifications have higher priority)
  const ageInMillis = Date.now() - new Date(notification.updated_at).getTime();
  const ageInDays = ageInMillis / (1000 * 60 * 60 * 24);
  score += ageInDays * 10; // Weight for age

  // LinkBack count weight
  score += (notification.linkBackCount || 0) * 100;

  // Repository score weight
  score += (notification.repoScore || 0) * 50;

  return score;
}
