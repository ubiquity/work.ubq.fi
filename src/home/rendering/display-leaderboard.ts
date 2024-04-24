import { taskManager } from "../home";
import { preview, previewBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
import { getSupabase } from "./render-github-login-button";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { Octokit } from "@octokit/rest";

type SupabaseUser = { id: string; created: string; wallet_id: string };
type LeaderboardData = { address: string; balance: number };
type LeaderboardEntry = { address: string; username?: string; balance: number; created_at?: string };

export async function renderLeaderboard() {
  const container = taskManager.getContainer();
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  const existingAddresses = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-preview-id")));

  const delay = 0;
  const baseDelay = 500 / 15;

  const cachedEntries = localStorage.getItem("ubq-leaderboard") || "[]";
  const lastUpdate = localStorage.getItem("ubq-leaderboard-last-update") || "0";
  const parsedEntries = JSON.parse(cachedEntries) as LeaderboardEntry[];

  let entries: LeaderboardEntry[] | undefined = [];
  let addrAndBalances: LeaderboardData[] = [];

  if (!cachedEntries || Date.now() - parseInt(lastUpdate) > 1000 * 60 * 60 * 24 * 7) {
    // fetches the most up to date leaderboard data from the repo
    entries = await fetchAllLeaderboardDatas();

    if (!entries) {
      return;
    }

    return launchLeaderboard(
      entries.sort((a, b) => b.balance - a.balance),
      container,
      existingAddresses,
      delay,
      baseDelay
    );
  } else {
    if (lastUpdate && Date.now() - parseInt(lastUpdate) < 1000 * 60 * 60 * 24) {
      entries = parsedEntries.sort((a, b) => b.balance - a.balance);

      return launchLeaderboard(entries, container, existingAddresses, delay, baseDelay);
    }

    addrAndBalances = await fetchLeaderboardDataFromRepo();

    const { walletMap, users } = (await pullFromSupabase()) || { walletMap: new Map(), users: { data: [] } };
    const userIDS = users.data.map((user) => user.id);
    const githubUsers = await fetchUsernames(userIDS, new Octokit({ auth: await getGitHubAccessToken() }));

    entries = (await makeLeaderboardEntries(walletMap, users, addrAndBalances, githubUsers)).sort((a, b) => b.balance - a.balance);

    if (!entries) {
      return;
    }

    return launchLeaderboard(entries, container, existingAddresses, delay, baseDelay);
  }
}

async function launchLeaderboard(
  entries: LeaderboardEntry[],
  container: HTMLDivElement,
  existingAddresses: Set<string | null>,
  delay: number,
  baseDelay: number
) {
  for (const entry of entries) {
    if (!existingAddresses.has(entry.address)) {
      const entryWrapper = await everyNewEntry({ entry, container });
      if (entryWrapper) {
        setTimeout(() => entryWrapper?.classList.add("active"), delay);
        delay += baseDelay;
      }
    }
  }
  container.classList.add("ready");
  container.setAttribute("data-leaderboard", "true");
  localStorage.setItem("ubq-leaderboard-last-update", Date.now().toString());
}

async function pullFromSupabase() {
  const supabase = getSupabase();

  // pull all wallets from the database
  const { data, error } = await supabase.from("wallets").select("address, id");

  if (error || !data?.length) {
    console.error(error);
    return;
  }

  const walletMap = new Map<number, string>();

  for (const wallet of data) {
    walletMap.set(wallet.id, wallet.address);
  }

  // pull all users with wallets that are in the walletMap
  const users = (await supabase.from("users").select("id, created, wallet_id").in("wallet_id", Array.from(walletMap.keys()))) as { data: SupabaseUser[] };

  if (!users.data) {
    return;
  }

  return { walletMap, users };
}

async function makeLeaderboardEntries(
  walletMap: Map<number, string>,
  users: { data: SupabaseUser[] },
  addrAndBalances: LeaderboardData[],
  githubUsers: { id: string; username: string }[]
): Promise<LeaderboardEntry[]> {
  const wallets = users.data.map((user) => {
    const wId = Number(user.wallet_id);
    const uId = user.id;

    const username = githubUsers.find((user) => user.id === uId)?.username;

    const address = walletMap.get(wId);

    if (!address) {
      console.warn(`No address found for wallet ID ${wId}`);
      return { address: "", username: "", balance: 0, created_at: "" };
    }

    const balance = addrAndBalances.find((entry) => entry.address.toLowerCase() === address?.toLowerCase())?.balance || 0;

    return { address, username, balance, created_at: user.created };
  });

  localStorage.setItem("ubq-leaderboard", JSON.stringify(wallets));

  return wallets;
}

async function fetchAllLeaderboardDatas() {
  const octokit = new Octokit({ auth: await getGitHubAccessToken() });
  const addrAndBalances = await fetchLeaderboardDataFromRepo();

  const { walletMap, users } = (await pullFromSupabase()) || { walletMap: new Map(), users: { data: [] } };

  const userIDS = users.data.map((user) => user.id);
  const githubUsers = await fetchUsernames(userIDS, octokit);
  const wallets = await makeLeaderboardEntries(walletMap, users, addrAndBalances, githubUsers);

  return wallets.sort((a, b) => b.balance - a.balance);
}

async function fetchUsernames(userIds: string[], octokit: Octokit) {
  const usernames = [];

  for (const userID of userIds) {
    const { data, status } = await octokit.request(`GET /user/${userID}`);

    if (status !== 200) {
      console.error(`Failed to fetch user data for ${userID}`);
      continue;
    }

    usernames.push({
      id: data.id,
      username: data.login,
      avatar: data.avatar_url,
      name: data.name,
    });
  }

  return usernames;
}

async function everyNewEntry({ entry, container }: { entry: LeaderboardEntry; container: HTMLDivElement }) {
  const entryWrapper = document.createElement("div");
  const issueElement = document.createElement("div");
  issueElement.setAttribute("data-preview-id", entry.balance.toFixed(0));
  issueElement.classList.add("issue-element-inner");

  if (!entry.address) {
    console.warn("No address found");
    return;
  }

  setUpIssueElement(issueElement, entry);
  entryWrapper.appendChild(issueElement);

  container.appendChild(entryWrapper);
  return entryWrapper;
}

function setUpIssueElement(entryElement: HTMLDivElement, entry: LeaderboardEntry) {
  entryElement.innerHTML = `
        <div class="info">
            <div class="entry-title">
                <h3>${entry.username ?? "Contributor"}</h3>
                <p>$${entry.balance.toLocaleString()}</p>
            </div>
            <div class="entry-body">
                <p>${entry.address.toUpperCase()}</p>
            </div>
        </div>
    `;

  entryElement.addEventListener("click", () => {
    const entryWrapper = entryElement.parentElement;

    if (!entryWrapper) {
      throw new Error("No issue container found");
    }

    Array.from(entryWrapper.parentElement?.children || []).forEach((sibling) => {
      sibling.classList.remove("selected");
    });

    entryWrapper.classList.add("selected");

    previewEntryAdditionalDetails(entry);
  });
}

function previewEntryAdditionalDetails(entry: LeaderboardEntry) {
  titleHeader.textContent = entry.address;
  titleAnchor.href = `https://etherscan.io/address/${entry.address}`;
  previewBodyInner.innerHTML = `
          <div class="entry">
              <div class="title">
                  <h3>${entry.username ?? "Contributor"}</h3>
              </div>
              <div class="body">
                    ${entry.created_at ? `<p>Joined: ${new Date(entry.created_at).toLocaleDateString()}</p>` : ""}
                  <p>Earnings To Date: $${entry.balance.toLocaleString()}</p>
                  </div>
          </div>
      `;

  // Show the preview
  preview.classList.add("active");
  document.body.classList.add("preview-active");
}

async function fetchLeaderboardDataFromRepo(): Promise<LeaderboardData[]> {
  try {
    const token = await getGitHubAccessToken();
    const octokit = new Octokit({ auth: token });

    // @TODO: create an action that updates this every 24hrs and pulls from a Ubiquity repo

    const path = "leaderboard.csv";
    const url = "https://github.com/keyrxng/ubq-airdrop-cli";

    const { data, status } = await octokit.repos.getContent({
      owner: "keyrxng",
      repo: "ubq-airdrop-cli",
      path,
    });

    if (status !== 200) {
      throw new Error(`Failed to fetch leaderboard data from ${url}`);
    }

    const parsedData = atob(data.content);

    const entries = cvsToLeaderboardData(parsedData);

    if (entries.length === 0) {
      throw new Error("No entries found in leaderboard data");
    }

    return entries;
  } catch (err) {
    console.log(err);
    return [];
  }
}

function cvsToLeaderboardData(cvsData: string): { address: string; balance: number }[] {
  const lines = cvsData.split("\n");
  const data = [];
  for (const line of lines) {
    const [address, balance] = line.split(",");

    if (balance === undefined || isNaN(parseInt(balance))) {
      continue;
    }

    data.push({ address: address.toUpperCase(), balance: parseInt(balance) });
  }

  return data.sort((a, b) => b.balance - a.balance);
}
