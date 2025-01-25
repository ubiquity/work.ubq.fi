export const ubiquityAvatarUrl = "https://avatars.githubusercontent.com/u/76412717?v=4";

export type OrgNameAndAvatarUrl = {
  ownerName: string;
  avatar_url?: string;
};

export async function fetchPartnerAvatars(): Promise<OrgNameAndAvatarUrl[]> {
  const response = await fetch("https://raw.githubusercontent.com/ubiquity/devpool-directory/__STORAGE__/devpool-partner-avatars.json");
  const jsonData = await response.json();
  return jsonData;
}

// A global map of partner {ownerName => avatarUrl}
const partnerAvatarMap = new Map<string, string>();

export function fetchAvatar(orgName: string): string | undefined {
  return partnerAvatarMap.get(orgName.toLowerCase());
}

export async function fetchAvatars() {
  try {
    const partnerData = await fetchPartnerAvatars();
    
    partnerData.forEach(({ ownerName, avatar_url: avatarUrl }) => {
      if (avatarUrl) {
        partnerAvatarMap.set(ownerName.toLowerCase(), avatarUrl);
      }
    });
  } catch (error) {
    console.error("Failed to load partner avatars:", error);
  }
}
