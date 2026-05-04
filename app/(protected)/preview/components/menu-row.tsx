import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
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
    <TableRow key={field.id} className="border-b">
      <TableCell className="py-3">
        <Input
          placeholder="เช่น ข้าวผัดหมู"
          className="bg-white"
          {...register(`menus.${index}.name`)}
        />
      </TableCell>
      <TableCell className="py-3">
        <div className="relative border-e-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ฿
          </span>
          <Input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            className="pl-8 bg-white"
            min={0}
            placeholder="0.00"
            {...register(`menus.${index}.price`)}
          />
        </div>
      </TableCell>
      <TableCell className="py-3">
        <Input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          className="bg-white"
          min={0}
          placeholder="0"
          {...register(`menus.${index}.amount`)}
        />
      </TableCell>
    </TableRow>
  );
};

export default MenuRow;
