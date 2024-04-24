import { taskManager } from "../home";
import { preview, previewBodyInner, titleAnchor, titleHeader } from "./render-preview-modal";
import { getSupabase } from "./render-github-login-button";
import { getGitHubAccessToken } from "../getters/get-github-access-token";
import { Octokit } from "@octokit/rest";
type LeaderboardEntry = { address: string; balance: number; username?: string; role?: string; created_at?: string };

export async function renderLeaderboard() {
  const container = taskManager.getContainer();
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  const existingAddresses = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-preview-id")));

  let delay = 0;
  const baseDelay = 500 / 15;

  const cachedEntries = localStorage.getItem("ubq-leaderboard");
  let entries: LeaderboardEntry[] = [];

  if (!cachedEntries) {
    // fetches the most up to date leaderboard data from the repo
    const addrAndBalances = await fetchLeaderboardDataFromRepo();
    entries = await matchUsernamesToLeaderboardEntries(addrAndBalances);
  } else {
    const parsedEntries = JSON.parse(cachedEntries);
    const addrAndBalances = await fetchLeaderboardDataFromRepo();

    // new contributors have joined since last time
    if (addrAndBalances.length > parsedEntries.length) {
      entries = await matchUsernamesToLeaderboardEntries(addrAndBalances);
    }

    const mergedEntries = addrAndBalances.map((addrAndBalance) => {
      const parsedEntry = parsedEntries.find((entry) => entry.address === addrAndBalance.address);
      if (parsedEntry) {
        return { ...parsedEntry, ...addrAndBalance };
      }
      return addrAndBalance;
    });

    entries = mergedEntries;
  }

  for (const entry of Object.values(entries)) {
    if (!existingAddresses.has(entry.address)) {
      const entryWrapper = await everyNewEntry({ entry, container });
      if (entryWrapper) {
        setTimeout(() => entryWrapper?.classList.add("active"), delay);
        delay += baseDelay;
      }
    }
  }
  container.classList.add("ready");
  // just so we aren't re-rendering the leaderboard if the same filter is applied
  container.setAttribute("data-leaderboard", "true");
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
                <p>${entry.address}</p>
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
                  <h4>Role: ${entry.role ?? "Contributor"}</h4>

              </div>
              <div class="body">
                    ${entry.created_at ? `<p>Joined: ${new Date(entry.created_at).toLocaleDateString()}</p>` : ""}
                  <p>Earnings To Date: $${entry.balance.toLocaleString()}</p>

                  <hr/>
  
                  <h4> Other infos like dev karma, Ubiquity XP, commit count/additions/deletions, etc. </h4>
                  </div>
          </div>
      `;

  // Show the preview
  preview.classList.add("active");
  document.body.classList.add("preview-active");
}

async function fetchLeaderboardDataFromRepo() {
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

async function matchUsernamesToLeaderboardEntries(entries: LeaderboardEntry[]) {
  const wallets = await fetchAllWalletsToUsername();

  if (!wallets) {
    throw new Error("No wallets found");
  }

  for (const entry of entries) {
    const wallet = wallets.find((wallet) => wallet.address.toLowerCase() === entry.address.toLowerCase());
    if (wallet) {
      entry.username = wallet.username;
      entry.created_at = wallet.created_at;
    } else {
      entry.username = "Contributor";
    }
  }

  localStorage.setItem("ubq-leaderboard", JSON.stringify(entries));

  return entries;
}

async function fetchAllWalletsToUsername() {
  const supabase = getSupabase();

  const { data, error } = await supabase.from("wallets").select("address, user_id");

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    return;
  }

  const walletMap = new Map<string, string>();

  for (const wallet of data) {
    walletMap.set(wallet.address, wallet.user_id);
  }

  const users = await supabase.from("users").select("id, username, created_at");

  if (!users.data || users.data.length === 0) {
    return;
  }

  const userMap = new Map<string, { username: string; created_at: string }>();

  for (const user of users.data) {
    userMap.set(user.id, { username: user.username, created_at: user.created_at });
  }

  const wallets: { address: string; username: string; created_at: string }[] = [];

  for (const [address, userID] of walletMap) {
    const user = userMap.get(userID);
    if (!user) {
      continue;
    }

    wallets.push({ address, ...user });
  }

  return wallets;
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
