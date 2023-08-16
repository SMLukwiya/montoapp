import { Layout } from "@/features/shared/components/layout/layout";
import { api } from "@/server/lib/api";
import { LoadingPage } from "@/features/shared/components/ui/loading";
import { Button } from "@/features/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ActionsTopbar } from "@/features/shared/components/layout/actions-topbar";
import Link from "next/link";

import DiffView from "@/features/pre-reviews/components/diff-view";
import FileTree from "@/features/shared/components/file-tree";

export default function PreReviewPage({ id }: { id: string }) {
  const { data: diff } = api.preReviewDiff.show.useQuery({ preReviewId: id });
  const { data: preReview } = api.preReview.show.useQuery({ id });
  const { data: comments } = api.comment.list.useQuery({
    preReviewId: id,
  });

  const { data: fileTree } = api.preReviewFileTree.show.useQuery({
    preReviewId: id,
  });
  console.log({ preReview, comments, diff, fileTree });
  if (!preReview || !comments || diff === undefined || !fileTree)
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
            <Link href={`/pre-reviews/#${preReview.id}`}>
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </ActionsTopbar>
          <div className="overflow-auto px-2 md:overflow-visible md:px-8">
            <div className="pb-6">
              <h2 className="scroll-m-20 pt-4 text-xl font-semibold tracking-tight transition-colors first:mt-0">
                {preReview.title}
              </h2>
              <div className="text-sm text-slate-700">
                {preReview.owner}/{preReview.repo}/{preReview.head}
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
                  preReviewId={id}
                  reviewComments={comments}
                />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
