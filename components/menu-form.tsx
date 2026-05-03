import {
  formMenuSchema,
  PatchMenu,
  PostMenu,
  PublicMenu,
  PublicMenuName,
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
import { swrKeys } from "@/lib/swr-keys";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { CircleMinus, Loader2, PlusCircle, Save, Trash } from "lucide-react";
import React, { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import useSWR, { Fetcher, useSWRConfig } from "swr";
import z from "zod";
import { RemoveDialog } from "./remove-dialog";
import { Badge } from "./ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";

type MenuForm = {
  initialData?: PublicMenu[];
};

const formSchema = formMenuSchema;

const MenuForm = ({ initialData }: MenuForm) => {
  const { date } = useDateStore();
  const { mutate: globalMutate } = useSWRConfig();
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const fetcher: Fetcher<PublicMenuName[], string> = (url) =>
    axios.get(url).then((res) => res.data);
  const { data: menuNames } = useSWR("/api/menu/name", fetcher);

  const getMenuNames = useMemo(
    () => menuNames?.map((menu) => menu.name),
    [menuNames],
  );

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
    if (!form.formState.isDirty) return;
    try {
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

        await axios.patch(`/api/menu?date=${formattedDate}`, PatchData);
        toast.success("แก้ไขเมนูเสร็จสิ้น");
        document.getElementById("closeDialog")?.click();

        globalMutate(swrKeys.menu(date));
        globalMutate(swrKeys.orders(date));
        globalMutate(swrKeys.dashboard(date));
      } else {
        const postData: PostMenu = values.menu.map((item) => ({
          name: item.name || "",
          amount: item.amount || 0,
          price: item.price || 0,
        }));

        await axios.post(`/api/menu?date=${formattedDate}`, postData);
        toast.success("สร้างเมนูเสร็จสิ้น");

        globalMutate(swrKeys.menu(date));
        globalMutate(swrKeys.dashboard(date));
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

      await globalMutate(swrKeys.menu(date), async () => [], {
        optimisticData: [],
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      });
      await globalMutate(swrKeys.orders(date), async () => [], {
        optimisticData: [],
        rollbackOnError: true,
        revalidate: false,
        populateCache: true,
      });
      globalMutate(swrKeys.dashboard(date));
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
                  <div className="grid w-full grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
                    <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-full bg-primary py-0.5 text-center text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <Combobox
                        items={getMenuNames}
                        value={form.watch(`menu.${index}.name`) || ""}
                        onValueChange={(value) => {
                          if (!value) return;
                          form.setValue(`menu.${index}.name`, value);
                        }}
                      >
                        <ComboboxInput
                          className="w-full min-w-0"
                          placeholder="พิมพ์หรือเลือกชื่อเมนู."
                          onChange={(e) =>
                            form.setValue(`menu.${index}.name`, e.target.value, {
                              shouldDirty: true,
                            })
                          }
                          autoFocus
                        />
                        <ComboboxContent className={"pointer-events-auto"}>
                          <ComboboxEmpty>
                            ไม่พบชื่อเมนูนี้ (ระบบจะสร้างเป็นเมนูใหม่)
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
                    <Input
                      {...form.register(`menu.${index}.amount`)}
                      className="min-w-0 w-full"
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={0}
                      placeholder="จำนวน"
                    />
                    <div className="relative min-w-0 w-full">
                      <Input
                        {...form.register(`menu.${index}.price`)}
                        className="min-w-0 w-full pr-9"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min={0}
                        placeholder="ราคา"
                      />
                      <Badge className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 transform">
                        ฿
                      </Badge>
                    </div>
                    <CircleMinus
                      className="shrink-0 cursor-pointer text-primary"
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
