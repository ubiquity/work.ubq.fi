export async function getReferralFromUser(devGitHubId: string): Promise<string | null> {
  const url = `/referral-manager?key=${encodeURIComponent(devGitHubId)}`;

  const response = await fetch(url, {
    method: "GET",
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

export async function getListOfReferrals(): Promise<Record<string, string | null> | null> {
  const url = "/referral-manager";

  const response = await fetch(url, {
    method: "GET",
  });

  if (response.status === 200) {
    const data = await response.json();
    return data; // return JSON file of pairs {key, value}
  } else {
    console.error(`Failed to fetch list. Status: ${response.status}`);
    return null;
  }
}
