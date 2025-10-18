export const ubiquityAvatarUrl = "https://avatars.githubusercontent.com/u/76412717?v=4";

type OrgNameAndAvatarUrl = {
  owner: string;
  avatar_url: string;
};

async function fetchPartnerAvatars(): Promise<OrgNameAndAvatarUrl[]> {
  const response = await fetch("https://raw.githubusercontent.com/devpool-directory/devpool-directory/__STORAGE__/owners-avatars.json");
  const jsonData = await response.json();
  return jsonData;
}

// A global map of partner {owner => avatarUrl}
const partnerAvatarMap = new Map<string, string>();

export function fetchAvatar(orgName: string): string | undefined {
  return partnerAvatarMap.get(orgName.toLowerCase());
}

export async function fetchAvatars() {
  try {
    const partnerData = await fetchPartnerAvatars();

    partnerData.forEach(({ owner, avatar_url: avatarUrl }) => {
      if (avatarUrl && owner) {
        partnerAvatarMap.set(owner.toLowerCase(), avatarUrl);
      }
    });
  } catch (error) {
    console.error("Failed to load partner avatars:", error);
  }
}
