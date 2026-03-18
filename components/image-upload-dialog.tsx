import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatOrderPrefix } from "@/lib/utils";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { StreamingContainer } from "./streaming-container";
import { Input } from "./ui/input";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);

    setChunks("");
    setChunks((prev) => prev + "กำลังบีบอัดรูปภาพ... \n");

    try {
      const formData = new FormData();

      const compressionOptions = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.6,
        alwaysKeepResolution: true,
      };

      const compressedImagesPromises = images.map(async (img) => {
        if (img.type.startsWith("image/")) {
          return await imageCompression(img, compressionOptions);
        }
        return img;
      });

      const compressedImages = await Promise.all(compressedImagesPromises);

      compressedImages.forEach((img) => formData.append("images", img));
      console.log("[LOG]: Compression completed");

      setChunks((prev) => prev + "บีบอัดรูปภาพเสร็จสิ้น...\n");
      setChunks((prev) => prev + "กำลังเริ่มต้นอัพโหลดรูปภาพ...\n");

      const response = await fetch("/api/gemini-upload", {
        method: "POST",
        body: formData,
      });
      console.log("[LOG]: Post completed");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      setChunks(
        (prev) =>
          prev + "อัพโหลดรูปภาพเสร็จสิ้น! AI กำลังประมวลผลข้อมูลภาพ...\n",
      );

      while (true) {
        const { done, value } = await reader!.read();
        if (done) {
          const orderJSON: {
            menus: StoreMenu[];
            orders: StoreOrder[];
          } = JSON.parse(result);

          const formattedData = {
            ...orderJSON,
            orders: orderJSON.orders.map((order: StoreOrder) => ({
              ...order,
              customerName: formatOrderPrefix(order.customerName),
              inputName: formatOrderPrefix(order.customerName),
            })),
          };

          sessionStorage.setItem(
            "geminiPreviewData",
            JSON.stringify(formattedData),
          );
          break;
        }
        const chunk = decoder.decode(value);
        result += chunk;
        setChunks(result);
      }

      toast.success("ประมวลผลสำเร็จ! กำลังพาไปหน้าตรวจสอบ");
      router.push("/preview");
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : "Unknown error") ||
          "เกิดข้อผิดพลาด",
      );
      toast.error("เกิดข้อผิดพลาดในการประมวลผล");
    } finally {
      setLoading(false);
    }
  };

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
              <StreamingContainer content={chunks} />
            </div>
            {error && <span className="text-red-500 text-sm">{error}</span>}
            <Button
              onClick={handleSubmit}
              disabled={images.length === 0 || loading}
              variant="default"
            >
              {loading ? "กำลังอัปโหลด..." : "ส่งรูปภาพไปยัง Gemini"}
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              ปิด
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadDialog;
