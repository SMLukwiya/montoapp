import { Layout } from "@/features/shared/components/layout/layout";
import { type RouterOutputs, api } from "@/server/lib/api";
import { Button } from "@/features/shared/components/ui/button";
import { LoadingPage } from "@/features/shared/components/ui/loading";
import { CheckCircle2, Circle, CircleDot, Loader2 } from "lucide-react";
import Image from "next/image";

import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ListIssuePage() {
  const query = api.issue.list.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const issues = query.data?.pages.flatMap((page) => page.items);
  const { user } = useUser();

  return (
    <Layout>
      <div className="flex h-full flex-col gap-2 py-2">
        <div className="flex w-full items-start justify-between"></div>
        <div className="rounded-md bg-slate-100 p-4">
          <h2 className="scroll-m-20 pb-1 text-lg font-bold tracking-tight">
            Ready to work on your next issue?
          </h2>
          <div className="pb-1 text-sm">
            Explore issues from projects like{" "}
            <Link
              href="https://github.com/calcom/cal.com/issues"
              target="_blank"
              className="text-slate-500 hover:underline"
            >
              cal.com
            </Link>
            ,{" "}
            <Link
              href="https://github.com/documenso/documenso/issues"
              target="_blank"
              className="text-slate-500 hover:underline"
            >
              documenso
            </Link>
            ,{" "}
            <Link
              href="https://github.com/formbricks/formbricks"
              target="_blank"
              className="text-slate-500 hover:underline"
            >
              Formbricks
            </Link>
            ,{" "}
            <Link
              href="https://github.com/Infisical/infisical/issues"
              target="_blank"
              className="text-slate-500 hover:underline"
            >
              Infisical
            </Link>
            , and{" "}
            <Link
              href="https://www.ycombinator.com/companies?batch=W24&batch=S23&batch=W23&batch=S22&batch=W22&batch=S21&batch=W21&batch=S20&batch=W20&tags=Open%20Source"
              target="_blank"
              className="text-slate-500 hover:underline"
            >
              others
            </Link>
            . Pick one that sparks your interest, add them to Monto, and start
            coding.
          </div>
          <Link href="/issues/new">
            <Button size="sm" className="mt-2">
              Add issue
            </Button>
          </Link>
        </div>
        <div className="relative h-full space-y-3 pt-3">
          {(!issues || !user) && <LoadingPage />}
          {issues &&
            user &&
            issues.map((pullRequest) => (
              <IssueItem pullRequest={pullRequest} key={pullRequest.id} />
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

type PullRequest = RouterOutputs["issue"]["list"]["items"][number];

const IssueItem = ({ pullRequest }: { pullRequest: PullRequest }) => {
  const router = useRouter();

  return (
    <div
      id={pullRequest.id}
      className="cursor-pointer rounded-lg border border-muted hover:bg-slate-50"
      onClick={() =>
        void router.push(`/issues/${pullRequest.id}`).catch(console.error)
      }
      key={pullRequest.id}
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
        <div className="pt-3">
          <IssueStatusBadge status={pullRequest.status || "OPEN"} />
        </div>
      </div>
    </div>
  );
};

function IssueStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OPEN":
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-gray-400 px-2 py-1 text-xs text-white">
          <Circle className="h-3 w-3" />
          Open
        </div>
      );
    case "IN_PROGRESS":
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-xs text-white">
          <CircleDot className="h-3 w-3" />
          In progress
        </div>
      );
    case "DONE":
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-1 text-xs text-white">
          <CheckCircle2 className="h-3 w-3" />
          Done
        </div>
      );
    default:
      throw new Error(`Unknown status: ${status}`);
  }
}
