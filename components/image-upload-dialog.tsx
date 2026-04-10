import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGeminiStream } from "@/hooks/use-gemini-stream";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { StreamingContainer } from "./streaming-container";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PREVIEW_SESSION_KEY = "geminiPreviewData";

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSavedPreview, setHasSavedPreview] = useState(false);
  const router = useRouter();

  const { startUpload, isStreaming, progressMessages, firstPageReady, error } =
    useGeminiStream();

  const handleSubmit = () => {
    if (images.length === 0) return;
    startUpload(images);
  };

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(PREVIEW_SESSION_KEY);
      setHasSavedPreview(Boolean(raw?.trim()));
    } catch {
      setHasSavedPreview(false);
    }
  }, [open]);

  const goToSavedPreview = () => {
    onOpenChange(false);
    router.push("/preview");
  };

  useEffect(() => {
    if (firstPageReady) {
      toast.success("ประมวลผลสำเร็จ! กำลังพาไปหน้าตรวจสอบ");
      router.push("/preview");
    }
  }, [firstPageReady, router]);

  useEffect(() => {
    if (error) {
      toast.error("เกิดข้อผิดพลาดในการประมวลผล");
    }
  }, [error]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArr = Array.from(files);
    setImages(fileArr);
    setCurrentIndex(0);
    const urls = fileArr.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const chunks = progressMessages.join("\n");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>อัปโหลดรูปภาพเมนู</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 w-full">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          {previewUrls.length > 0 && (
            <div className="flex flex-col items-center w-full">
              <div className="relative w-60 h-60 mb-2 flex items-center justify-center border rounded bg-muted">
                <img
                  src={previewUrls[currentIndex]}
                  alt={`preview-${currentIndex}`}
                  className="object-contain w-full h-full rounded"
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                  disabled={currentIndex === 0}
                >
                  ก่อนหน้า
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} ใน {previewUrls.length} รูปภาพทั้งหมด
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(i + 1, previewUrls.length - 1),
                    )
                  }
                  disabled={currentIndex === previewUrls.length - 1}
                >
                  ถัดไป
                </Button>
              </div>
              <div className="flex gap-1">
                {previewUrls.map((url, idx) => (
                  <button
                    key={idx}
                    className={`w-3 h-3 rounded-full border ${idx === currentIndex ? "bg-primary" : "bg-muted"}`}
                    style={{
                      outline:
                        idx === currentIndex ? "2px solid #6366f1" : undefined,
                    }}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`ดูรูปที่ ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="w-full">
          <div className="flex flex-col w-full gap-2">
            <div className="w-full">
              <StreamingContainer content={chunks} isLoading={isStreaming} />
            </div>
            {error && <span className="text-red-500 text-sm">{error}</span>}
            <Button
              onClick={handleSubmit}
              disabled={images.length === 0 || isStreaming}
              variant="default"
            >
              {isStreaming ? "กำลังอัปโหลด..." : "ส่งรูปภาพไปยัง Gemini"}
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              ปิด
            </Button>
            <Separator className="my-2" />
            {hasSavedPreview && (
            <Badge
              asChild
              variant="secondary"
              className="h-auto w-full max-w-full cursor-pointer justify-center whitespace-normal px-3 py-2 text-center text-xs font-normal leading-snug hover:bg-secondary/80"
            >
              <button
                type="button"
                onClick={goToSavedPreview}
                className="inline-flex w-full items-center justify-center text-pretty outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                มีข้อมูลตรวจสอบจากครั้งก่อนอยู่แล้ว ไม่ต้องสแกนใหม่ — แตะเพื่อไปหน้าตรวจสอบ
              </button>
            </Badge>
          )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog;
