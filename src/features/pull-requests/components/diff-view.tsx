import { Button } from "@/features/shared/components/ui/button";
import { Textarea } from "@/features/shared/components/ui/textarea";
import { api, type RouterOutputs } from "@/server/lib/api";
import { useEffect, useRef, useState } from "react";
import {
  parseDiff,
  Diff,
  getChangeKey,
  type GutterOptions,
  type ChangeData,
  type TokenizeOptions,
  tokenize,
} from "react-diff-view";

import refractor from "refractor";

import "react-diff-view/style/index.css";
import "prism-themes/themes/prism-ghcolors.css";

type DiffFile = {
  hunks: HunkType[];
  oldEndingNewLine: boolean;
  newEndingNewLine: boolean;
  oldPath: string;
  newPath: string;
  oldRevision: string;
  newRevision: string;
  newMode: string;
  oldMode: string;
  type: "add" | "delete" | "modify" | "rename";
};

type HunkType = {
  content: string;
  oldStart: number;
  newStart: number;
  oldLines: number;
  newLines: number;
  changes: Change[];
  isPlain: boolean;
};

type Change = {
  content: string;
  type: "normal" | "insert" | "delete";
  isNormal?: boolean;
  oldLineNumber?: number;
  newLineNumber?: number;
  isDelete?: boolean;
  lineNumber?: number;
  isInsert?: boolean;
};

export default function DiffView({
  diff,
  pullRequest,
  reviewComments,
}: {
  diff: string;
  pullRequest: RouterOutputs["pullRequest"]["show"];
  reviewComments: RouterOutputs["reviewComment"]["list"];
}) {
  const {
    activeCommentLineChangeKey,
    setActiveCommentLineIdentifier,
    findActiveChangeForCommenting,
  } = useActiveCommentLine();

  const createReviewCommentMutation = api.reviewComment.create.useMutation({
    onSuccess: () => {
      setActiveCommentLineIdentifier(null);
    },
  });

  const files = parseDiff(diff) as DiffFile[];

  function createReviewComment(
    comment: string,
    change: Change,
    inReplyTo?: number
  ) {
    const body = comment;
    const line =
      change.lineNumber || change.newLineNumber || change.oldLineNumber;
    const path = getActiveCommentLineFile(change)?.newPath;
    console.log(change);
    if (!line || !path) {
      throw new Error(
        `Missing param: [line: ${line || "undefined"}], [path: ${
          path || "undefined"
        }]`
      );
    }

    createReviewCommentMutation.mutate({
      path,
      body,
      line,
      inReplyTo,
      owner: pullRequest.head.user.login,
      repo: pullRequest.head.repo?.name || "",
      pullNumber: pullRequest.number,
      commitId: pullRequest.head.sha,
    });
  }

  function getActiveCommentLineFile(change: Change) {
    return (
      files.find((file) =>
        file.hunks.some((hunk) =>
          hunk.changes.some((c) => {
            return (
              c.lineNumber === change.lineNumber && c.content === change.content
            );
          })
        )
      ) || null
    );
  }

  function renderGutter(options: GutterOptions) {
    return (
      <RenderGutter
        options={options}
        addComment={(change: Change | null) =>
          setActiveCommentLineIdentifier(change)
        }
      />
    );
  }

  function getWidgets(
    changes: Change[],
    fileName: string
  ): Record<string, React.ReactNode> {
    const widgets: Record<string, React.ReactNode> = {};

    const activeChangeForCommenting =
      activeCommentLineChangeKey && findActiveChangeForCommenting(changes);

    if (activeChangeForCommenting) {
      widgets[activeCommentLineChangeKey] = (
        <CommentEditor
          onSubmit={(comment: string) =>
            createReviewComment(comment, activeChangeForCommenting)
          }
          onCancel={() => setActiveCommentLineIdentifier(null)}
        />
      );
    }

    const commentsForFile = reviewComments.filter((comment) => {
      return comment.path === fileName && !comment.in_reply_to_id;
    });

    commentsForFile.forEach((comment) => {
      // we only support 1 thread per line
      const change = changes.find((change) =>
        [
          change.lineNumber,
          change.newLineNumber,
          change.oldLineNumber,
        ].includes(comment.line)
      );

      if (change) {
        const changeKey = getChangeKey(change);
        const replies = reviewComments.filter(
          (c) => c.in_reply_to_id === comment.id
        );

        widgets[changeKey] = (
          <ThreadBlock
            thread={[comment, ...replies]}
            onSubmit={(newComment: string) =>
              createReviewComment(newComment, change, comment.id)
            }
          />
        );
      }
    });

    return widgets;
  }

  // Todo: We can do some performance improvements here (e.g. only run this function on initial render)
  function buildHighlightedTokens(file: DiffFile) {
    const fileType = file.newPath.split(".").pop() || "";

    const language =
      refractor.listLanguages().find((lang) => lang === fileType) ?? "ts";

    const options: TokenizeOptions = {
      refractor,
      highlight: true,
      language,
    };

    return tokenize(file.hunks, options);
  }

  return (
    <div>
      {files.map((file, index) => {
        const allChanges = file.hunks.flatMap((hunk) => hunk.changes);

        const addedChangesCount = allChanges.filter(
          (change) => change.type === "insert"
        ).length;
        const removedChangesCount = allChanges.filter(
          (change) => change.type === "delete"
        ).length;

        return (
          <div
            id={file.newPath}
            key={`${file.newPath}-${file.newRevision}-${file.oldRevision}`}
            className={`position-relative ${index === 0 ? "" : "pt-12"}`}
          >
            <div className="rounded-lg border border-slate-200">
              <div
                className="sticky flex justify-between gap-x-2 rounded-t-lg border-b bg-slate-50 p-3"
                style={{ top: "52px" }}
              >
                <div className="font-mono text-xs">
                  {file.oldPath !== "/dev/null" &&
                    file.newPath !== file.oldPath && (
                      <div>{file.oldPath} → </div>
                    )}
                  <div>{file.newPath}</div>
                </div>
                <div className="flex gap-2">
                  <p className="font-mono text-xs text-green-600">
                    +{addedChangesCount}
                  </p>
                  <p className="font-mono text-xs text-red-600">
                    -{removedChangesCount}
                  </p>
                </div>
              </div>
              <Diff
                viewType="unified"
                diffType={file.type}
                hunks={file.hunks}
                widgets={getWidgets(allChanges, file.newPath)}
                renderGutter={renderGutter}
                tokens={buildHighlightedTokens(file)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThreadBlock({
  thread,
  onSubmit,
}: {
  thread: RouterOutputs["reviewComment"]["list"];
  onSubmit: (comment: string) => void;
}) {
  const [isCommenting, setIsCommenting] = useState(false);

  const handleSubmit = (commentText: string) => {
    onSubmit(commentText);
    setIsCommenting(false);
  };

  const handleCancel = () => {
    setIsCommenting(false);
  };

  const startCommenting = () => {
    setIsCommenting(true);
  };

  return (
    <div>
      <div className="flex flex-col">
        {thread.map((comment) => {
          return (
            <div
              className="border border-x-0 border-y-slate-200 p-4"
              key={comment.id}
            >
              <div className="pb-2 text-sm font-semibold">
                {comment.user.name}
              </div>
              <div className="text-sm">{comment.body}</div>
            </div>
          );
        })}
      </div>
      <div className="border-b border-b-slate-200 bg-slate-50 px-2 py-1">
        {!isCommenting ? (
          <div
            onClick={startCommenting}
            className="cursor-text rounded border border-slate-200 bg-white px-2 py-1"
          >
            <div className="text-sm text-slate-500">Reply...</div>
          </div>
        ) : (
          <CommentEditor onSubmit={handleSubmit} onCancel={handleCancel} />
        )}
      </div>
    </div>
  );
}

function RenderGutter({
  options,
  addComment,
}: {
  options: GutterOptions;
  addComment: (change: Change | ChangeData) => void;
}) {
  // TODO: Disabled comments on PRs for now
  // if (options.inHoverState && options.side === "old") {
  //   return (
  //     <div className="flex justify-between">
  //       <Button
  //         onClick={() => addComment(options.change)}
  //         size="sm"
  //         className="mt-px h-4 w-4 shrink-0 bg-blue-600 p-0 hover:bg-blue-700"
  //       >
  //         +
  //       </Button>
  //       {options.wrapInAnchor(options.renderDefault())}
  //     </div>
  //   );
  // }

  return (
    <div className="pl-4">{options.wrapInAnchor(options.renderDefault())}</div>
  );
}

function CommentEditor({
  onSubmit,
  onCancel,
}: {
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  function submitReviewComment() {
    onSubmit(comment);
    setComment("");
  }

  function cancelReview() {
    setComment("");
    onCancel();
  }

  return (
    <div className="border border-x-0 border-y-slate-200 bg-slate-50 p-4">
      <Textarea
        className="bg-white"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        ref={textareaRef}
      />
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => cancelReview()}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Cancel
        </Button>
        <Button onClick={submitReviewComment} className="mt-2" size="sm">
          Add comment
        </Button>
      </div>
    </div>
  );
}

function useActiveCommentLine() {
  const [activeCommentLineChangeKey, setActiveCommentLineChangeKey] = useState<
    string | null
  >(null);
  const [activeCommentLineContent, setActiveCommentLineContent] = useState<
    string | null
  >(null);

  function setActiveCommentLineIdentifier(change: Change | null) {
    if (!change) {
      setActiveCommentLineChangeKey(null);
      setActiveCommentLineContent(null);
      return;
    }

    const changeKey = getChangeKey(change);
    setActiveCommentLineChangeKey(changeKey);
    setActiveCommentLineContent(change.content);
  }

  function isActiveCommentLine(change: Change) {
    const currentChangeKey = getChangeKey(change);
    const currentContent = change.content;

    return (
      activeCommentLineChangeKey === currentChangeKey &&
      activeCommentLineContent === currentContent
    );
  }

  function findActiveChangeForCommenting(changes: Change[]) {
    return changes.find(isActiveCommentLine);
  }

  return {
    activeCommentLineChangeKey,
    setActiveCommentLineIdentifier,
    findActiveChangeForCommenting,
  };
}
