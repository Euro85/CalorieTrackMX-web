'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/lib/types';

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-prof-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2.5 max-w-[85%]">
        <div className="w-7 h-7 rounded-full bg-prof-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-prof-700 font-bold text-xs">
          IA
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
          <div className="prose prose-sm prose-gray max-w-none text-gray-800 [&>p:last-child]:mb-0 [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
