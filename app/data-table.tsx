"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconDotsVertical,
  IconGripVertical,
  IconTruck,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

import { z } from "zod";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Check,
  Info,
  PlusCircle,
  SaveAll,
  TableConfigIcon,
} from "lucide-react";
import { useDateStore } from "@/hooks/use-date";
import { format } from "date-fns";
import useSWR from "swr";
import { Menu } from "./generated/prisma";
import { cn, fetcher } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableRowData } from "@/components/dashboard-content";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { OrderBody } from "./api/order/route";
import axios from "axios";
import { toast } from "sonner";

// Finally, the schema for your entire table data (an array of rows)

export const dynamicMenuValueSchema = z.coerce.number().min(0);

export const createPersonSchemaWithDynamicMenu = (menu: Menu[]) => {
  // Start with the fixed properties of your person object
  const baseProperties = {
    name: z.string().min(1),
    note: z.string().optional(),
    delivery: z.boolean().optional(),
  };

  // Dynamically add properties for each menu item's ID
  // This object will hold the key-schema pairs for the dynamic part
  const dynamicProperties: Record<string, z.ZodTypeAny> = {};

  menu.forEach((menuItem) => {
    // For each menu item, use its 'id' as a property key in the schema
    // and assign dynamicMenuValueSchema for its validation.
    // Use .optional() if a menu item might not always be present in the data.
    dynamicProperties[menuItem.id] = dynamicMenuValueSchema;
  });

  // Combine fixed and dynamic properties into a single Zod object schema
  return z.object({ ...baseProperties, ...dynamicProperties });
};

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function DraggableRow({ row }: { row: Row<any[] & { id: string }> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({
  data: initialData,
  menu,
}: {
  data: any[];
  menu: Menu[];
}) {
  const [data, setData] = React.useState(() => initialData);
  const [tableMode, setTableMode] = React.useState<"edit" | "default">(
    "default",
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );
  /// React Hook Form
  const dynamicPersonSchema = React.useMemo(
    () => createPersonSchemaWithDynamicMenu(menu),
    [menu], // Re-generate schema if 'menu' prop changes
  );

  const personSchema = dynamicPersonSchema;

  // And then, a schema for an array of these persons
  const formSchema = z.object({
    // This 'people' key will be the name of your array in the form data
    people: z.array(personSchema),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { people: data },
    mode: "onChange",
  });

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray<
    z.infer<typeof formSchema>
  >({
    control: form.control, // control props comes from useForm (optional: if you are using FormProvider)
    name: "people", // unique name for your Field Array
  });
  // 2. Define a submit handler.
  const { date } = useDateStore();
  const formattedDate = date ? format(date, "yyyy-MM-dd") : null;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data: OrderBody[] = values.people.map((item: any, index) => ({
      customerName: item.name,
      note: item.note || "",
      sortOrder: index,
      delivery: item.delivery || false,
      orderItems: menu.map((orderItem) => ({
        menuId: orderItem.id,
        amount: item[orderItem.id],
      })),
    }));

    try {
      const response = await axios.post(`/api/order?date=${formattedDate}`, data);
      console.log(response)
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  }
  /// React Hook Form

  const columns = React.useMemo<ColumnDef<z.infer<any>>[]>(() => {
    const customColumnSize = 120;
    const customMenuColumns: ColumnDef<z.infer<any>>[] = menu.map(
      (menuItem) => ({
        accessorKey: menuItem.id,
        header: () => (
          <div
            className={`w-[${customColumnSize}px] text-center whitespace-pre-line`}
          >
            {menuItem.name}
          </div>
        ),
        cell: ({ row }) => {
          const currentTableMode = (
            table.options.meta as { tableMode: "edit" | "default" }
          ).tableMode;
          const rowIndex = row.index; // Get the TanStack row index

          const name = `people.${rowIndex}.${menuItem.id}` as any;

          return currentTableMode === "edit" ? (
            <FormField
              control={form.control}
              name={name}
              render={() => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-8"
                      {...form.register(name, { valueAsNumber: true })}
                      placeholder="จำนวน"
                      type="number"
                      defaultValue={0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ) : (
            <div
              className={`w-[${customColumnSize}px] text-center flex items-center gap-2 justify-center`}
            >
              {row.getValue(menuItem.id) == 0 ? "-" : row.getValue(menuItem.id)}
            </div>
          );
        },
        size: customColumnSize, //starting column size
      }),
    );

    return [
      {
        id: "drag",
        size: 10,
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
      },
      {
        id: "select",
        size: 10,
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "ชื่อ",
        cell: ({ row }) => {
          const currentTableMode = (
            table.options.meta as { tableMode: "edit" | "default" }
          ).tableMode;
          const rowIndex = row.index; // Get the TanStack row index

          return currentTableMode === "edit" ? (
            <FormField
              control={form.control}
              name={`people.${rowIndex}.name`}
              render={() => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-8"
                      {...form.register(`people.${rowIndex}.name`)}
                      placeholder="ชื่อลูกค้า"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ) : (
            <div className="flex gap-2">
              {row.original.name}
              <span className="text-destructive"></span>
            </div>
          );
        },
        enableHiding: false,
      },
      ...customMenuColumns,
      {
        id: "confirm",
        size: 15,
        cell: () => {
          const currentTableMode = (
            table.options.meta as { tableMode: "edit" | "default" }
          ).tableMode;
          return (
            <Button
              size={"sm"}
              className={
                currentTableMode === "edit" ? "invisible transition-none" : ""
              }
              disabled={currentTableMode === "edit"}
            >
              <Check />
            </Button>
          );
        },
      },
      {
        id: "payment",
        cell: ({ row }) => (
          <>
            <Label htmlFor={`${row.original.id}-payment`} className="sr-only">
              วิธีจ่ายเงิน
            </Label>
            <Select>
              <SelectTrigger
                className="w-36 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
                size="sm"
                id={`${row.original.id}-payment`}
              >
                <SelectValue placeholder="วิธีจ่ายเงิน" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="cash">เงินสด</SelectItem>
                <SelectItem value="scan">โอน</SelectItem>
                <SelectItem value="unknown">ไม่ได้จ่ายหน้าร้าน</SelectItem>
              </SelectContent>
            </Select>
          </>
        ),
      },
      {
        id: "info",
        size: 20,
        cell: ({ row }) => {
          const currentTableMode = (
            table.options.meta as { tableMode: "edit" | "default" }
          ).tableMode;
          const rowIndex = row.index; // Get the TanStack row index

          return (
            <div className="flex gap-2">
              {currentTableMode === "edit" ? (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size={"icon"}>
                        <Info />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end">
                      <FormField
                        control={form.control}
                        name={`people.${rowIndex}.note`}
                        render={() => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                className="resize-none"
                                {...form.register(`people.${rowIndex}.note`)}
                                placeholder="โน๊ต"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </PopoverContent>
                  </Popover>
                  {/* delivery */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size={"icon"}>
                        <IconTruck />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-fit">
                      <div className="flex gap-2">
                        <Checkbox />
                        <Label>ส่ง</Label>
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              ) : (
                <>
                  {row.original.note && (
                    <Popover>
                      <PopoverTrigger>
                        <Info size={20} className="text-destructive" />
                      </PopoverTrigger>
                      <PopoverContent align="end">
                        {row.original.note}
                      </PopoverContent>
                    </Popover>
                  )}
                  {row.original.delivery && (
                    <IconTruck className="text-primary" />
                  )}
                </>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        size: 10,
        cell: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem>แก้ไข</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">ลบ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
  }, [menu]); // Recreate columns only when `menu` prop changes

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      addNewRow: () => {
        const newId = crypto.randomUUID();

        const dynamicProperties: any = {};
        menu.forEach((menuItem) => {
          dynamicProperties[menuItem.id] = 0;
        });

        const newRow = {
          id: newId,
          name: "",
          ...dynamicProperties,
          delivery: false,
          note: "",
        };
        append(newRow);

        setData((prevData) => [...prevData, newRow]);
      },
      tableMode: tableMode,
      fields,
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((current) => {
        const currentIds = current.map((item) => item.id);
        const oldIndex = currentIds.indexOf(active.id);
        const newIndex = currentIds.indexOf(over.id);

        if (oldIndex === -1 || newIndex === -1) return current;
        return arrayMove(current, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-between">
        <Input
          placeholder="ค้นหาชื่อ"
          type="search"
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-md "
        />
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="delivery">คนส่ง</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="overflow-hidden rounded-lg border">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table className="text-base">
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            style={{ width: `${header.getSize()}px` }}
                            className="py-2 font-medium"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.original.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        ไม่มีผลลัพธ์ของผู้ซื้อ
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          <div
            className={cn(
              "flex justify-end",
              tableMode === "edit" && "justify-between",
            )}
          >
            {tableMode === "edit" && (
              <Button
                type="button"
                className="w-fit place-self-end"
                variant={"secondary"}
                onClick={(e) => {
                  table.options.meta?.addNewRow();
                  e.preventDefault();
                }}
              >
                <PlusCircle /> เพิ่มบรรทัด
              </Button>
            )}

            {tableMode === "default" ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setTableMode((prev) =>
                    prev === "default" ? "edit" : "default",
                  );
                }}
              >
                <TableConfigIcon />
                แก้ไขตารางออเดอร์
              </Button>
            ) : (
              <Button type="submit">
                <SaveAll /> บันทึกตารางออเดอร์
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
