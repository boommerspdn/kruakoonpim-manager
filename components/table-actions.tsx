import { OrderStatus, Payment, PublicOrder } from "@/app/types/order";
import { IconTruck } from "@tabler/icons-react";
import { Check, Info, X } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type TableActionProps = {
  rowData: PublicOrder;
  handleConfirm: (id: string, status: OrderStatus) => void;
  handlePayment: (id: string, payment: Payment) => void;
};

const TableAction = ({
  rowData,
  handleConfirm,
  handlePayment,
}: TableActionProps) => {
  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="grid grid-cols-8 gap-3 pe-2">
        <Button
          size={"default"}
          onClick={() => {
            handleConfirm(
              rowData.id,
              rowData.status === "COMPLETED" ? "PENDING" : "COMPLETED",
            );
          }}
          type="button"
          variant={rowData.status === "COMPLETED" ? "secondary" : "default"}
        >
          {rowData.status === "COMPLETED" ? <X /> : <Check />}
        </Button>
        <div className="col-span-4">
          <Label htmlFor={`${rowData.id}-payment`} className="sr-only">
            วิธีจ่ายเงิน
          </Label>
          <Select
            value={rowData.payment || undefined}
            onValueChange={(value) =>
              handlePayment(rowData.id, value as Payment)
            }
            defaultValue={rowData.payment || undefined}
          >
            <SelectTrigger
              className="w-full **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="default"
              id={`${rowData.id}-payment`}
            >
              <SelectValue placeholder="วิธีจ่ายเงิน" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="CASH">เงินสด</SelectItem>
              <SelectItem value="ONLINE">โอน</SelectItem>
              <SelectItem value="UNKNOWN">ไม่ได้จ่ายหน้าร้าน</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center col-span-2">
          {rowData.note && (
            <Popover>
              <PopoverTrigger>
                <Info size={20} className="text-destructive" />
              </PopoverTrigger>
              <PopoverContent align="end">{rowData.note}</PopoverContent>
            </Popover>
          )}
          {rowData.delivery && <IconTruck className="text-primary" />}
        </div>

        {/* <OrderForm initialData={initialData} mode="EDIT">
          <RemoveDialog
            title={`แน่ใจที่จะลบออเดอร์ของ ${rowData.customerName}?`}
            description={`หากกดยืนยันจะเป็นการยืนยันที่จะลบออเดอร์ของ ${rowData.customerName} หากแน่ใจให้กดปุ่มยืนยันการลบ
                      เมื่ลบแล้วจะไม่สามารถนำกลับคืนมาได้`}
            deleteFn={handleDelete}
          > */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DialogTrigger asChild>
              <DropdownMenuItem>
                <Pencil /> แก้ไข
              </DropdownMenuItem>
            </DialogTrigger>

            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="text-destructive" /> ลบ
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu> */}
        {/* </RemoveDialog>
        </OrderForm> */}
      </div>
    </div>
  );
};

export default TableAction;
