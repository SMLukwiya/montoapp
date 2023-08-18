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
  owner: z.string(),
  repo: z.string(),
  head: z.string(),
  base: z.string(),
  userId: z.string(),
  title: z.string(),
});

export default function NewPreReviewPage() {
  const router = useRouter();
  const ctx = api.useContext();
  const mutation = api.preReview.create.useMutation({
    onSuccess: async () => {
      toast({
        description: "Your Pre-Review has been created.",
      });

      await ctx.pullRequest.invalidate();
      await router.push("/pre-reviews");
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

  function savePreReview(data: z.infer<typeof formSchema>) {
    return mutation.mutate({
      owner: data.owner,
      repo: data.repo,
      head: data.head,
      base: data.base,
      userId: data.userId,
      title: data.title,
    });
  }

  return (
    <Layout noPadding fullScreenOnMobile>
      <form onSubmit={handlePromise(form.handleSubmit(savePreReview))}>
        <ActionsTopbar>
          <Link href="/pre-reviews">
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
              <Label htmlFor="owner">Owner (e.g. monto7926)</Label>
              <Input id="owner" {...form.register("owner")} />
              {form.formState.errors.owner?.message && (
                <p className="text-red-600">
                  {form.formState.errors.owner?.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="repo">Repo (e.g. cal.com)</Label>
              <Input id="repo" {...form.register("repo")} />
              {form.formState.errors.repo?.message && (
                <p className="text-red-600">
                  {form.formState.errors.repo?.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="head">Base (e.g. main)</Label>
              <Input id="head" {...form.register("base")} />
              {form.formState.errors.base?.message && (
                <p className="text-red-600">
                  {form.formState.errors.base?.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="head">Head (e.g. new-feature-branch)</Label>
              <Input id="head" {...form.register("head")} />
              {form.formState.errors.head?.message && (
                <p className="text-red-600">
                  {form.formState.errors.head?.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="userId">UserId</Label>
              <Input id="userId" {...form.register("userId")} />
              {form.formState.errors.userId?.message && (
                <p className="text-red-600">
                  {form.formState.errors.userId?.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title?.message && (
                <p className="text-red-600">
                  {form.formState.errors.title?.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
}
