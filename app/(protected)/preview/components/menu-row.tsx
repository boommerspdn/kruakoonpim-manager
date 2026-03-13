import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";
import { Input } from "@/components/ui/input";
import { FieldArrayWithId, UseFormRegister } from "react-hook-form";

type StoreMenuOrder = {
  menus: StoreMenu[];
  orders: StoreOrder[];
};

interface OrderItemProps {
  index: number;
  field: FieldArrayWithId<StoreMenuOrder, "menus">;
  register: UseFormRegister<StoreMenuOrder>;
}

const MenuRow = ({ index, field, register }: OrderItemProps) => {
  return (
    <tr key={field.id} className="border-b last:border-0 hover:bg-slate-50">
      <td className="p-4 pe-0 md:p-4">
        <Input
          placeholder="เช่น ข้าวผัดหมู"
          className="bg-white"
          {...register(`menus.${index}.name`)}
        />
      </td>
      <td className="p-1 pe-0 md:p-4">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-muted-foreground">
            ฿
          </span>
          <Input
            type="number"
            className="pl-8 bg-white"
            min={0}
            placeholder="0.00"
            {...register(`menus.${index}.price`)}
          />
        </div>
      </td>
      <td className="p-1 pe-4 md:p-4">
        <Input
          type="number"
          className="bg-white"
          min={0}
          placeholder="0"
          {...register(`menus.${index}.amount`)}
        />
      </td>
    </tr>
  );
};

export default MenuRow;
