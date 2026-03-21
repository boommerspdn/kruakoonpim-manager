import {
  formMenuSchema,
  PublicMenu,
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
import { easyDiff } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleMinus, Loader2, PlusCircle, Save, Trash } from "lucide-react";
import React, { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import z from "zod";
import { RemoveDialog } from "./remove-dialog";
import { Badge } from "./ui/badge";
import { useDashboardStore } from "@/app/store/dashboard-store";

type MenuForm = {
  initialData?: PublicMenu[];
};

const formSchema = formMenuSchema;

const MenuForm = ({ initialData }: MenuForm) => {
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const { menus, updateMenu, addMenu, deleteMenu, resetToDefault } = useDashboardStore();

  // Get unique menu names from current menus for combobox
  const getMenuNames = useMemo(
    () => menus?.map((menu) => menu.name) || [],
    [menus],
  );

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
          // Update existing menus
          values.menu.forEach((item, index) => {
            const existingMenu = initialData[index];
            if (existingMenu) {
              updateMenu(existingMenu.id, {
                name: item.name || "",
                amount: item.amount || 0,
                price: item.price || 0,
                sortOrder: index,
              });
            }
          });
          
          // Add new menus if any
          if (values.menu.length > initialData.length) {
            for (let i = initialData.length; i < values.menu.length; i++) {
              const item = values.menu[i];
              addMenu({
                name: item.name || "",
                amount: item.amount || 0,
                price: item.price || 0,
                sortOrder: i,
                date: new Date(),
              });
            }
          }
          
          toast.success("แก้ไขเมนูเสร็จสิ้น");
          document.getElementById("closeDialog")?.click();
        } else {
          // Create new menus
          values.menu.forEach((item, index) => {
            addMenu({
              name: item.name || "",
              amount: item.amount || 0,
              price: item.price || 0,
              sortOrder: index,
              date: new Date(),
            });
          });
          toast.success("สร้างเมนูเสร็จสิ้น");
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
      // Delete all menus for today
      menus.forEach(menu => deleteMenu(menu.id));
      toast.success("ลบเมนูเสร็จสิ้น");
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
                      placeholder="ชื่อเมนู"
                      className="flex-1"
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
                      <Badge className="absolute top-1/2 right-[8px] transform -translate-y-1/2 pointer-events-none">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            className="w-fit place-self-end"
            variant={"secondary"}
            onClick={() => append({ name: "", amount: null, price: null })}
            disabled={form.formState.isSubmitting || deleteLoading}
          >
            <PlusCircle /> เพิ่มบรรทัด
          </Button>
          <div className="flex gap-2 justify-end sm:justify-start">
            {initialData && (
              <>
                <RemoveDialog
                  title="แน่ใจที่จะลบเมนู?"
                  description={`หากกดยืนยันจะเป็นการยืนยันที่จะลบเมนูวันนี้ทั้งหมด เมื่อลบแล้วจะไม่สามารถนำกลับคืนมาได้`}
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
