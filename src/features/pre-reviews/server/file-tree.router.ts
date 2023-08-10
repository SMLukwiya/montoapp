import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { prisma } from "@/server/db";
import { env } from "@/env.mjs";

export const preReviewFileTreeRouter = createTRPCRouter({
  show: privateProcedure
    .input(
      z.object({
        preReviewId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const preReview = await prisma.preReview.findUnique({
        where: {
          id: input.preReviewId,
        },
        select: {
          owner: true,
          repo: true,
          head: true,
          base: true,
        },
      });

      if (!preReview) throw new Error("Pre review not found");

      const { owner, repo, head, base } = preReview;

      const response = await octokit().repos.compareCommits({
        owner,
        repo,
        base,
        head,
      });

      const files = response.data.files;

      if (!files) throw new Error("Files not found");

      const fileTree = files.map((file) => {
        return {
          path: file.filename,
          changeType: file.status.toUpperCase(),
        };
      });

      return fileTree;
    }),
});

function octokit() {
  return new Octokit({
    auth: `token ${env.MONTO_GITHUB_TOKEN}`,
  });
}
