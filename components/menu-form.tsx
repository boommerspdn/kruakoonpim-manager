import {
  formMenuSchema,
  PatchMenu,
  PostMenu,
  PublicMenu,
  PutMenuItem,
} from "@/app/types/menu";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
import { easyDiff } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { CircleMinus, Loader2, PlusCircle, Save, Trash } from "lucide-react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useSWRConfig } from "swr";
import z from "zod";
import { RemoveDialog } from "./remove-dialog";
import { Badge } from "./ui/badge";

type MenuForm = {
  initialData?: PublicMenu[];
};

const formSchema = formMenuSchema;

const MenuForm = ({ initialData }: MenuForm) => {
  const { date } = useDateStore();
  const { mutate } = useSWRConfig();
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      menu: initialData
        ? initialData
        : [{ name: "", amount: null, price: null }],
    },
  });

  const { fields, append, remove } = useFieldArray<z.infer<typeof formSchema>>({
    control: form.control,
    name: "menu",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (form.formState.isDirty) {
        if (initialData) {
          const formatInitial: PutMenuItem =
            initialData?.map((item, index) => ({
              id: item.id || "",
              name: item.name || "",
              amount: item.amount || 0,
              price: item.price || 0,
              sortOrder: index,
            })) || [];

          const putItem: PutMenuItem = values.menu.map((item, index) => ({
            id: item.id || "",
            name: item.name || "",
            amount: item.amount || 0,
            price: item.price || 0,
            sortOrder: index,
          }));

          const findDifference = easyDiff(formatInitial, putItem);
          const PatchData: PatchMenu = findDifference;

          const response = await axios.patch(
            `/api/menu?date=${formattedDate}`,
            PatchData,
          );
          toast.success("แก้ไขเมนูเสร็จสิ้น");
          console.log(response);

          document.getElementById("closeDialog")?.click();
        } else {
          const postData: PostMenu = values.menu.map((item) => ({
            name: item.name || "",
            amount: item.amount || 0,
            price: item.price || 0,
          }));

          const response = await axios.post(
            `/api/menu?date=${formattedDate}`,
            postData,
          );
          toast.success("สร้างเมนูเสร็จสิ้น");

          console.log(response);
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    } finally {
      await mutate(`/api/dashboard?date=${formattedDate}`);
      await mutate(`/api/menu?date=${formattedDate}`);
      await mutate(`/api/order?date=${formattedDate}`);
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/menu?date=${formattedDate}`);
      await mutate(`/api/dashboard?date=${formattedDate}`);
      await mutate(`/api/menu?date=${formattedDate}`);
      await mutate(`/api/order?date=${formattedDate}`);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-6">
        {fields.map((field, index) => (
          <FormField
            key={field.id}
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
                      autoFocus
                    />
                    <Input
                      {...form.register(`menu.${index}.amount`)}
                      className="w-28"
                      type="number"
                      min={0}
                      placeholder="จำนวน"
                    />
                    <div className="relative">
                      <Input
                        {...form.register(`menu.${index}.price`)}
                        className="w-28"
                        type="number"
                        min={0}
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
                        if (fields.length === 1) return;
                        remove(index);
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
            onClick={() => append({ name: "", amount: null, price: null })}
            disabled={form.formState.isSubmitting || deleteLoading}
          >
            <PlusCircle /> เพิ่มบรรทัด
          </Button>
          <div className="flex gap-2">
            {initialData && (
              <>
                <RemoveDialog
                  title="แน่ใจที่จะลบเมนู?"
                  description={`หากกดยืนยันจะเป็นการยืนยันที่จะลบเมนูวันที่ 
                      ${date?.toLocaleDateString(
                        "th-TH",
                      )} หากแน่ใจให้กดปุ่มยืนยันการลบ
                      เมื่ลบแล้วจะไม่สามารถนำกลับคืนมาได้`}
                  deleteFn={handleDelete}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={"outline"}
                      type="button"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash />
                      )}
                      ลบเมนู
                    </Button>
                  </AlertDialogTrigger>
                </RemoveDialog>
              </>
            )}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
            >
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
