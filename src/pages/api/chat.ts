import { StreamingTextResponse, LangChainStream, type Message } from "ai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AIChatMessage, HumanChatMessage } from "langchain/schema";
import { env } from "@/env.mjs";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

export const runtime = "edge";

export default async function POST(req: Request) {
  const request = (await req.json()) as {
    messages: Message[];
    diff: string;
  };
  const messages = request.messages;
  const diff = request.diff;

  const { stream, handlers } = LangChainStream();

  const template =
    "You are a brilliant and meticulous software engineer. We are working on this diff: {diff}";
  const systemMessagePrompt =
    SystemMessagePromptTemplate.fromTemplate(template);

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    systemMessagePrompt,
  ]);

  const formattedChatPrompt = await chatPrompt.formatMessages({
    diff,
  });

  const llm = new ChatOpenAI({
    openAIApiKey: env.OPENAI_API_KEY,
    modelName: "gpt-4", // "gpt-3.5-turbo"
    streaming: true,
  });

  llm
    .call(
      [
        ...formattedChatPrompt,
        ...messages.map((m) =>
          m.role == "user"
            ? new HumanChatMessage(m.content)
            : new AIChatMessage(m.content)
        ),
      ],
      {},
      [handlers]
    )
    .catch(console.error);

  return new StreamingTextResponse(stream);
}
