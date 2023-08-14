import { Layout } from "@/features/shared/components/layout/layout";
import { api } from "@/server/lib/api";
import { LoadingPage } from "@/features/shared/components/ui/loading";
import { Button } from "@/features/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ActionsTopbar } from "@/features/shared/components/layout/actions-topbar";
import Link from "next/link";

import DiffView from "@/features/pre-reviews/components/diff-view";
import FileTree from "@/features/shared/components/file-tree";
import AiChat from "@/features/pre-reviews/components/ai-chat";
import { useState } from "react";
import { Switch } from "@/features/shared/components/ui/switch";

export default function PullRequestPage({ id }: { id: string }) {
  const isAdmin =
    typeof window !== "undefined" &&
    window.localStorage.getItem("isAdmin") === "true";

  const [isChatOpen, setIsChatOpen] = useState(false);
  const { data: diff } = api.preReviewDiff.show.useQuery({ preReviewId: id });
  const { data: preReview } = api.preReview.show.useQuery({ id });
  const { data: comments } = api.comment.list.useQuery({
    preReviewId: id,
  });

  const { data: fileTree } = api.preReviewFileTree.show.useQuery({
    preReviewId: id,
  });

  const fileContentQueries = api.useQueries((t) => [
    t.fileContent.show({
      path: "apps/web/components/eventtype/EventAvailabilityTab.tsx",
      owner: "monto7926",
      repo: "cal.com",
      ref: "main",
    }),
    t.fileContent.show({
      path: "packages/trpc/server/routers/viewer/availability/schedule/get.handler.ts",
      owner: "monto7926",
      repo: "cal.com",
      ref: "main",
    }),
  ]);

  if (!fileContentQueries.every((q) => q.isSuccess)) return <LoadingPage />;

  const fileContents = fileContentQueries
    .map((query) => {
      const data = query.data;
      return `${data?.path || ""}:"\n"${(data?.content || "")
        .split(" ")
        .join("")}`;
    })
    .join("\n\n");

  console.log({ fileContents, preReview, comments, diff, fileTree });
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
            {isAdmin && (
              <div className="flex items-center gap-2">
                <div
                  className="cursor-pointer text-xs font-semibold"
                  onClick={() => setIsChatOpen((prev) => !prev)}
                >
                  AI Assistant
                </div>
                <Switch
                  checked={isChatOpen}
                  onCheckedChange={() => {
                    setIsChatOpen((prev) => !prev);
                    return true;
                  }}
                />
              </div>
            )}
          </ActionsTopbar>
          <div className="flex">
            <div
              className={`overflow-auto px-2 md:overflow-visible md:px-8 ${
                isChatOpen ? "w-1/2 md:pr-3" : ""
              }`}
            >
              <div className="pb-6">
                <h2 className="scroll-m-20 pt-4 text-xl font-semibold tracking-tight transition-colors first:mt-0">
                  {preReview.title}
                </h2>
                <div className="text-sm text-slate-700">
                  {preReview.owner}/{preReview.repo}/{preReview.head}
                </div>
              </div>
              <div className="flex gap-4">
                {!isChatOpen && (
                  <div className="hidden md:block">
                    <div
                      className="sticky flex-grow overflow-y-auto pb-2 pr-4"
                      style={{ maxHeight: "calc(100vh - 60px)", top: "60px" }}
                    >
                      <FileTree files={fileTree} />
                    </div>
                  </div>
                )}
                <div className="pb-12 pr-2 md:pr-0">
                  <DiffView
                    diff={diff}
                    preReviewId={preReview.id}
                    reviewComments={comments}
                  />
                </div>
              </div>
            </div>
            {isChatOpen && (
              <div className="w-1/2 overflow-auto border-l-2 border-slate-100 bg-slate-50 px-2 md:overflow-visible">
                <div
                  className="sticky h-full flex-grow overflow-y-auto px-1 pb-2"
                  style={{ maxHeight: "calc(100vh - 60px)", top: "60px" }}
                >
                  <AiChat
                    diff={diff}
                    files={fileContents}
                    title={preReview.title || ""}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
