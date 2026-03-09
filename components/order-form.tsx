import { Customer } from "@/app/types/customer";
import { PublicMenu } from "@/app/types/menu";
import { CreateOrder, createOrderSchema } from "@/app/types/order";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDateStore } from "@/hooks/use-date";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Save } from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import useSWR, { useSWRConfig } from "swr";
import { z } from "zod";
import { Checkbox } from "./ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";
import axios from "axios";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.data;
};

type OrderFormProps = {
  children: React.ReactNode;
  initialData: CreateOrder;
  mode: "EDIT" | "CREATE";
  menu?: PublicMenu[];
};

interface OrderItem {
  menuId: string;
  amount: number;
  menu: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  customerName: string;
  delivery?: boolean;
  note?: string;
  payment?: string;
  status: string;
  date: string;
  totalPrice: number;
  orderItems: OrderItem[];
}

const formSchema = createOrderSchema;

const OrderForm = ({ children, initialData, mode, menu }: OrderFormProps) => {
  const { date } = useDateStore();
  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const { mutate } = useSWRConfig();

  const { data: customers } = useSWR<Customer[]>("/api/customers", fetcher);
  const customerNameList = customers?.map((c) => c.name) || [];

  const defaultValues = initialData;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields } = useFieldArray<z.infer<typeof formSchema>>({
    control: form.control,
    name: "orderItems",
  });

  React.useEffect(() => {
    if (mode === "EDIT") {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, mode]);

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [date, form, defaultValues]);

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [menu, form, defaultValues]);

  const calculateOptimisticTotal = (
    orderItems: z.infer<typeof formSchema>["orderItems"],
  ) => {
    return orderItems.reduce((sum, item) => {
      const menuPrice = menu?.find((m) => m.id === item.menuId)?.price || 0;
      return sum + Number(item.amount || 0) * menuPrice;
    }, 0);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (form.formState.isDirty) {
        await axios.post(`/api/order?date=${formattedDate}`, values);

        const orderKey = `/api/order?date=${formattedDate}`;
        const optimisticTotalPrice = calculateOptimisticTotal(
          values.orderItems,
        );
        const optimisticOrderData: Order = {
          id: mode === "EDIT" ? (values.id as string) : `temp-${Date.now()}`,
          customerName: values.customerName,
          delivery: values.delivery,
          note: values.note,
          payment: values.payment,
          status: values.status,
          date: formattedDate,
          totalPrice: optimisticTotalPrice,
          orderItems: values.orderItems
            .map((item) => ({
              menuId: item.menuId,
              amount: Number(item.amount || 0),
              menu: {
                name: item.menuName,
                price: menu?.find((m) => m.id === item.menuId)?.price || 0,
              },
            }))
            .filter((item) => item.amount > 0),
        };
        mutate<Order[]>(
          orderKey,
          (currentOrders = []) => {
            if (mode === "CREATE") {
              return [...currentOrders, optimisticOrderData];
            } else {
              return currentOrders.map((o) =>
                o.id === values.id ? { ...o, ...optimisticOrderData } : o,
              );
            }
          },
          false,
        );
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.error(error);
    } finally {
      await Promise.all([
        mutate(`/api/order?date=${formattedDate}`),
        mutate(`/api/dashboard?date=${formattedDate}`),
      ]);
    }
  }

  return (
    <Dialog modal={true}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "EDIT"
              ? `แก้ไขออเดอร์ของ ${initialData.customerName}`
              : "เพิ่มออเดอร์"}
          </DialogTitle>
          <DialogDescription>
            ใส่ชื่อและจำนวนของแต่ละออเดอร์จากนั้นกดปุ่มบันทึกรายการ
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อลูกค้า</FormLabel>
                  <FormControl>
                    <div>
                      <Combobox
                        items={customerNameList}
                        {...field}
                        value={field.value || ""}
                        onValueChange={(value) => {
                          if (!value) return;
                          field.onChange(value);
                        }}
                      >
                        <ComboboxInput
                          placeholder="พิมพ์หรือเลือกชื่อลูกค้า..."
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        <ComboboxContent className={"pointer-events-auto"}>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              {fields.map((field, index) => {
                return (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`orderItems.${index}`}
                    render={({ field }) => {
                      const { value, onChange } = field;
                      const findAmount = initialData?.orderItems.find(
                        (orderItem) => orderItem.menuId === value.menuId,
                      )?.amount;

                      return (
                        <FormItem>
                          <FormLabel className="min-h-8">
                            {value.menuName}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={value.menuName}
                              type="number"
                              min={0}
                              defaultValue={findAmount?.toString()}
                              onChange={(e) =>
                                onChange({ ...value, amount: e.target.value })
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                );
              })}
            </div>
            <Separator />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>โน๊ต</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="หมายเหตุ"
                      className="resize-none h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วิธีจ่ายเงิน</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="วิธีจ่ายเงิน" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">เงินสด</SelectItem>
                          <SelectItem value="ONLINE">โอน</SelectItem>
                          <SelectItem value="UNKNOWN">
                            ไม่ได้จ่ายหน้าร้าน
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานะ</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="สถานะ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="COMPLETED">มาเอาไปแล้ว</SelectItem>
                          <SelectItem value="PENDING">ยังไม่มาเอา</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1 flex items-center pt-5">
                <FormField
                  control={form.control}
                  name={`delivery`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">ส่ง</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    !form.formState.isDirty || form.formState.isSubmitting
                  }
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save />
                  )}
                  บันทึกรายการ
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
