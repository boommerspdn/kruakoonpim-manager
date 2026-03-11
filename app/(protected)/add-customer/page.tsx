"use client";

import { Plus } from "lucide-react";
import useSWR, { Fetcher } from "swr";

import { CustomerModal } from "@/components/modals/customer-modal";
import { Button } from "@/components/ui/button";
import { useCustomerModal } from "@/hooks/use-customer-modal";
import axios from "axios";
import { PublicCustomer } from "../../types/customer";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export default function CustomerManager() {
  const fetcher: Fetcher<PublicCustomer[], string> = (url) =>
    axios.get(url).then((res) => res.data.data);
  const { data, isLoading } = useSWR("/api/customers", fetcher, {
    fallbackData: [],
  });

  // const { isOpen, toggleModal } = useCustomerDialogState();
  const onOpen = useCustomerModal((state) => state.onOpen);
  const setData = useCustomerModal((state) => state.setData);

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">รายชื่อลูกค้า</h2>
          <p className="text-sm text-muted-foreground">
            จัดการฐานข้อมูลลูกค้าและคำพ้อง (Aliases) ที่ AI มักอ่านผิด
          </p>
        </div>
      </div>
      <CustomerModal />
      {/* <CustomerForm isOpen={isOpen} toggleModal={toggleModal} /> */}
      <Button
        onClick={() => {
          onOpen();
          setData(null);
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> เพิ่มลูกค้าใหม่
      </Button>
      <DataTable columns={columns} data={data} isLoading={isLoading} />
    </div>
  );
}
