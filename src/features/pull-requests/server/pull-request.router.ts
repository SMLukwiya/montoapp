import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { clerkClient } from "@clerk/nextjs";
import { Octokit } from "@octokit/rest";
import { z } from "zod";
import { env } from "@/env.mjs";

export const pullRequestRouter = createTRPCRouter({
  show: privateProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const pullRequest = await prisma.pullRequest.findUnique({
        where: {
          id: input.id,
        },
        select: {
          owner: true,
          repo: true,
          pullNumber: true,
        },
      });

      if (!pullRequest) throw new Error("Pull request not found");

      const pullRequests = await octokit().rest.pulls.get({
        owner: pullRequest.owner,
        repo: pullRequest.repo,
        pull_number: pullRequest.pullNumber,
      });

      return pullRequests.data;
    }),

  list: privateProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? 10;
      const cursor = input.cursor;

      const pullRequests = await prisma.pullRequest.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: typeof cursor;
      if (pullRequests.length > limit) {
        const nextItem = pullRequests.pop();
        nextCursor = nextItem?.id;
      }

      const ownerIds = pullRequests
        .map((pr) => pr.userId || "undefined")
        .filter((ownerId) => ownerId !== "undefined");
      const users = await listClerkUsers(ownerIds);

      const pullRequestsWithOwner = pullRequests.map((pr) => {
        const user = users.find((user) => user.id === pr.userId);

        return {
          ...pr,
          user,
        };
      });

      return {
        items: pullRequestsWithOwner,
        nextCursor,
      };
    }),

  create: privateProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        pullNumber: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const pullRequest = await prisma.pullRequest.create({
        data: {
          owner: input.owner,
          repo: input.repo,
          pullNumber: input.pullNumber,
        },
      });

      return pullRequest;
    }),
});

function octokit() {
  return new Octokit({
    auth: `token ${env.MONTO_GITHUB_TOKEN}`,
  });
}

async function listClerkUsers(userIds: string[]) {
  const users = await clerkClient.users.getUserList({
    userId: userIds,
  });

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  }));
}
