import { env } from "@/env.mjs";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { Octokit } from "@octokit/rest";
import { z } from "zod";

export const reviewCommentRouter = createTRPCRouter({
  list: privateProcedure
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

      const reviewComments = await octokit().rest.pulls.listReviewComments({
        owner: pullRequest.owner,
        repo: pullRequest.repo,
        pull_number: pullRequest.pullNumber,
      });

      return reviewComments.data;
    }),
  create: privateProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        pullNumber: z.number(),
        body: z.string(),
        commitId: z.string(),
        path: z.string(),
        line: z.number(),
        inReplyTo: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return new Error("Not implemented");

      const request = await octokit().rest.pulls.createReviewComment({
        owner: input.owner,
        repo: input.repo,
        pull_number: input.pullNumber,
        body: input.body,
        commit_id: input.commitId,
        path: input.path,
        line: input.line,
        in_reply_to: input.inReplyTo,
      });

      return request.data;
    }),
});

function octokit() {
  return new Octokit({
    auth: `token ${env.MONTO_GITHUB_TOKEN}`,
  });
}
