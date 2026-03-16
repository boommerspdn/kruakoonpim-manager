import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFormRegister,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import OrderItem from "./order-items";
import { cn } from "@/lib/utils";

type StoreMenuOrder = {
  menus: StoreMenu[];
  orders: StoreOrder[];
};

interface OrderItemProps {
  index: number;
  control: Control<StoreMenuOrder>;
  setValue: UseFormSetValue<StoreMenuOrder>;
  field: FieldArrayWithId<StoreMenuOrder, "orders">;
  customers: string[];
  register: UseFormRegister<StoreMenuOrder>;
  siimilarNames: string[] | null;
}

const OrderRow = ({
  index,
  control,
  field,
  setValue,
  customers,
  register,
  siimilarNames,
}: OrderItemProps) => {
  const customerName = useWatch({
    control,
    name: `orders.${index}.inputName`,
  });

  const isExist = customers.find((c) => c === customerName);

  return (
    <div
      key={field.id}
      className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4 py-4"
    >
      <div className="align-top space-y-2">
        <Controller
          name={`orders.${index}.inputName`}
          control={control}
          render={({ fieldState }) => (
            <>
              <div className="flex gap-2 w-full">
                <Combobox
                  items={customers}
                  value={customerName}
                  onValueChange={(val) => {
                    if (!val) return;
                    setValue(`orders.${index}.inputName`, val, {
                      shouldValidate: true,
                    });
                  }}
                >
                  <ComboboxInput
                    placeholder="พิมพ์หรือเลือกชื่อลูกค้า..."
                    enterKeyHint="next"
                    onChange={(e) =>
                      setValue(`orders.${index}.inputName`, e.target.value, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "w-[400px]",
                      `${!isExist ? "border-blue-400 focus-visible:ring-blue-400" : fieldState.error ? "border-red-400 focus-visible:ring-red-400" : "border-green-400 focus-visible:ring-green-400"}`,
                    )}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>
                      ไม่พบชื่อนี้ (ระบบจะสร้างเป็นลูกค้าใหม่)
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <Button
                  type="button"
                  variant={"secondary"}
                  onClick={() => {
                    setValue(`orders.${index}.inputName`, "");
                  }}
                >
                  ล้าง
                </Button>
              </div>

              {fieldState.error && (
                <p className="text-red-500 text-xs">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />

        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-muted-foreground">ชื่อที่ใกล้เคียง: </span>
          {siimilarNames
            ? siimilarNames.map((siimilarName) => {
                if (siimilarName === field.customerName) return null;
                return (
                  <Button
                    key={siimilarName}
                    type="button"
                    className="h-5 text-xs rounded-md"
                    onClick={() =>
                      setValue(`orders.${index}.inputName`, siimilarName)
                    }
                  >
                    {siimilarName}
                  </Button>
                );
              })
            : "-"}
        </div>
      </div>
      <OrderItem index={index} control={control} />
      <div className="align-top">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name={`orders.${index}.delivery`}
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="isDelivery"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor={`delivery-${index}`}>ส่ง</Label>
          </div>

          <div>
            <Textarea
              placeholder="เพิ่มหมายเหตุ..."
              enterKeyHint="next"
              {...register(`orders.${index}.note` as const)}
              className="resize-none h-[60px] text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderRow;
