import z from "zod";
import React from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
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
import { Badge } from "./ui/badge";
import {
  formMenuSchema,
  PublicMenu,
  PostMenu,
  PutMenuItem,
  PatchMenu,
} from "@/app/types/menu";
import { easyDiff } from "@/lib/utils";
import { RemoveDialog } from "./remove-dialog";

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

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      menu: initialData
        ? initialData
        : [{ name: "", amount: null, price: null }],
    },
  });

  const { fields, append, remove } = useFieldArray<z.infer<typeof formSchema>>({
    control: form.control, // control props comes from useForm (optional: if you are using FormProvider)
    name: "menu", // unique name for your Field Array
  });

  // 2. Define a submit handler.
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

          await mutate(`/api/dashboard?date=${formattedDate}`);
          await mutate(`/api/menu?date=${formattedDate}`);
          await mutate(`/api/order?date=${formattedDate}`);

          document.getElementById("closeDialog")?.click();
          console.log(response);
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
          await mutate(`/api/dashboard?date=${formattedDate}`);
          await mutate(`/api/menu?date=${formattedDate}`);
          await mutate(`/api/order?date=${formattedDate}`);
          console.log(response);
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/menu?date=${formattedDate}`);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    } finally {
      await mutate(`/api/dashboard?date=${formattedDate}`);
      await mutate(`/api/menu?date=${formattedDate}`);
      await mutate(`/api/order?date=${formattedDate}`);
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
                      )} หากแน่ใจให้กดปุ่มสีแดง
                      เมื่อยกเลิกแล้วจะไม่สามารถนำกลับคืนมาได้`}
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
