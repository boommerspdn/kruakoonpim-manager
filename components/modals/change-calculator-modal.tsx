"use client";

import { useChangeCalculatorModal } from "@/hooks/use-change-calculator-modal";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { RefreshCcw } from "lucide-react";

const BANKNOTES = [5, 10, 20, 50, 100, 500, 1000] as const;

function CalculatorContent({ totalPrice, onClose }: { totalPrice: number; onClose: () => void }) {
  const [paid, setPaid] = useState<number | "">("");
  const change = typeof paid === "number" ? paid - totalPrice : null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="ใส่จำนวนเงินที่รับ"
            value={paid}
            onChange={(e) => {
              const v = e.target.value;
              setPaid(v === "" ? "" : Number(v));
            }}
            className="text-lg"
          />
          <Button variant="secondary" onClick={() => setPaid("")}>
            <RefreshCcw />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {BANKNOTES.map((note) => (
            <Button
              key={note}
              variant="outline"
              onClick={() =>
                setPaid((prev) =>
                  typeof prev === "number" ? prev + note : note,
                )
              }
            >
              +{note}
            </Button>
          ))}
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-1">เงินทอน</p>
          <p
            className={`text-5xl font-bold tabular-nums ${
              change !== null && change < 0
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {change !== null ? `${change}฿` : "—"}
          </p>
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild className="w-full">
          <Button>ปิด</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

export const ChangeCalculatorModal = () => {
  const { isOpen, onClose, data } = useChangeCalculatorModal();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{`คำนวณเงินทอน — ${data?.customerName ?? ""}`}</DialogTitle>
          <DialogDescription>{`ยอดรวม ${data?.totalPrice ?? 0}฿`}</DialogDescription>
        </DialogHeader>
        <CalculatorContent
          key={`${data?.customerName}-${data?.totalPrice}`}
          totalPrice={data?.totalPrice ?? 0}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
