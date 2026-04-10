"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface StreamingContainerProps {
  content: string;
  isLoading?: boolean;
}

export const StreamingContainer = ({
  content,
  isLoading = false,
}: StreamingContainerProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  if (lines.length === 0 && !isLoading) return null;

  return (
    <div className="w-full rounded-lg border bg-muted/40 p-3 space-y-1 max-h-[200px] overflow-y-auto">
      {lines.map((line, idx) => {
        const isLast = idx === lines.length - 1;
        const isActive = isLast && isLoading;

        return (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-2.5 text-sm transition-opacity duration-300",
              isActive ? "opacity-100" : "opacity-70",
            )}
          >
            <span className="mt-0.5 shrink-0">
              {isActive ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary/60" />
              )}
            </span>
            <span
              className={cn(
                "leading-snug",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              {line}
              {isActive && (
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
