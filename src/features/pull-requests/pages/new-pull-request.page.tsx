import { Input } from "@/features/shared/components/ui/input";
import { Button } from "@/features/shared/components/ui/button";
import { handlePromise } from "@/features/shared/utils/utils";
import { Label } from "@/features/shared/components/ui/label";
import { api } from "@/server/lib/api";
import { useZodForm } from "@/features/shared/hooks/use-zod-form";
import { toast } from "@/features/shared/components/ui/use-toast";
import { useRouter } from "next/router";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ActionsTopbar } from "@/features/shared/components/layout/actions-topbar";
import { Layout } from "@/features/shared/components/layout/layout";
import { z } from "zod";

const formSchema = z.object({
  url: z.string().url(),
});

export default function NewPullRequestPage() {
  const router = useRouter();
  const ctx = api.useContext();
  const mutation = api.pullRequest.create.useMutation({
    onSuccess: async () => {
      toast({
        description: "Your Pull Request has been created.",
      });

      await ctx.pullRequest.invalidate();
      await router.push("/pull-requests");
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast({
          variant: "destructive",
          description: errorMessage[0],
        });
      } else {
        toast({
          variant: "destructive",
          description: "Error! Please try again later.",
        });
      }
    },
  });

  const form = useZodForm({
    schema: formSchema,
  });

  function savePullRequest(data: z.infer<typeof formSchema>) {
    // const url = "https://github.com/owner/repo/pull/1234"
    const splittedUrl = data.url.split("/");
    const owner = splittedUrl[3];
    const repo = splittedUrl[4];
    const pullNumber = splittedUrl[6];

    if (!owner || !repo || !pullNumber) {
      toast({
        variant: "destructive",
        description: "Invalid URL",
      });
      return;
    }

    return mutation.mutate({
      owner,
      repo,
      pullNumber: parseInt(pullNumber),
    });
  }

  return (
    <Layout noPadding fullScreenOnMobile>
      <form onSubmit={handlePromise(form.handleSubmit(savePullRequest))}>
        <ActionsTopbar>
          <Link href="/pull-requests">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save
          </Button>
        </ActionsTopbar>

        <div className="p-3 md:px-8 md:py-6">
          <div className="max-w-2xl space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Pull Request URL</Label>
              <Input id="title" {...form.register("url")} />
              {form.formState.errors.url?.message && (
                <p className="text-red-600">
                  {form.formState.errors.url?.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
}
