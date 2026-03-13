"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Delete, Loader2 } from "lucide-react";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const PIN_LENGTH = 6; // เปลี่ยนเป็น 4 ได้ถ้าอยากได้รหัส 4 หลัก

  // แก้ไขรับ parameter passcode โดยตรงเพื่อความชัวร์ตอน auto-submit
  const handleLogin = async (currentPasscode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await axios.post("/api/login", { passcode: currentPasscode });
      window.location.href = "/";
    } catch (error: unknown) {
      console.log(error);
      setError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่");
      setPasscode(""); // รีเซ็ตเมื่อรหัสผิด
      setIsLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (passcode.length < PIN_LENGTH && !isLoading) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);
      setError(null);

      // Auto submit เมื่อกดครบจำนวน
      if (newPasscode.length === PIN_LENGTH) {
        handleLogin(newPasscode);
      }
    }
  };

  const handleDelete = () => {
    if (passcode.length > 0 && !isLoading) {
      setPasscode(passcode.slice(0, -1));
      setError(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="max-w-sm mx-auto w-full">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Enter Passcode</CardTitle>
          <CardDescription>กรุณากดรหัสผ่านเพื่อเข้าสู่ระบบ</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="flex gap-4 my-6">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all duration-200",
                  i < passcode.length
                    ? "bg-primary border-primary"
                    : "bg-transparent border-muted-foreground/30",
                )}
              />
            ))}
          </div>

          <div className="h-6 mb-4 flex items-center justify-center">
            {isLoading ? (
              <span className="flex gap-2 items-center text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> กำลังตรวจสอบ...
              </span>
            ) : error ? (
              <span className="text-sm text-red-500 animate-in fade-in zoom-in">
                {error}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-x-6 gap-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                className="w-16 h-16 rounded-full text-2xl font-normal"
                disabled={isLoading}
                onClick={() => handleKeyPress(num.toString())}
              >
                {num}
              </Button>
            ))}
            <div />

            <Button
              type="button"
              variant="outline"
              className="w-16 h-16 rounded-full text-2xl font-normal"
              disabled={isLoading}
              onClick={() => handleKeyPress("0")}
            >
              0
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-16 h-16 rounded-full"
              disabled={isLoading || passcode.length === 0}
              onClick={handleDelete}
            >
              <Delete className="size-7 text-primary" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
