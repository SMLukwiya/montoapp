import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/dist/api";

export const commentRouter = createTRPCRouter({
  list: privateProcedure
    .input(
      z.object({
        preReviewId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const comments = await prisma.comment.findMany({
        where: {
          preReviewId: input.preReviewId,
        },
      });

      const users = await listClerkUsers(
        comments.map((comment) => comment.authorId)
      );

      const commentsWithAuthor = comments.map((comment) => {
        const fallBackAuthor = {
          id: comment.authorId,
          username: "Unknown",
          profileImageUrl: `https://robohash.org/${comment.authorId}.png`,
        };

        const author =
          users.find((user) => user.id === comment.authorId) || fallBackAuthor;

        if (!author.profileImageUrl)
          author.profileImageUrl = fallBackAuthor.profileImageUrl;

        return {
          ...comment,
          author,
        };
      });

      return commentsWithAuthor;
    }),
  create: privateProcedure
    .input(
      z.object({
        lineContent: z.string(),
        path: z.string(),
        body: z.string(),
        inReplyToId: z.string().optional(),
        preReviewId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const comment = await prisma.comment.create({
        data: {
          lineContent: input.lineContent,
          path: input.path,
          body: input.body,
          inReplyToId: input.inReplyToId,
          preReviewId: input.preReviewId,
          authorId: ctx.userId,
        },
      });

      return comment;
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
