import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { Octokit } from "@octokit/rest";
import { z } from "zod";
import { env } from "@/env.mjs";

export const fileContentRouter = createTRPCRouter({
  show: privateProcedure
    .input(
      z.object({
        owner: z.string(),
        repo: z.string(),
        path: z.string(),
        ref: z.string(), // SHA, branch, or tag
      })
    )
    .query(async ({ input }) => {
      const { owner, repo, path, ref } = input;

      const response = await octokit().repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ("content" in response.data && response.data.type === "file") {
        const content = Buffer.from(response.data.content, "base64").toString(
          "utf-8"
        );
        return {
          path,
          content,
        };
      } else {
        throw new Error("File not found");
      }
    }),
});

function octokit() {
  return new Octokit({
    auth: `token ${env.MONTO_GITHUB_TOKEN}`,
  });
}
