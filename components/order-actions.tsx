import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useDateStore } from "@/hooks/use-date";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { Loader2, MoreHorizontal, Pencil, Save, Trash2 } from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useSWRConfig } from "swr";
import { z } from "zod";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(50),
  orders: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      amount: z.coerce.number().optional(),
    }),
  ),
  note: z.string().optional(),
  delivery: z.boolean().optional(),
  payment: z.enum(["PENDING", "CASH", "ONLINE", "UNKNOWN"]),
  status: z.enum(["PENDING", "COMPLETED"]),
});

type OrderActionsProps = {
  id: string;
  name: string;
  orders: { name: string; amount: number }[];
  note: string;
  delivery: boolean;
  payment: "PENDING" | "CASH" | "ONLINE" | "UNKNOWN";
  status: "PENDING" | "COMPLETED";
};

const OrderActions = ({
  id,
  name,
  orders,
  delivery,
  note,
  payment,
  status,
}: OrderActionsProps) => {
  const { mutate } = useSWRConfig();
  const { date } = useDateStore();
  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id,
      name,
      orders,
      delivery,
      note,
      payment,
      status,
    },
  });

  React.useEffect(() => {
    form.reset({
      id,
      name,
      orders,
      delivery,
      note,
      payment,
      status,
    });
  }, [id, name, orders, delivery, note, payment, status, form]);

  const { fields } = useFieldArray({
    control: form.control,
    name: "orders", // ← must match Zod path
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formattedValues = {
      id: values.id,
      customerName: values.name,
      note: values.note || "",
      delivery: values.delivery || false,
      paid: values.payment,
      status: values.status,
    };

    try {
      if (form.formState.isDirty) {
        const order = await axios.put("/api/order/", formattedValues);
        console.log("Response: ", order);
        await mutate(`/api/order?date=${formattedDate}`);
        await mutate(`/api/dashboard?date=${formattedDate}`);
      }
    } catch (error) {
      console.log(error);
    }
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
  }
  return (
    <Dialog>
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
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="text-destructive" /> ลบ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขออเดอร์ของ {name}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          หน้าต่างแก้ไขออเดอร์ของแต่ละออเดอร์
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อลูกค้า</FormLabel>
                  <FormControl>
                    <Input placeholder="shadcn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`orders.${index}`}
                  render={({ field }) => {
                    const { value, onChange } = field;
                    return (
                      <FormItem>
                        <FormLabel>{value.name}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={value.name}
                            type="number"
                            value={value.amount}
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
              ))}
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
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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

export default OrderActions;
