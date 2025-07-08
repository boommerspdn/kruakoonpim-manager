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
import { easyDiff } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { Loader2, Save, Trash2 } from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
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

type OrderFormProps = {
  children: React.ReactNode;
  initialData: CreateOrder;
  mode: "EDIT" | "CREATE";
};

const formSchema = createOrderSchema;

const OrderForm = ({ children, initialData, mode }: OrderFormProps) => {
  const { date } = useDateStore();
  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const { mutate } = useSWRConfig();

  const defaultValues: CreateOrder = initialData;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields } = useFieldArray<z.infer<typeof formSchema>>({
    control: form.control,
    name: "orderItems",
  });

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    try {
      if (form.formState.isDirty) {
        if (mode === "CREATE") {
          const response = await axios.post(
            `/api/order?date=${formattedDate}`,
            values,
          );
          toast.success("เพิ่ม/แก้ไขออเดอร์สำเร็จ");
          console.log(response);
          await mutate(`/api/order?date=${formattedDate}`);
          await mutate(`/api/dashboard?date=${formattedDate}`);
        }
        if (mode === "EDIT") {
          const formatOrderItems = initialData.orderItems.map((orderItem) => ({
            ...orderItem,
            id: orderItem.id || "",
          }));
          const removeInitialZero = formatOrderItems.filter(
            (orderItem) => !!orderItem.amount,
          );
          const formatValues = values.orderItems.map((orderItem) => ({
            ...orderItem,
            id: orderItem.id || "",
          }));
          const removeZeroValues = formatValues.filter(
            (orderItem) => !!orderItem.amount,
          );

          const findDifference = easyDiff(removeInitialZero, removeZeroValues);

          const patchData = {
            id: values.id,
            customerName: values.customerName,
            delivery: values.delivery,
            note: values.note,
            payment: values.payment,
            status: values.status,
            orderItems: findDifference,
          };

          const response = await axios.patch(
            `/api/order?id=${values.id}`,
            patchData,
          );
          toast.success("เพิ่ม/แก้ไขออเดอร์สำเร็จ");
          console.log(response);
          await mutate(`/api/order?date=${formattedDate}`);
          await mutate(`/api/dashboard?date=${formattedDate}`);
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  }

  return (
    <Dialog>
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
                    <Input placeholder="กรอกชื่อลูกค้า" {...field} />
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
                        value={field.value || ""}
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
              <div className="flex justify-between w-full">
                <Button type="button" variant={"secondary"}>
                  <Trash2 className="text-destructive" /> ลบรายการ
                </Button>
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
