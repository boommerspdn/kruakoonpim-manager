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
} from "lucide-react";

type SectionCardsProps = {
  data: { menuName: string; amount: number; price: number }[];
};

export function SectionCards({ data }: SectionCardsProps) {
  const randBuyer = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {data.map((menu, index) => (
        <Card className="@container/card" key={index}>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {menu.menuName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <div className="line-clamp-1 flex gap-1 font-medium">
                <Box />
                ยอดทั้งหมด
              </div>
              <div className="text-muted-foreground">{menu.amount}</div>
            </div>
            <div className="flex justify-between">
              <div className="line-clamp-1 flex gap-1 font-medium">
                <ShoppingCart />
                ยอดสั่งซื้อ
              </div>
              <div className="text-muted-foreground">
                {menu.amount - randBuyer}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="line-clamp-1 flex gap-1 font-medium">
                <ChartColumnDecreasing />
                จำนวนเหลือที่ขายหน้าร้านได้
              </div>
              <div className="text-muted-foreground">
                {menu.amount - (menu.amount - randBuyer)}
              </div>
            </div>
            <div className="flex justify-between">
              <div className="line-clamp-1 flex gap-1 font-medium">
                <CircleCheck />
                ลูกค้าเอาไปแล้ว
              </div>
              <div className="text-muted-foreground">5</div>
            </div>
            <div className="flex justify-between">
              <div className="line-clamp-1 flex gap-1 font-medium">
                <Hourglass />
                ต้องมีหน้าร้าน
              </div>
              <div className="text-muted-foreground">
                {menu.amount - randBuyer - 5}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="@container/card">
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
      </Card>
    </div>
  );
}
