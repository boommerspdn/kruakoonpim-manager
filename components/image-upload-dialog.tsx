import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "react-hot-toast";
import { Input } from "./ui/input";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageUploadDialog: React.FC<ImageUploadDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [images, setImages] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      const geminiRes = await fetch("/api/gemini-upload", {
        method: "POST",
        body: formData,
      });

      if (!geminiRes.ok) throw new Error("Gemini API Error");
      const rawResult = await geminiRes.json();

      sessionStorage.setItem("geminiPreviewData", JSON.stringify(rawResult));

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
        <DialogFooter>
          <div className="flex flex-col w-full gap-2">
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
