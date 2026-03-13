import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";
import { Control, useFieldArray, useWatch } from "react-hook-form";

type StoreMenuOrder = {
  menus: StoreMenu[];
  orders: StoreOrder[];
};

interface OrderItemProps {
  index: number;
  control: Control<StoreMenuOrder>;
}

const OrderItem = ({ index, control }: OrderItemProps) => {
  // Access the nested array inside the specific order
  const { fields } = useFieldArray({
    control,
    name: `orders.${index}.orderItems` as const,
  });
  const menus = useWatch({
    control,
    name: `menus`,
  });

  return (
    <div className="align-top">
      <ul className="list-disc list-inside">
        {fields.map((item) => {
          const menuName = menus.find((m) => m.id === item.menuId)?.name;
          return (
            <li key={item.menuId}>
              {menuName}
              <span className="text-muted-foreground">x {item.amount}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OrderItem;
