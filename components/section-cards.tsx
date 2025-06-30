import { MenuSummary } from "@/app/api/dashboard/route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Box,
  ChartColumnDecreasing,
  CircleCheck,
  Hourglass,
  ShoppingCart,
  Star,
} from "lucide-react";

type SectionCardsProps = {
  data: MenuSummary[] | undefined;
};

export function SectionCards({ data }: SectionCardsProps) {
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
                <h2>{menu.menuData.unpicked}</h2>
                <span className="text-base text-nowrap">ยังไม่มาเอา</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-y-4">
            <div className="flex flex-col gap-1">
              <span className="font-medium">ยอดทั้งหมด</span>
              <div className="flex gap-2 text-2xl items-center ">
                <Box />
                <span className="text-[#1E5FE0]">{menu.menuData.total}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">ยอดสั่งซื้อ</span>
              <div className="flex gap-2 text-2xl items-center">
                <ShoppingCart />
                <span className="text-[#FF57E9]">{menu.menuData.ordered}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">ขายหน้าร้านได้</span>
              <div className="flex gap-2 text-2xl items-center">
                <ChartColumnDecreasing />
                <span className="text-[#6B7280]">{menu.menuData.sellable}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">เอาไปแล้ว</span>
              <div className="flex gap-2 text-2xl items-center">
                <CircleCheck />
                <span className="text-[#16A34A]">{menu.menuData.picked}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">ต้องมีหน้าร้าน</span>
              <div className="flex gap-2 text-2xl items-center">
                <Hourglass />
                <span className="text-destructive">
                  {menu.menuData.require}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">เมนูพิเศษ</span>
              <div className="flex gap-2 text-2xl items-center">
                <Star />
                <span className="text-[#F28C28]">{menu.menuData.special}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
