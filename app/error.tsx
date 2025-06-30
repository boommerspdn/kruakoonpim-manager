"use client"; // Error boundaries must be Client Components

import { Button } from "@/components/ui/button";
import { Squirrel } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="size-full flex flex-col justify-center items-center gap-4">
      <Squirrel size={120} className="text-primary" />
      <h2 className="text-2xl">เกิดข้อผิดพลาด กดรีเฟรชหรือรีสตาร์ทแอพ</h2>
      <Button
        className="px-12"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        รีเฟรช
      </Button>
    </div>
  );
}
