import { MenuSummary } from "@/app/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArchiveRestore,
  Box,
  ChartColumnDecreasing,
  CircleCheck,
  Hourglass,
  ShoppingCart,
} from "lucide-react";

type SectionCardsProps = {
  data: MenuSummary[] | undefined;
};

export function SectionCards({ data }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {data?.map((menu, index) => (
        <Card className="@container/card" key={index}>
          <CardHeader>
            <CardTitle className="flex justify-between text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              <h2>{menu.name}</h2>
              <h2 className="text-primary">{menu.price}฿</h2>
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
              <span className="font-medium">เหลือ</span>
              <div className="flex gap-2 text-2xl items-center">
                <ChartColumnDecreasing />
                <span className="text-[#00bb86]">{menu.menuData.sellable}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">เอาไปแล้ว</span>
              <div className="flex gap-2 text-2xl items-center">
                <CircleCheck />
                <span className="text-[#008431]">{menu.menuData.picked}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">ยังไม่มาเอา</span>
              <div className="flex gap-2 text-2xl items-center">
                <Hourglass />
                <span className="text-[#F28C28]">{menu.menuData.unpicked}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">ต้องมีหน้าร้าน</span>
              <div className="flex gap-2 text-2xl items-center">
                <ArchiveRestore />
                <span className="text-destructive">
                  {menu.menuData.require}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
