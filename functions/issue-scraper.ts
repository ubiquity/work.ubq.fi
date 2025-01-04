import { Context } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";
import { VoyageAIClient } from "voyageai";
import { Octokit } from "@octokit/rest";
import markdownit from "markdown-it";
import plainTextPlugin from "markdown-it-plain-text";
import { validatePOST } from "./validators";

interface MarkdownItWithPlainText extends markdownit {
    plainText: string;
}

interface IssueMetadata {
    nodeId: string;
    number: number;
    title: string;
    body: string;
    state: string;
    repositoryName: string;
    repositoryId: number;
    assignees: string[];
    authorId: number;
    createdAt: string;
    closedAt: string | null;
    stateReason: string | null;
    updatedAt: string;
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

async function fetchAuthorId(octokit: InstanceType<typeof Octokit>, login: string): Promise<number> {
    try {
        const response = await octokit.rest.users.getByUsername({ username: login });
        return response.data.id;
    } catch (error) {
        console.error(`Error fetching author ID for ${login}:`, error);
        return -1;
    }
}

async function fetchUserIssues(octokit: InstanceType<typeof Octokit>, username: string): Promise<IssueNode[]> {
    const allIssues: IssueNode[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    const searchText = `assignee:${username} is:issue is:closed`;

    while (hasNextPage) {
        const variables: { searchText: string; after?: string } = {
            searchText,
        };
        if (cursor) {
            variables.after = cursor;
        }

        const response: GraphQlSearchResponse = await octokit.graphql<GraphQlSearchResponse>(SEARCH_ISSUES_QUERY, variables);

        const completedIssues = response.search.nodes.filter((issue) => issue.stateReason === "COMPLETED");
        allIssues.push(...completedIssues);

        hasNextPage = response.search.pageInfo.hasNextPage;
        cursor = response.search.pageInfo.endCursor;

        if (!cursor) break;
    }

    return allIssues;
}

// Pulls issues from GitHub and stores them in Supabase
async function issueScraper(username: string, supabase: SupabaseClient, voyageApiKey: string, token?: string): Promise<string> {
    try {
        if (!username) {
            throw new Error("Username is required");
        }

        const context = {
            adapters: {},
            logger: {
                info: (message: string, data: Record<string, unknown>) => console.log("INFO:", message + ":", data),
                error: (message: string, data: Record<string, unknown>) => console.error("ERROR:", message + ":", data),
            },
            octokit: new Octokit(token ? { auth: token } : {}),
        };

        const voyageClient = new VoyageAIClient({ apiKey: voyageApiKey });
        const issues = await fetchUserIssues(context.octokit, username);
        const processedIssues: Array<{ issue: IssueMetadata; error?: string }> = [];
        for (const issue of issues) {
            try {
                const authorId = issue.author?.login ? await fetchAuthorId(context.octokit, issue.author.login) : -1;
                const repoOwner = issue.repository.owner.login;

                const metadata: IssueMetadata = {
                    nodeId: issue.id,
                    number: issue.number,
                    title: issue.title || "",
                    body: issue.body || "",
                    state: issue.state,
                    stateReason: issue.stateReason,
                    repositoryName: issue.repository.name,
                    repositoryId: parseInt(issue.repository.id),
                    assignees: (issue.assignees?.nodes || []).map((assignee) => assignee.login),
                    authorId,
                    createdAt: issue.createdAt,
                    closedAt: issue.closedAt,
                    updatedAt: issue.updatedAt,
                };
                const markdown = metadata.body + " " + metadata.title;
                const plaintext = markdownToPlainText(markdown);
                if (!plaintext || plaintext === null) {
                    throw new Error("Error converting markdown to plaintext");
                }
                const embeddingObject = await voyageClient.embed({
                    input: markdown,
                    model: "voyage-large-2-instruct",
                    inputType: "document",
                });
                const embedding = (embeddingObject.data && embeddingObject.data[0]?.embedding) || {};
                const payload = {
                    issue: metadata,
                    action: "created",
                    sender: {
                        login: username,
                    },
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
                };
                //Check if the user is authenticated
                if (!supabase.auth.getUser()) {
                    throw new Error("User is not authenticated");
                }

                const { error } = await supabase.from("issues").upsert({
                    id: metadata.nodeId,
                    markdown,
                    plaintext,
                    embedding: JSON.stringify(embedding),
                    author_id: metadata.authorId,
                    modified_at: metadata.updatedAt,
                    payload: payload,
                });

                processedIssues.push({
                    issue: metadata,
                    error: error ? `Error storing issue: ${error.message}` : undefined,
                });
            } catch (error) {
                processedIssues.push({
                    issue: {
                        nodeId: issue.id,
                        number: issue.number,
                        title: issue.title || "",
                        body: issue.body || "",
                        state: issue.state,
                        stateReason: issue.stateReason,
                        repositoryName: issue.repository.name,
                        repositoryId: parseInt(issue.repository.id),
                        assignees: [],
                        authorId: -1,
                        createdAt: issue.createdAt,
                        closedAt: issue.closedAt,
                        updatedAt: issue.updatedAt,
                    },
                    error: `Error processing issue: ${error instanceof Error ? error.message : "Unknown error"}`,
                });
            }
        }

        return JSON.stringify(
            {
                success: true,
                stats: {
                    storageSuccessful: processedIssues.filter((p) => !p.error).length,
                    storageFailed: processedIssues.filter((p) => p.error).length,
                },
                errors: processedIssues
                    .filter((p) => p.error)
                    .map((p) => ({
                        type: "storage",
                        name: `${p.issue.repositoryName}#${p.issue.number}`,
                        error: p.error,
                    })),
                issues: processedIssues.map((p) => ({
                    number: p.issue.number,
                    title: p.issue.title,
                    repo: p.issue.repositoryName,
                    error: p.error,
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
