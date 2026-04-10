import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Control, useWatch, UseFormSetValue } from "react-hook-form";

type StoreMenuOrder = {
  menus: StoreMenu[];
  orders: StoreOrder[];
};

interface OrderItemProps {
  index: number;
  control: Control<StoreMenuOrder>;
  setValue: UseFormSetValue<StoreMenuOrder>;
}

const OrderItem = ({ index, control, setValue }: OrderItemProps) => {
  const menus = useWatch({ control, name: "menus" });
  const orderItems = useWatch({
    control,
    name: `orders.${index}.orderItems`,
  });

  const amountByMenuId = new Map(
    (orderItems ?? []).map((item) => [item.menuId, item.amount]),
  );

  const handleAmountChange = (menuId: string, raw: string) => {
    const amount = raw === "" ? 0 : parseInt(raw, 10) || 0;
    const next = menus
      .map((m) => ({
        menuId: m.id,
        amount: m.id === menuId ? amount : (amountByMenuId.get(m.id) ?? 0),
      }))
      .filter((item) => item.amount > 0);

    setValue(`orders.${index}.orderItems`, next, { shouldDirty: true });
  };

  return (
    <div className="align-top">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {menus.map((menu) => {
          const amount = amountByMenuId.get(menu.id) ?? 0;
          const hasValue = amount > 0;

          return (
            <div
              key={menu.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1 transition-colors",
                hasValue ? "" : "opacity-50",
              )}
            >
              <span
                className={cn(
                  "text-sm truncate flex-1",
                  hasValue ? "font-medium" : "text-muted-foreground",
                )}
                title={menu.name}
              >
                {menu.name}
              </span>
              <Input
                type="number"
                min={0}
                value={hasValue ? amount : ""}
                placeholder="-"
                onChange={(e) => handleAmountChange(menu.id, e.target.value)}
                className="w-16 h-7 text-center text-sm px-1"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderItem;
