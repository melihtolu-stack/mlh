import { Message } from "@/data/messages";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (message.isFromUs) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[75%] bg-success text-white rounded-xl px-4 py-3 shadow-sm border border-success/20">
          <p className="text-sm leading-relaxed break-words font-normal">{message.text}</p>
          <div className="flex justify-end mt-2">
            <span className="text-xs opacity-80 font-medium">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[75%] bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
        <p className="text-sm leading-relaxed break-words text-gray-900 font-medium">
          {message.text}
        </p>
        {message.originalText && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-secondary leading-relaxed break-words italic">
              {message.originalText}
            </p>
          </div>
        )}
        <div className="flex justify-end mt-2">
          <span className="text-xs text-secondary font-medium">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
