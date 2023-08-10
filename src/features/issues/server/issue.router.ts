import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";

export const issueRouter = createTRPCRouter({
  show: privateProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const issue = await prisma.issue.findUnique({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          title: true,
          googleDocUrl: true,
          owner: true,
          repo: true,
          issueNumber: true,
        },
      });

      if (!issue) throw new Error("Issue not found");

      return issue;
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

      const issues = await prisma.issue.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: typeof cursor;
      if (issues.length > limit) {
        const nextItem = issues.pop();
        nextCursor = nextItem?.id;
      }

      const ownerIds = issues
        .map((issue) => issue.userId || "undefined")
        .filter((ownerId) => ownerId !== "undefined");
      const users = await listClerkUsers(ownerIds);

      const issuesWithOwner = issues.map((issue) => {
        const user = users.find((user) => user.id === issue.userId);
        return {
          ...issue,
          user,
        };
      });

      return {
        items: issuesWithOwner,
        nextCursor,
      };
    }),

  create: privateProcedure
    .input(
      z.object({
        title: z.string(),
        url: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const url = input.url;

      // ['https:', '', 'github.com', 'calcom', 'cal.com', 'issues', '10640']
      const splittedUrl = url.split("/");
      const owner = splittedUrl[3];
      const repo = splittedUrl[4];
      const issueNumber = splittedUrl[6];

      if (!owner || !repo || !issueNumber) throw new Error("Invalid URL");

      const issue = await prisma.issue.create({
        data: {
          title: input.title,
          owner,
          repo,
          issueNumber: parseInt(issueNumber),
          userId: ctx.userId,
        },
      });

      return issue;
    }),
});

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
