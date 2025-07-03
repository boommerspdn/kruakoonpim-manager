"use client";

import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDateStore } from "@/hooks/use-date";
import menuApi from "../public/kruakoonpim_menu_API.json";

import { useState } from "react";
import MenuForm from "./menu-form";
import Image from "next/image";

const MenuPrompt = () => {
  const [randomItems, setRandomItems] = useState<{ name: string }[]>([]);
  const { date } = useDateStore();

  const getRandomItems = () => {
    // Shuffle the array and pick first 10
    const shuffled = [...menuApi].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 13);
    setRandomItems(selected);
  };

  return (
    <div className="grid grid-cols-2 gap-12 h-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-medium">เพิ่มเมนูวันที่</h1>
          <Badge className="h-fit px-2">
            <Calendar />
            {date?.toLocaleDateString("th-TH")}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          รายการวันนี้ยังไม่ได้เพิ่ม ใส่ชื่อเมนูแล้วกดยืนยันด้านล่างได้เลย
        </p>
        <MenuForm />
      </div>
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-2 place-items-center">
          <div className="flex flex-col items-end">
            <span className="text-4xl text-nowrap">แม่คิดเมนูไม่ออกเลย</span>
            <span className="text-muted-foreground text-end">
              ลองกดสุ่มดูเลย กดได้เรื่อยๆเลยจ้า :DD
            </span>
            <Button className="w-fit mt-4" onClick={() => getRandomItems()}>
              สุ่มรายการอาหาร
            </Button>
          </div>
          <div className="w-full h-[300px] relative">
            <Image
              src="/pim.png"
              alt=""
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-2 space-x-2 overflow-y-auto">
          {randomItems.map((item, index) => (
            <Badge key={index} className="text-base">
              {item.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuPrompt;
