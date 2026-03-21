"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import MenuForm from "./menu-form";
import { Badge } from "./ui/badge";
import { PublicMenu } from "@/app/types/menu";

type MenuEditProps = {
  menu: PublicMenu[];
};

export default function MenuEdit({ menu }: MenuEditProps) {
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
              แก้ไขเมนูวันนี้
              <Badge>Demo Mode</Badge>
            </DialogTitle>
            <DialogDescription>
              สามารถลบ เพิ่ม และแก้ไขชื่อ จำนวน หรือราคาได้
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
