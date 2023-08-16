import { createTRPCRouter } from "@/server/api/trpc";
import { pullRequestRouter } from "@/features/pull-requests/server/pull-request.router";
import { reviewCommentRouter } from "@/features/pull-requests/server/review-comment.router";
import { diffRouter } from "@/features/pull-requests/server/diff.router";
import { fileTreeRouter } from "@/features/pull-requests/server/file-tree.router";
import { preReviewDiffRouter } from "@/features/pre-reviews/server/diff.router";
import { preReviewFileTreeRouter } from "@/features/pre-reviews/server/file-tree.router";
import { preReviewRouter } from "@/features/pre-reviews/server/pre-review.router";
import { commentRouter } from "@/features/pre-reviews/server/comment.router";
import { issueRouter } from "../../features/issues/server/issue.router";
import { fileContentRouter } from "@/features/pre-reviews/server/file-content.router";
import { fullFileDiffRouter } from "@/features/pre-reviews/server/full-file-diff.router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  pullRequest: pullRequestRouter,
  reviewComment: reviewCommentRouter,
  diff: diffRouter,
  fileTree: fileTreeRouter,
  preReview: preReviewRouter,
  preReviewDiff: preReviewDiffRouter,
  preReviewFileTree: preReviewFileTreeRouter,
  comment: commentRouter,
  issue: issueRouter,
  fileContent: fileContentRouter,
  fullFileDiff: fullFileDiffRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
