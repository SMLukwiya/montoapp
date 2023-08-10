import { env } from "@/env.mjs";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import axios, { type AxiosResponse } from "axios";
import { z } from "zod";

export const diffRouter = createTRPCRouter({
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

      const response: AxiosResponse<string> = await axios.get(
        `https://api.github.com/repos/${pullRequest.owner}/${pullRequest.repo}/pulls/${pullRequest.pullNumber}`,
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
