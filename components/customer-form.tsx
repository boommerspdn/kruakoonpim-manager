import { PublicCustomer } from "@/app/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { create } from "zustand";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export type DialogState<T> = {
  isOpen: boolean;
  toggleModal: () => void;
  data: T | null;
  setData: (object: T) => void;
};

export const useCustomerDialogState = create<DialogState<PublicCustomer>>(
  (set) => ({
    isOpen: false,
    toggleModal: () =>
      set((state: DialogState<PublicCustomer>) => ({ isOpen: !state.isOpen })),
    data: null,
    setData: (data: PublicCustomer) => set(() => ({ data: data })),
  }),
);

const CustomerForm = (
  props: Pick<DialogState<PublicCustomer>, "isOpen" | "data" | "toggleModal">,
) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.toggleModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
          <DialogDescription>
            อัปเดตชื่อหลัก หรือเพิ่ม/ลบ Aliases
            (คั่นแต่ละคำด้วยเครื่องหมายจุลภาค <b>,</b>)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">ชื่อลูกค้าหลัก</Label>
            <Input
              id="edit-name"
              //   value={}
              //   onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-aliases">คำที่ AI มักอ่านผิด</Label>
            <Input
              id="edit-aliases"
              placeholder="เช่น Ton, โอค, P'เอียด"

              // onChange={(e) => setEditAliases(e.target.value)}
              // onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">ยกเลิก</Button>
          </DialogClose>
          <Button
          // onClick={handleSaveEdit} disabled={!editName.trim()}
          >
            อัปเดตข้อมูล
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerForm;
