import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";

export const preReviewRouter = createTRPCRouter({
  show: privateProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const preReview = await prisma.preReview.findUnique({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          title: true,
          owner: true,
          repo: true,
          head: true,
          base: true,
        },
      });

      if (!preReview) throw new Error("Pre-Review not found");

      return preReview;
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

      const preReviews = await prisma.preReview.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: typeof cursor;
      if (preReviews.length > limit) {
        const nextItem = preReviews.pop();
        nextCursor = nextItem?.id;
      }

      const ownerIds = preReviews
        .map((preReview) => preReview.userId || "undefined")
        .filter((ownerId) => ownerId !== "undefined");
      const users = await listClerkUsers(ownerIds);

      const preReviewsWithOwner = preReviews.map((preReview) => {
        const user = users.find((user) => user.id === preReview.userId);
        return {
          ...preReview,
          user,
        };
      });

      return {
        items: preReviewsWithOwner,
        nextCursor,
      };
    }),

  create: privateProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        head: z.string(),
        base: z.string(),
        userId: z.string(),
        title: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const preReview = await prisma.preReview.create({
        data: {
          owner: input.owner,
          repo: input.repo,
          head: input.head,
          base: input.base,
          userId: input.userId,
          title: input.title,
        },
      });

      return preReview;
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
