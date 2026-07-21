import type { ChatMessageType } from "@/types";

export function UserMessage({ message }: { message: ChatMessageType }) {
  return (
    <div className="flex justify-end animate-slide-up">
      <div className="max-w-[85%] break-words rounded-lg rounded-tr-sm bg-primary px-4 py-2.5 text-[14.5px] leading-relaxed text-white shadow-soft sm:max-w-[75%]">
        {message.content}
      </div>
    </div>
  );
}
