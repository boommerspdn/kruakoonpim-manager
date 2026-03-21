import { PublicMenu } from "@/app/types/menu";
import {
  CreateOrder,
  OrderStatus,
  Payment,
  PublicOrder,
} from "@/app/types/order";
import { IconTruck } from "@tabler/icons-react";
import { Check, Info, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import OrderForm from "./order-form";
import { RemoveDialog } from "./remove-dialog";
import { AlertDialogTrigger } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { DialogTrigger } from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type TableActionProps = {
  rowData: PublicOrder;
  menu: PublicMenu[];
  handleConfirm: (id: string, status: OrderStatus) => void;
  handlePayment: (id: string, payment: Payment) => void;
  handleDelete: (id: string) => void;
};

const TableAction = ({
  rowData,
  menu,
  handleConfirm,
  handlePayment,
  handleDelete,
}: TableActionProps) => {
  const initialData: CreateOrder = {
    id: rowData.id,
    customerName: rowData.customerName,
    delivery: rowData.delivery,
    note: rowData.note,
    status: rowData.status,
    payment: rowData.payment ?? undefined,
    orderItems: menu.map((menuItem) => {
      const findOrder = rowData.orderItems.find(
        (orderItem) => orderItem.menuId === menuItem.id,
      );

      return {
        id: findOrder?.id,
        menuId: menuItem.id,
        menuName: menuItem.name,
        amount: findOrder?.amount || undefined,
      };
    }),
  };

  return (
    <div className="grid grid-cols-8 gap-3 pe-2 w-full">
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
          onValueChange={(value) => handlePayment(rowData.id, value as Payment)}
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
        {rowData.delivery && <IconTruck className="text-primary" />}
      </div>

      <OrderForm initialData={initialData} mode="EDIT">
        <RemoveDialog
          title={`แน่ใจที่จะลบออเดอร์ของ ${rowData.customerName}?`}
          description={`หากกดยืนยันจะเป็นการยืนยันที่จะลบออเดอร์ของ ${rowData.customerName} หากแน่ใจให้กดปุ่มยืนยันการลบ
                      เมื่ลบแล้วจะไม่สามารถนำกลับคืนมาได้`}
          deleteFn={() => handleDelete(rowData.id)}
        >
          <DropdownMenu>
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
          </DropdownMenu>
        </RemoveDialog>
      </OrderForm>
      {rowData.note && (
        <div className="col-span-8">
          <span className="text-destructive flex items-center gap-2">
            <Info size={20} className="text-destructive" /> {rowData.note}
          </span>
        </div>
      )}
    </div>
  );
};

export default TableAction;
