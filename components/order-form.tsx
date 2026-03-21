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
import { cn, easyDiff } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Truck } from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
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
import { useDashboardStore } from "@/app/store/dashboard-store";

// Helper function to generate unique IDs
const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

type OrderFormProps = {
  children: React.ReactNode;
  initialData: CreateOrder;
  mode: "EDIT" | "CREATE";
  menu?: PublicMenu[];
};

const formSchema = createOrderSchema;

const OrderForm = ({ children, initialData, mode, menu }: OrderFormProps) => {
  const { addOrder, orders } = useDashboardStore();

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
  }, [form, defaultValues]);

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [menu, form, defaultValues]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (form.formState.isDirty) {
        if (mode === "CREATE") {
          // Calculate the next sort order
          const maxSortOrder = Math.max(...orders.map(o => o.sortOrder || 0), -1) + 1;
          
          // Calculate total price
          const totalPrice = values.orderItems.reduce((sum, item) => {
            const menuItem = menu?.find(m => m.id === item.menuId);
            return sum + ((menuItem?.price || 0) * (item.amount || 0));
          }, 0);

          addOrder({
            ...values,
            sortOrder: maxSortOrder,
            totalPrice,
            delivery: values.delivery || false,
            note: values.note || "",
            orderItems: values.orderItems.map(item => ({
              id: item.id || generateUniqueId('item'),
              menuId: item.menuId,
              amount: item.amount || 0,
            })),
          });

          form.reset(defaultValues);
          toast.success("เพิ่ม/แก้ไขออเดอร์สำเร็จ");
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  }

  return (
    <Dialog modal={true}>
      {children}
      <DialogContent className="sm:max-w-[95%] !self-start mt-10 !translate-y-0">
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
            <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>ชื่อลูกค้า</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="พิมพ์ชื่อลูกค้า..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>โน๊ต</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="หมายเหตุ"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      <FormLabel className="text-sm font-normal">
                        <Truck className="text-destructive" /> ส่ง
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />
            <div
              className={
                "grid grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4"
              }
            >
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

            <div
              className={cn(
                "grid grid-cols-3 gap-4",
                mode === "CREATE" ? "hidden" : null,
              )}
            >
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
