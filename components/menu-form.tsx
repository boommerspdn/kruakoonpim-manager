import { Menu } from "@/app/generated/prisma";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useDateStore } from "@/hooks/use-date";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns"; // or your preferred formatter
import { CircleMinus, Loader2, PlusCircle, Save, Trash } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import z from "zod";
import { Badge } from "./ui/badge";

type MenuForm = {
  initialData?: Menu[];
};

const formSchema = z.object({
  menu: z
    .array(
      z.object({
        name: z.string().min(1, "จำเป็นต้องใส่ชื่อเมนู"),
        amount: z.coerce.number().min(1).nullish(),
        price: z.coerce.number().min(1).nullish(),
      }),
    )
    .min(1),
});

const MenuForm = ({ initialData }: MenuForm) => {
  const { date } = useDateStore();
  const { mutate } = useSWRConfig();

  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      menu: initialData
        ? initialData
        : [{ name: "", amount: undefined, price: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray<z.infer<typeof formSchema>>({
    control: form.control, // control props comes from useForm (optional: if you are using FormProvider)
    name: "menu", // unique name for your Field Array
  });
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (initialData) {
        const data = values.menu.map((item, index) => ({
          id: initialData[index] ? initialData[index].id : undefined,
          name: item.name,
          amount: item.amount,
          price: item.price,
          sortOrder: index,
        }));
        await axios.put(`/api/menu?date=${formattedDate}`, data);
        document.getElementById("closeDialog")?.click();
      } else {
        await axios.post(`/api/menu?date=${formattedDate}`, values);
        form.reset();
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    } finally {
      await mutate(`/api/menu?date=${formattedDate}`);
      await mutate(`/api/dashboard?date=${formattedDate}`);
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/menu?date=${formattedDate}`);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    } finally {
      await mutate(`/api/menu?date=${formattedDate}`);
      await mutate(`/api/dashboard?date=${formattedDate}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-6">
        {fields.map((_field, index) => (
          <FormField
            key={_field.id}
            control={form.control}
            name="menu"
            render={() => (
              <FormItem>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary w-12 h-auto py-0.5 text-white flex justify-center items-center text-center">
                      {index + 1}
                    </div>
                    <Input
                      {...form.register(`menu.${index}.name`)}
                      className="w-full"
                      placeholder="ชื่อเมนู"
                    />
                    <Input
                      {...form.register(`menu.${index}.amount`)}
                      className="w-28"
                      type="number"
                      placeholder="จำนวน"
                    />
                    <div className="relative">
                      <Input
                        {...form.register(`menu.${index}.price`)}
                        className="w-28"
                        type="number"
                        placeholder="ราคา"
                      />
                      <Badge className="absolute top-1/2 right-[8px] transform  -translate-y-1/2 pointer-events-none">
                        ฿
                      </Badge>
                    </div>
                    <CircleMinus
                      className="text-primary cursor-pointer"
                      size={40}
                      onClick={() => {
                        if (fields.length != 1) {
                          remove(index);
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <div className="flex justify-between">
          <Button
            type="button"
            className="w-fit place-self-end"
            variant={"secondary"}
            onClick={() =>
              append({ name: "", amount: undefined, price: undefined })
            }
            disabled={form.formState.isSubmitting}
          >
            <PlusCircle /> เพิ่มบรรทัด
          </Button>
          <div className="flex gap-2">
            {initialData && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant={"outline"} type="button">
                    <Trash />
                    ลบเมนู
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>แน่ใจที่จะลบเมนู?</AlertDialogTitle>
                    <AlertDialogDescription>
                      หากกดยืนยันจะเป็นการยืนยันที่จะลบเมนูวันที่{" "}
                      {date?.toLocaleDateString("th-TH")} หากแน่ใจให้กดปุ่มสีแดง
                      เมื่อยกเลิกแล้วจะไม่สามารถนำกลับคืนมาได้
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete()}
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash />
                      )}
                      ลบเมนู
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save />
              )}
              บันทึกรายการ
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default MenuForm;
