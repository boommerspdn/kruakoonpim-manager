import React, { useEffect, useRef } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

export const StreamingContainer = ({ content }: { content: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [content]);

  return (
    <ScrollArea
      ref={scrollRef}
      className="h-[150px] w-full bg-slate-900 text-green-400 p-4 font-mono text-sm 
                 rounded-lg border border-slate-700 
                 no-scrollbar break-all"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="whitespace-pre-wrap">
        {content}
        <div ref={bottomRef} className="h-px w-full" />
      </div>
    </ScrollArea>
  );
};
