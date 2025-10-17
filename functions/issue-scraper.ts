// Deno-compatible request handler for the issue scraper endpoint
import { SupabaseClient } from "npm:@supabase/supabase-js";
import { VoyageAIClient, VoyageAIError } from "npm:voyageai";
import { Octokit } from "npm:@octokit/rest";
import markdownit from "npm:markdown-it";
import plainTextPlugin from "npm:markdown-it-plain-text";
import { validatePOST } from "./validators";
import { RequestError } from "npm:@octokit/request-error";

interface ApiError {
  source: "github" | "voyage" | "supabase";
  status: number;
  retryAfter: number;
  isRateLimit: boolean;
  resetTime?: number;
}

function createApiError(source: ApiError["source"], status: number, headers?: Record<string, string>): ApiError {
  const retryAfter = headers?.["retry-after"] ? parseInt(headers["retry-after"]) : 60;

  const resetTime = headers?.["x-ratelimit-reset"] ? parseInt(headers["x-ratelimit-reset"]) * 1000 : undefined;

  const isRateLimit = headers?.["x-ratelimit-remaining"] === "0" || status === 429 || (status === 403 && resetTime !== undefined);

  return {
    source,
    status,
    retryAfter,
    isRateLimit,
    resetTime,
  };
}

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
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
export async function handleIssueScraper(request: Request): Promise<Response> {
  try {
    switch (request.method) {
      case "OPTIONS": {
        return new Response(null, { headers: corsHeaders, status: 204 });
      }
      case "POST": {
        const result = await validatePOST(request);
        if (!result.isValid || !result.gitHubUser) {
          return new Response("Unauthorized", { headers: corsHeaders, status: 401 });
        }
        const githubUserName = result.gitHubUser.login;
        const timestamp = result.timestamp; // Unix timestamp in milliseconds

        try {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
          const SUPABASE_KEY = Deno.env.get("SUPABASE_KEY");
          const VOYAGEAI_API_KEY = Deno.env.get("VOYAGEAI_API_KEY");

          // Ensure required environment variables are present in dev/prod
          const missing: string[] = [];
          if (!SUPABASE_URL) missing.push("SUPABASE_URL");
          if (!SUPABASE_KEY) missing.push("SUPABASE_KEY");
          if (!VOYAGEAI_API_KEY) missing.push("VOYAGEAI_API_KEY");
          if (missing.length) {
            return new Response(
              JSON.stringify({
                success: false,
                retryInfo: {
                  source: "configuration",
                  status: 503,
                  retryAfter: 3600,
                  message: `Service not configured. Missing: ${missing.join(", ")}`,
                },
              }),
              { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" } }
            );
          }
          const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);
          const response = await issueScraper(githubUserName, supabase, VOYAGEAI_API_KEY, result.authToken, timestamp);
          return new Response(response, { headers: corsHeaders, status: 200 });
        } catch (error) {
          console.error("Error processing request:", error);
          return new Response("Internal Server Error", { headers: corsHeaders, status: 500 });
        }
      }
      default:
        return new Response("Method Not Allowed", { headers: corsHeaders, status: 405 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", { headers: corsHeaders, status: 500 });
  }
}

function markdownToPlainText(markdown: string | null): string | null {
  if (!markdown) return markdown;
  const md = markdownit() as MarkdownItWithPlainText;
  md.use(plainTextPlugin);
  md.render(markdown);
  return md.plainText;
}

const SEARCH_ISSUES_QUERY = /* GraphQL */ `
  query SearchIssues($searchText: String!, $after: String) {
    search(query: $searchText, type: ISSUE, first: 100, after: $after) {
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

async function fetchUserIssuesBatch(octokit: InstanceType<typeof Octokit>, username: string, lastScraped?: number): Promise<IssueNode[]> {
  const searchText = `assignee:${username} is:issue is:closed reason:completed ${lastScraped ? `closed:>${new Date(lastScraped).toISOString()}` : ""}`;
  const allIssues: IssueNode[] = [];
  let cursor: string | null = null;

  let hasNextPage = true;
  while (hasNextPage) {
    try {
      const response = await octokit.graphql<GraphQlSearchResponse>(SEARCH_ISSUES_QUERY, {
        searchText,
        after: cursor,
      });

      allIssues.push(...response.search.nodes);

      hasNextPage = response.search.pageInfo.hasNextPage;

      cursor = response.search.pageInfo.endCursor;
    } catch (error) {
      if (error instanceof RequestError) {
        if (error.status === 403 || error.status === 429) {
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(error?.response?.headers || {})) {
            if (value) headers[key] = String(value);
          }
          throw createApiError("github", error.status, headers);
        }
      }
      throw error;
    }
  }

  return allIssues;
}

async function batchEmbeddings(voyageClient: VoyageAIClient, texts: string[]): Promise<(number[] | undefined)[]> {
  try {
    const response = await voyageClient.embed({
      input: texts,
      model: "voyage-large-2-instruct",
      inputType: "document",
    });
    return response.data?.map((item) => item.embedding) || [];
  } catch (error) {
    if (error instanceof VoyageAIError) {
      if (error.statusCode === 429 || error.statusCode === 403) {
        throw createApiError("voyage", error.statusCode);
      }
    }
    throw createApiError("voyage", 500);
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
  try {
    const { error } = await supabase.from("issues").upsert(issues);
    if (error?.message?.includes("429") || error?.message?.includes("rate limit")) {
      throw createApiError("supabase", 429, { "retry-after": "60" });
    }
    if (error) throw error;
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      const status = error.status as number;
      if (status === 429 || status === 403) {
        throw createApiError("supabase", status);
      }
    }
    throw error;
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

async function issueScraper(username: string, supabase: SupabaseClient, voyageApiKey: string, token?: string, timestamp?: number): Promise<string> {
  try {
    if (!username) {
      throw new Error("Username is required");
    }

    const storageFailed = [];

    const octokit = new Octokit(token ? { auth: token } : {});
    const voyageClient = new VoyageAIClient({ apiKey: voyageApiKey });

    let issues = await fetchUserIssuesBatch(octokit, username, timestamp);

    const uniqueAuthors = Array.from(new Set(issues.map((issue) => issue.author?.login).filter((login): login is string => !!login)));

    const authorIdMap = await batchFetchAuthorIds(octokit, uniqueAuthors);

    // Filter the issues to include only those with a valid title
    issues = issues.filter((issue) => {
      if (!issue.title) {
        storageFailed.push({
          id: issue.id,
          reason: "Issue does not have a title",
        });
        return false;
      }
      return true;
    });

    if (issues.length === 0) {
      return JSON.stringify(
        {
          success: false,
          stats: {
            storageSuccessful: 0,
            storageFailed: storageFailed.length,
          },
          issues: [],
          storageFailed: storageFailed,
          error: "No valid issues found to process",
        },
        null,
        2
      );
    }

    const markdowns = issues.map((issue) => {
      return `${issue.body || ""} ${issue.title}`;
    });
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
            title: issue.title,
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
          storageFailed: storageFailed.length,
        },
        issues: upsertData.map((issue) => ({
          id: issue.id,
          markdown: issue.markdown,
          plaintext: issue.plaintext,
        })),
        storageFailed: storageFailed,
      },
      null,
      2
    );
  } catch (error) {
    console.error("Error in issueScraper:", error);

    if ("source" in error) {
      const apiError = error as ApiError;
      const waitTime = Math.ceil(((apiError.resetTime || Date.now() + apiError.retryAfter * 1000) - Date.now()) / 60000);

      return JSON.stringify({
        success: false,
        retryInfo: {
          source: apiError.source,
          status: apiError.status,
          retryAfter: apiError.retryAfter,
          message: `${apiError.isRateLimit ? "Rate limit exceeded" : "Service unavailable"} for ${apiError.source}. Please wait ${waitTime} minute(s).`,
        },
      });
    }

    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
