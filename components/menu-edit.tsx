"use client";

import { Menu } from "@/app/generated/prisma";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDateStore } from "@/hooks/use-date";
import { Calendar, Pencil } from "lucide-react";
import MenuForm from "./menu-form";
import { Badge } from "./ui/badge";
import { useTableModeStore } from "@/hooks/use-table-mode";

type MenuEditProps = {
  menu: Menu[];
};

export default function MenuEdit({ menu }: MenuEditProps) {
  const { date } = useDateStore();
  const { tableMode } = useTableModeStore();

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button className="flex px-2" disabled={tableMode === "edit"}>
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
