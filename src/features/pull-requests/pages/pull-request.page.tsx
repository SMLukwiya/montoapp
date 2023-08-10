import { Layout } from "@/features/shared/components/layout/layout";
import { api } from "@/server/lib/api";
import { LoadingPage } from "@/features/shared/components/ui/loading";
import { Button } from "@/features/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ActionsTopbar } from "@/features/shared/components/layout/actions-topbar";
import Link from "next/link";

import DiffView from "@/features/pull-requests/components/diff-view";
import FileTree from "@/features/shared/components/file-tree";

export default function PullRequestPage({ id }: { id: string }) {
  const { data: diff } = api.diff.show.useQuery({ pullRequestId: id });
  const { data: pullRequest } = api.pullRequest.show.useQuery({ id });
  const { data: reviewComments } = api.reviewComment.list.useQuery({
    pullRequestId: id,
  });
  const { data: fileTree } = api.fileTree.show.useQuery({
    pullRequestId: id,
  });

  if (!pullRequest || !reviewComments || !diff || !fileTree)
    return (
      <Layout noPadding fullScreen fullScreenOnMobile>
        <LoadingPage />
      </Layout>
    );

  return (
    <>
      <Layout noPadding fullScreen fullScreenOnMobile>
        <div>
          <ActionsTopbar>
            <Link href={`/pull-requests/#${pullRequest.id}`}>
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </ActionsTopbar>
          <div className="overflow-auto px-2 md:overflow-visible md:px-8">
            <div className="pb-6">
              <h2 className="scroll-m-20 pt-4 text-xl font-semibold tracking-tight transition-colors first:mt-0">
                {pullRequest.title}
              </h2>
              <div className="text-sm text-slate-600">
                <a
                  href={pullRequest.html_url}
                  target="_blank"
                  className="pointer hover:underline"
                >
                  {pullRequest.head.ref} → {pullRequest.base.repo.name}:
                  {pullRequest.base.ref}
                </a>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="hidden md:block">
                <div
                  className="sticky flex-grow overflow-y-auto pb-2 pr-4"
                  style={{ maxHeight: "calc(100vh - 60px)", top: "60px" }}
                >
                  <FileTree files={fileTree} />
                </div>
              </div>
              <div className="pb-12 pr-2 md:pr-0">
                <DiffView
                  diff={diff}
                  pullRequest={pullRequest}
                  reviewComments={reviewComments}
                />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
