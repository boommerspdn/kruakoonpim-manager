"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDateStore } from "@/hooks/use-date";
import { Calendar, Pencil } from "lucide-react";
import { Badge } from "./ui/badge";
import { Menu } from "@/app/generated/prisma";
import MenuForm from "./menu-form";

type MenuEditProps = {
  menu: Menu[];
};

export default function MenuEdit({ menu }: MenuEditProps) {
  const { date } = useDateStore();

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button className="flex px-2">
            <Pencil />
            แก้ไขเมนู
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[725px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              แก้ไขเมนูวันที่
              <Badge>
                <Calendar /> {date?.toLocaleDateString("th-TH")}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              เช็ควันที่ก่อนแก้ไข สามารถลบ เพิ่ม และแก้ไขชื่อ จำนวน หรือราคาได้
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] px-2">
            <MenuForm initialData={menu} />
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
