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
  title: z.string(),
  url: z.string().url(),
});

export default function NewPullRequestPage() {
  const router = useRouter();
  const ctx = api.useContext();
  const mutation = api.issue.create.useMutation({
    onSuccess: async () => {
      toast({
        description: "Your issue has been created.",
      });

      await ctx.pullRequest.invalidate();
      await router.push("/issues");
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
    return mutation.mutate({
      title: data.title,
      url: data.url,
    });
  }

  return (
    <Layout noPadding fullScreenOnMobile>
      <form onSubmit={handlePromise(form.handleSubmit(savePullRequest))}>
        <ActionsTopbar>
          <Link href="/issues">
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
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title?.message && (
                <p className="text-red-600">
                  {form.formState.errors.title?.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="url">Issue URL</Label>
              <Input id="url" {...form.register("url")} />
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
