export function getRepoScore(repoId: number): number {
  const repoScores = JSON.parse(localStorage.getItem("repoScores") || "{}");
  return repoScores[repoId] || 0;
}
