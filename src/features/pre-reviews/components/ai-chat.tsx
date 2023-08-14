import { Button } from "@/features/shared/components/ui/button";
import { Textarea } from "@/features/shared/components/ui/textarea";
import { api, type RouterOutputs } from "@/server/lib/api";
import { useChat } from "ai/react";
import { Loader2, Send } from "lucide-react";
import { type RefObject, useEffect, useRef, type KeyboardEvent } from "react";
import { type CodeComponent } from "react-markdown/lib/ast-to-react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function AiChat({
  diff,
  files,
  title,
}: {
  diff: string;
  files: string;
  title: string;
}) {
  const messagesContainerRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  console.log({ diff, files });
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: {
      diff,
      files,
      title,
    },
  });

  useEffect(() => {
    autoAdjustHeightOfTextarea(textareaRef);
  }, [input, textareaRef]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitButtonRef.current?.click();
    }
  };

  const CodeBlock: CodeComponent = ({
    inline,
    className,
    children,
    ...props
  }) => {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <SyntaxHighlighter style={ghcolors} language={match[1]} PreTag="div">
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code className={`${className || ""} inline-code`} {...props}>
        {children}
      </code>
    );
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <main className="h-full overflow-scroll" ref={messagesContainerRef}>
        <div>
          {messages.length > 0
            ? messages.map((message) => (
                <div
                  key={message.id}
                  className="flex w-full border-b border-b-slate-200 py-4 text-sm"
                >
                  <div className="w-10 flex-shrink-0 font-semibold">
                    {message.role === "user" ? "You: " : "AI: "}
                  </div>
                  <div className="flex-1">
                    <ReactMarkdown
                      className="markdown-wrapper"
                      components={{
                        code: CodeBlock,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))
            : null}
        </div>
      </main>
      <div>
        <form onSubmit={handleSubmit}>
          <div className="flex gap-x-2 py-2">
            <Textarea
              className="h-auto resize-none overflow-hidden bg-white px-2 py-2"
              onKeyDown={onKeyDown}
              onChange={handleInputChange}
              rows={1}
              value={input}
              placeholder="Ask me anything..."
              name="message"
              ref={textareaRef}
            />
            <Button
              type="submit"
              variant="default"
              disabled={false}
              ref={submitButtonRef}
            >
              {false ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function autoAdjustHeightOfTextarea(
  textareaRef: RefObject<HTMLTextAreaElement>
) {
  const MIN_HEIGHT = 40;
  const MAX_HEIGHT = 200;

  const textarea = textareaRef.current;
  if (!textarea) return;

  textarea.style.height = "auto";
  textarea.style.overflow = "hidden";

  const { scrollHeight } = textarea;

  if (scrollHeight > MIN_HEIGHT && scrollHeight < MAX_HEIGHT) {
    textarea.style.height = `${scrollHeight}px`;
  } else if (scrollHeight >= MAX_HEIGHT) {
    textarea.style.height = `${MAX_HEIGHT}px`;
    textarea.style.overflow = "auto";
    textarea.scrollTop = textarea.scrollHeight;
  }
}
