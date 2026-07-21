import type { ChatMessageType } from "@/types";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";

export function ChatMessage({
  message,
  onRegenerate,
}: {
  message: ChatMessageType;
  onRegenerate?: () => void;
}) {
  return message.role === "user" ? (
    <UserMessage message={message} />
  ) : (
    <AssistantMessage message={message} onRegenerate={onRegenerate} />
  );
}
