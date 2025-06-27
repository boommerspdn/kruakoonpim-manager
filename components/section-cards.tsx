import { IconCash, IconCreditCard, IconInputX } from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Box,
  ChartColumnDecreasing,
  CircleCheck,
  Hourglass,
  ShoppingCart,
  Star,
} from "lucide-react";
import { Menu } from "@/app/generated/prisma";

type SectionCardsProps = {
  data: Menu[] | undefined;
};

export function SectionCards({ data }: SectionCardsProps) {
  const randBuyer = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.map((menu, index) => (
        <Card className="@container/card" key={index}>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex justify-between">
              <h2>
                {menu.name} {menu.price}฿
              </h2>
              <div className="flex flex-col items-end text-primary">
                <h2>{menu.amount - 5}</h2>
                <span className="text-base text-nowrap">ยังไม่มาเอา</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-y-4">
            <div className="flex flex-col gap-1">
              <span className="font-medium">ยอดทั้งหมด</span>
              <div className="flex gap-2 text-2xl items-center ">
                <Box />
                <span className="text-[#1E5FE0]">{menu.amount}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">ยอดสั่งซื้อ</span>
              <div className="flex gap-2 text-2xl items-center">
                <ShoppingCart />
                <span className="text-[#FF57E9]">{menu.amount}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">ขายหน้าร้านได้</span>
              <div className="flex gap-2 text-2xl items-center">
                <ChartColumnDecreasing />
                <span className="text-[#6B7280]">{menu.amount}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">เอาไปแล้ว</span>
              <div className="flex gap-2 text-2xl items-center">
                <CircleCheck />
                <span className="text-[#16A34A]">{menu.amount}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">ต้องมีหน้าร้าน</span>
              <div className="flex gap-2 text-2xl items-center">
                <Hourglass />
                <span className="text-destructive">{menu.amount}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">เมนูพิเศษ</span>
              <div className="flex gap-2 text-2xl items-center">
                <Star />
                <span className="text-[#F28C28]">{menu.amount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {/* <Card className="@container/card">
        <CardHeader>
          <CardDescription>ยอดเงินวันนี้</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ฿4,415
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <div className="line-clamp-1 flex gap-1 font-medium">
              <IconCash />
              เงินสด
            </div>
            <div className="text-muted-foreground">1,650฿</div>
          </div>
          <div className="flex justify-between">
            <div className="line-clamp-1 flex gap-1 font-medium">
              <IconCreditCard />
              โอน
            </div>
            <div className="text-muted-foreground">2,250฿</div>
          </div>
          <div className="flex justify-between">
            <div className="line-clamp-1 flex gap-1 font-medium">
              <IconInputX />
              ไม่ได้จ่ายหน้าร้าน
            </div>
            <div className="text-muted-foreground">515฿</div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
