import { PublicCustomer } from "@/app/types/customer";
import AlertModal from "@/components/ui/alert-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomerModal } from "@/hooks/use-customer-modal";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useCustomerStore } from "@/app/store/customer-store";

type CustomerActionsProps = {
  customer: PublicCustomer;
};

const CustomerActions = ({ customer }: CustomerActionsProps) => {
  const onOpen = useCustomerModal((state) => state.onOpen);
  const setData = useCustomerModal((state) => state.setData);
  const { deleteCustomer } = useCustomerStore();
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    try {
      deleteCustomer(customer.id);
      toast.success("ลบข้อมูลสำเร็จ");
    } catch {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <>
      <AlertModal
        title={`แน่ใจที่จะลบข้อมูลลูกค้า ${customer.name}?`}
        description={`หากกดยืนยันจะเป็นการยืนยันที่จะลบออเดอร์ของ ${customer.name} หากแน่ใจให้กดปุ่มยืนยันการลบ เมื่อลบแล้วจะไม่สามารถนำกลับคืนมาได้`}
        isOpen={open}
        onClose={() => setOpen(false)}
        deleteFn={handleDelete}
      />
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">เปิดเมนูจัดการ</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                onOpen();
                setData(customer);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>แก้ไขข้อมูล</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => setOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>ลบข้อมูล</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default CustomerActions;
