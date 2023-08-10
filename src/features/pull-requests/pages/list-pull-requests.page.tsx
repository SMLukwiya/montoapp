import { Layout } from "@/features/shared/components/layout/layout";
import { type RouterOutputs, api } from "@/server/lib/api";
import { Button } from "@/features/shared/components/ui/button";
import { LoadingPage } from "@/features/shared/components/ui/loading";
import {
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  Loader2,
} from "lucide-react";
import Image from "next/image";

import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/router";

export default function ListPullRequestsPage() {
  const query = api.pullRequest.list.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const pullRequests = query.data?.pages.flatMap((page) => page.items);
  const { user } = useUser();

  return (
    <Layout>
      <div className="flex h-full flex-col gap-2 py-2">
        <div className="flex w-full items-start justify-between">
          <div className="pb-3">
            <h1 className="scroll-m-20 text-2xl font-bold tracking-tight">
              Pull Requests
            </h1>
          </div>
          {/*<Link href="pull-requests/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </Link>*/}
        </div>
        <div className="relative h-full space-y-3 pt-3">
          {(!pullRequests || !user) && <LoadingPage />}
          {pullRequests &&
            user &&
            pullRequests.map((pullRequest) => (
              <PullRequestItem pullRequest={pullRequest} key={pullRequest.id} />
            ))}
          <div className="w-full text-center">
            {query.hasNextPage && (
              <Button
                onClick={() => void query.fetchNextPage().catch(console.error)}
                variant="ghost"
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Load more
              </Button>
            )}
          </div>
          <div className="pt-8"></div>
        </div>
      </div>
    </Layout>
  );
}

type PullRequest = RouterOutputs["pullRequest"]["list"]["items"][number];

const PullRequestItem = ({ pullRequest }: { pullRequest: PullRequest }) => {
  const router = useRouter();

  return (
    <div
      id={pullRequest.id}
      className="cursor-pointer rounded-lg border border-muted hover:bg-slate-50"
      onClick={() =>
        void router
          .push(`/pull-requests/${pullRequest.id}`)
          .catch(console.error)
      }
      key={pullRequest.id}
    >
      <div
        className="flex items-start justify-between
    "
      >
        <div className="p-4">
          {pullRequest.user?.profileImageUrl && (
            <div className="flex items-center gap-1 pb-2">
              <Image
                src={pullRequest.user.profileImageUrl}
                width={20}
                height={20}
                alt="Profile image"
                className="rounded-full border border-slate-100"
              />
              <div className="text-xs text-slate-600">
                {pullRequest.user?.username}
              </div>
            </div>
          )}
          <h4 className="text-md scroll-m-20 font-semibold tracking-tight">
            {pullRequest.title}
          </h4>
          <div className="text-sm text-slate-600">
            {pullRequest.owner}/{pullRequest.repo}/{pullRequest.pullNumber}
          </div>
          <div className="pt-3">
            <PullRequestStatusBadge status={pullRequest.status || "OPEN"} />
          </div>
        </div>
      </div>
    </div>
  );
};

function PullRequestStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OPEN":
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-xs text-white">
          <GitPullRequest className="h-3 w-3" />
          Open
        </div>
      );
    case "MERGED":
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-1 text-xs text-white">
          <GitMerge className="h-3 w-3" />
          Merged
        </div>
      );
    case "CLOSED":
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs text-white">
          <GitPullRequestClosed className="h-3 w-3" />
          Closed
        </div>
      );
    default:
      throw new Error(`Unknown status: ${status}`);
  }
}
