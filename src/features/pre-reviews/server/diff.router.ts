import { env } from "@/env.mjs";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import axios, { type AxiosResponse } from "axios";
import { z } from "zod";

export const preReviewDiffRouter = createTRPCRouter({
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

      if (!preReview) throw new Error("Pre-Review not found");

      const { owner, repo, head, base } = preReview;

      const response: AxiosResponse<string> = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/compare/${base}...${owner}:${repo}:${head}`,
        {
          headers: {
            Accept: "application/vnd.github.VERSION.diff",
            Authorization: `token ${env.MONTO_GITHUB_TOKEN}`,
          },
        }
      );

      return response.data;
    }),
});
