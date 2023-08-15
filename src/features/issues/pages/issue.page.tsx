import { Layout } from "@/features/shared/components/layout/layout";
import { api } from "@/server/lib/api";
import { LoadingPage } from "@/features/shared/components/ui/loading";
import { Button } from "@/features/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ActionsTopbar } from "@/features/shared/components/layout/actions-topbar";
import Link from "next/link";

export default function IssuePage({ id }: { id: string }) {
  const { data: issue } = api.issue.show.useQuery({ id });

  if (!issue)
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
            <Link href={`/issues/#${issue.id}`}>
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </ActionsTopbar>
          <div className="w-full" style={{ height: "calc(100vh - 70px)" }}>
            {issue.googleDocUrl && (
              <iframe
                src={`${issue.googleDocUrl}&random=${Math.random()}`}
                className="h-full w-full border-0 pl-4"
              ></iframe>
            )}
            {!issue.googleDocUrl && (
              <div className="px-3 md:px-12 md:py-5">
                <h2 className="scroll-m-20 pt-4 text-xl font-semibold tracking-tight transition-colors first:mt-0">
                  {issue.title}
                </h2>
                <a
                  href={`https://github.com/${issue.owner ?? ""}/${
                    issue.repo ?? ""
                  }/issues/${issue.issueNumber ?? ""}`}
                  target="_blank"
                  className="text-sm text-slate-600 hover:underline"
                >
                  {`https://github.com/${issue.owner ?? ""}/${
                    issue.repo ?? ""
                  }/issues/${issue.issueNumber ?? ""}`}
                </a>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
