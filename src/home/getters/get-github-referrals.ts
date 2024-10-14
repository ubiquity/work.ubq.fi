declare const WORKER_URL: string; // @DEV: passed in at build time check build/esbuild-build.ts

export async function getReferralFromUser(devGitHubId: number): Promise<string | null> {
    const url = `${WORKER_URL}/tracker/get?key=${encodeURIComponent(devGitHubId)}`;

    const response = await fetch(url, {
        method: 'GET',
    });
    
    if (response.status === 200) {
      const referralId = await response.text();
      return referralId;
    } else if (response.status == 404) {
      // No referral id found for devGitHubId
      return null;
    } else {
      console.error(`Failed to get key: '${devGitHubId}'. Status: ${response.status}`);
      return null;
    }
}

export async function getListOfReferrals(): Promise<any> {
  const url = `${WORKER_URL}/tracker/list`;

  const response = await fetch(url, {
      method: 'GET',
  });
  
  if (response.status === 200) {
    const data = await response.json();
    return data; // return JSON file of pairs {key, value}
  } else {
    console.error(`Failed to fetch list. Status: ${response.status}`);
    return null;
  }
}