import { Context } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";
import { VoyageAIClient } from "voyageai";
import { Octokit } from "@octokit/rest";
import markdownit from "markdown-it";
import plainTextPlugin from "markdown-it-plain-text";
import { validatePOST } from "./validators";

const VECTOR_SIZE = 1024;

interface MarkdownItWithPlainText extends markdownit {
  plainText: string;
}

interface PayloadType {
  issue: {
    nodeId: string;
    number: number;
    title: string;
    body: string;
    state: string;
    stateReason: string | null;
    repositoryName: string;
    repositoryId: number;
    assignees: string[];
    createdAt: string;
    closedAt: string | null;
    updatedAt: string;
  };
  action: string;
  sender: {
    login: string;
  };
  repository: {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      type: string;
      site_admin: boolean;
    };
  };
}

interface IssueNode {
  id: string;
  number: number;
  title: string;
  body: string;
  state: string;
  stateReason: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  author: {
    login: string;
  } | null;
  assignees: {
    nodes: Array<{
      login: string;
    }>;
  };
  repository: {
    id: string;
    name: string;
    owner: {
      login: string;
    };
  };
}

interface GraphQlSearchResponse {
  search: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: Array<IssueNode>;
  };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequest(ctx: Context): Promise<Response> {
  const { request, env } = ctx;
  try {
    switch (request.method) {
      case "POST": {
        const result = await validatePOST(request);
        if (!result.isValid || !result.gitHubUser) {
          return new Response("Unauthorized", {
            headers: corsHeaders,
            status: 400,
          });
        }
        const githubUserName = result.gitHubUser.login;
        try {
          const supabase = new SupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);
          const response = await issueScraper(githubUserName, supabase, env.VOYAGEAI_API_KEY, result.authToken);
          return new Response(response, {
            headers: corsHeaders,
            status: 200,
          });
        } catch (error) {
          console.error("Error processing request:", error);
          return new Response("Internal Server Error", {
            headers: corsHeaders,
            status: 500,
          });
        }
      }

      default:
        return new Response("Method Not Allowed", {
          headers: corsHeaders,
          status: 405,
        });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", {
      headers: corsHeaders,
      status: 500,
    });
  }
}

function markdownToPlainText(markdown: string | null): string | null {
  if (!markdown) return markdown;
  const md = markdownit() as MarkdownItWithPlainText;
  md.use(plainTextPlugin);
  md.render(markdown);
  return md.plainText;
}

const SEARCH_ISSUES_QUERY = `
  query SearchIssues($searchText: String!, $after: String) {
    search(
      query: $searchText,
      type: ISSUE,
      first: 100,
      after: $after
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on Issue {
          id
          number
          title
          body
          state
          stateReason
          createdAt
          updatedAt
          closedAt
          author {
            login
          }
          assignees(first: 10) {
            nodes {
              login
            }
          }
          repository {
            id
            name
            owner {
              login
            }
          }
        }
      }
    }
  }
`;

async function fetchUserIssuesBatch(octokit: InstanceType<typeof Octokit>, username: string): Promise<IssueNode[]> {
  const allIssues: IssueNode[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  const searchText = `assignee:${username} is:issue is:closed`;

  while (hasNextPage) {
    const variables: { searchText: string; after?: string } = { searchText };
    if (cursor) {
      variables.after = cursor;
    }

    const response: GraphQlSearchResponse = await octokit.graphql<GraphQlSearchResponse>(SEARCH_ISSUES_QUERY, variables);

    const completedIssues = response.search.nodes.filter((issue) => issue.stateReason === "COMPLETED");
    allIssues.push(...completedIssues);

    hasNextPage = response.search.pageInfo.hasNextPage;
    cursor = response.search.pageInfo.endCursor;
  }

  return allIssues;
}

async function batchEmbeddings(voyageClient: VoyageAIClient, texts: string[]): Promise<(number[] | undefined)[]> {
  try {
    const embeddingResponse = await voyageClient.embed({
      input: texts,
      model: "voyage-large-2-instruct",
      inputType: "document",
    });
    return embeddingResponse.data?.map((item) => item.embedding) || [];
  } catch (error) {
    console.error("Error batching embeddings:", error);
    throw error;
  }
}

async function batchUpsertIssues(
  supabase: SupabaseClient,
  issues: Array<{
    id: string;
    markdown: string;
    plaintext: string;
    embedding: string;
    author_id: number;
    payload: PayloadType;
  }>
): Promise<void> {
  const { error } = await supabase.from("issues").upsert(issues);
  if (error) {
    throw new Error(`Error during batch upsert: ${error.message}`);
  }
}

async function batchFetchAuthorIds(octokit: InstanceType<typeof Octokit>, logins: string[]): Promise<Record<string, number>> {
  const authorIdMap: Record<string, number> = {};
  const BATCH_SIZE = 20;
  for (let i = 0; i < logins.length; i += BATCH_SIZE) {
    const batch = logins.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (login) => {
      try {
        const response = await octokit.rest.users.getByUsername({ username: login });
        return { login, id: response.data.id };
      } catch (error) {
        console.error(`Error fetching author ID for ${login}:`, error);
        return { login, id: -1 };
      }
    });
    const results = await Promise.all(promises);
    results.forEach(({ login, id }) => {
      authorIdMap[login] = id;
    });
  }
  return authorIdMap;
}

async function issueScraper(username: string, supabase: SupabaseClient, voyageApiKey: string, token?: string): Promise<string> {
  try {
    if (!username) {
      throw new Error("Username is required");
    }

    const octokit = new Octokit(token ? { auth: token } : {});
    const voyageClient = new VoyageAIClient({ apiKey: voyageApiKey });

    const issues = await fetchUserIssuesBatch(octokit, username);

    // Extract unique author logins
    const uniqueAuthors = Array.from(new Set(issues.map((issue) => issue.author?.login).filter((login): login is string => !!login)));

    // Fetch author IDs in batches
    const authorIdMap = await batchFetchAuthorIds(octokit, uniqueAuthors);

    const markdowns = issues.map((issue) => `${issue.body || ""} ${issue.title || ""}`);
    const plainTexts = markdowns.map(markdownToPlainText);
    const embeddings = await batchEmbeddings(voyageClient, markdowns);

    const upsertData = issues.map((issue, index) => {
      const authorId = issue.author?.login ? authorIdMap[issue.author.login] || -1 : -1;
      const repoOwner = issue.repository.owner.login;

      return {
        id: issue.id,
        markdown: markdowns[index],
        plaintext: plainTexts[index] ?? "",
        embedding: JSON.stringify(embeddings[index] || Array(VECTOR_SIZE).fill(0)),
        author_id: authorId,
        payload: {
          issue: {
            nodeId: issue.id,
            number: issue.number,
            title: issue.title || "",
            body: issue.body || "",
            state: issue.state,
            stateReason: issue.stateReason,
            repositoryName: issue.repository.name,
            repositoryId: parseInt(issue.repository.id),
            assignees: (issue.assignees?.nodes || []).map((a) => a.login),
            createdAt: issue.createdAt,
            closedAt: issue.closedAt,
            updatedAt: issue.updatedAt,
          },
          action: "created",
          sender: { login: username },
          repository: {
            id: parseInt(issue.repository.id),
            node_id: issue.repository.id,
            name: issue.repository.name,
            full_name: `${repoOwner}/${issue.repository.name}`,
            owner: {
              login: repoOwner,
              id: authorId,
              type: "User",
              site_admin: false,
            },
          },
        },
      };
    });

    await batchUpsertIssues(supabase, upsertData);

    return JSON.stringify(
      {
        success: true,
        stats: {
          storageSuccessful: upsertData.length,
          storageFailed: 0,
        },
        issues: upsertData.map((issue) => ({
          id: issue.id,
          markdown: issue.markdown,
          plaintext: issue.plaintext,
        })),
      },
      null,
      2
    );
  } catch (error) {
    console.error("Error in issueScraper:", error);
    throw error;
  }
}
