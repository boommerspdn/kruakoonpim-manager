import { PreviewOrder } from "@/app/(protected)/preview/_page";
import { memo, useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";

const NameCombobox = memo(function OrderCustomerCell({
  order,
  customerNamesList,
  onUpdate,
}: {
  order: PreviewOrder;
  customerNamesList: string[];
  onUpdate: (newName: string) => void;
}) {
  const [localValue, setLocalValue] = useState(
    order.matchResult?.isExactMatch === true ? order.inputName : "",
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== order.inputName) {
        onUpdate(localValue);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localValue, order.inputName, onUpdate]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground decoration-slate-300">
          ชื่อในรูป: {order.customerName}
        </span>
        <Badge
          variant="outline"
          className={
            order.statusColor === "green"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }
        >
          {order.statusColor === "green" ? "มีในระบบ" : "ไม่มีในระบบ"}
        </Badge>
      </div>

      <Combobox
        items={customerNamesList}
        value={localValue}
        onValueChange={(val) => {
          if (!val) return;
          setLocalValue(val);
        }}
      >
        <ComboboxInput
          placeholder="พิมพ์หรือเลือกชื่อลูกค้า..."
          onChange={(e) => setLocalValue(e.target.value)}
          className={
            order.statusColor !== "green"
              ? "border-blue-400 focus-visible:ring-blue-400 bg-blue-50/30"
              : "border-green-400 focus-visible:ring-green-400"
          }
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
    </div>
  );
});

export default NameCombobox;
