import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { Octokit } from "@octokit/rest";
import { z } from "zod";
import { env } from "@/env.mjs";
import { prisma } from "@/server/db";
import * as Diff from "diff";

export const fullFileDiffRouter = createTRPCRouter({
  show: privateProcedure
    .input(
      z.object({
        preReviewId: z.string(),
        filePath: z.string(),
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

      if (!preReview) throw new Error("Pre-Review not found");

      const githubApi = octokit();

      const baseFile = await githubApi.repos.getContent({
        owner: preReview.owner,
        repo: preReview.repo,
        path: input.filePath,
        ref: preReview.base,
      });

      const headFile = await githubApi.repos.getContent({
        owner: preReview.owner,
        repo: preReview.repo,
        path: input.filePath,
        ref: preReview.head,
      });

      if (
        !("content" in baseFile.data && baseFile.data.type === "file") ||
        !("content" in headFile.data && headFile.data.type === "file")
      ) {
        throw new Error("File not found");
      }

      const baseContent = Buffer.from(baseFile.data.content, "base64").toString(
        "utf-8"
      );

      const headContent = Buffer.from(headFile.data.content, "base64").toString(
        "utf-8"
      );

      const resultDiff = Diff.createPatch(
        input.filePath,
        baseContent,
        headContent
      );

      return resultDiff;
    }),
});

function octokit() {
  return new Octokit({
    auth: `token ${env.MONTO_GITHUB_TOKEN}`,
  });
}
