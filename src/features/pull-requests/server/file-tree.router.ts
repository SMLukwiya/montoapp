import { env } from "@/env.mjs";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { graphql } from "@octokit/graphql";
import { z } from "zod";

const githubPullRequestSchema = z.object({
  repository: z.object({
    pullRequest: z.object({
      files: z.object({
        nodes: z.array(
          z.object({
            path: z.string(),
            changeType: z.string(),
          })
        ),
      }),
    }),
  }),
});

const FILE_TREE_QUERY = `
  query PullRequestQuery($owner: String!, $repo: String!, $pullRequestNumber: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pullRequestNumber) {
        changedFiles
        files(first: 100) {
          nodes {
            path
            changeType
          }
        }
      }
    }
  }
`;

export const fileTreeRouter = createTRPCRouter({
  show: privateProcedure
    .input(
      z.object({
        pullRequestId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const pullRequest = await prisma.pullRequest.findUnique({
        where: {
          id: input.pullRequestId,
        },
        select: {
          owner: true,
          repo: true,
          pullNumber: true,
        },
      });

      if (!pullRequest) throw new Error("Pull request not found");

      const response = await graphql(FILE_TREE_QUERY, {
        owner: pullRequest.owner,
        repo: pullRequest.repo,
        pullRequestNumber: pullRequest.pullNumber,
        headers: {
          authorization: `token ${env.MONTO_GITHUB_TOKEN}`,
        },
      });

      const parsedResponse = githubPullRequestSchema.parse(response);

      return parsedResponse.repository.pullRequest.files.nodes;
    }),
});
