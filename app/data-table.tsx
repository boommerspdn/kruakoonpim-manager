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
import { IconGripVertical } from "@tabler/icons-react";
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

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import OrderForm from "@/components/order-form";
import TableAction from "@/components/table-actions";
import { Badge } from "@/components/ui/badge";
import { DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { PublicMenu } from "./types/menu";
import {
  OrderStatus,
  Payment,
  publicOrderSchema,
} from "./types/order";
import { useDashboardStore } from "./store/dashboard-store";

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

function DraggableRow({
  row,
}: {
  row: Row<z.infer<typeof publicOrderSchema> & { id: string }>;
}) {
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
  data: z.infer<typeof publicOrderSchema>[];
  menu: PublicMenu[];
}) {
  const { updateOrder, deleteOrder } = useDashboardStore();
  const [data, setData] = React.useState(() => initialData);
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [selectedTab, setSelectedTab] = React.useState("all");

  React.useEffect(() => {
    if (selectedTab === "delivery") {
      table.setColumnFilters([{ id: "delivery", value: true }]);
    } else if (selectedTab === "pending") {
      table.setColumnFilters([{ id: "status", value: "PENDING" }]);
    } else if (selectedTab === "completed") {
      table.setColumnFilters([{ id: "status", value: "COMPLETED" }]);
    } else {
      table.setColumnFilters([]); // Clear all
    }
  }, [selectedTab]);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      status: false,
      delivery: false,
    });
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
  const [searchValue, setSearchValue] = React.useState("");

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      table.getColumn("customerName")?.setFilterValue(searchValue);
    }, 300); // delay in ms

    return () => clearTimeout(timeout); // cancel previous
  }, [searchValue]);

  const columns = React.useMemo<
    ColumnDef<z.infer<typeof publicOrderSchema>>[]
  >(() => {
    const customMenuColumns: ColumnDef<z.infer<typeof publicOrderSchema>>[] =
      menu.map((menuItem) => ({
        accessorKey: menuItem.id,
        header: () => (
          <div className={`text-center whitespace-pre-line line-clamp-2`}>
            {menuItem.name}
          </div>
        ),
        cell: ({ row }) => {
          const status = row.original.status;

          const orderItemIndex = row.original.orderItems.findIndex(
            (item) => item.menuId === menuItem.id,
          );
          const existingOrderItem =
            orderItemIndex !== -1
              ? row.original.orderItems[orderItemIndex]
              : undefined;

          return (
            <div
              className={cn(
                `text-center flex items-center gap-2 justify-center`,
                status === "COMPLETED" ? "text-destructive line-through" : "",
              )}
            >
              {existingOrderItem?.amount}
            </div>
          );
        },
      }));

    return [
      {
        id: "drag",
        size: 0,
        header: () => null,
        cell: ({ row }) => {
          return <DragHandle id={row.original.id} />;
        },
      },
      {
        accessorKey: "customerName",
        header: "ชื่อ",
        cell: ({ row }) => {
          const status = row.original.status;

          return (
            <div
              className={cn(
                "flex gap-2 items-center w-[200px] xl:w-[130px]",
                status === "COMPLETED" ? "line-through text-destructive" : "",
              )}
            >
              {row.original.customerName}
              <span className="text-destructive text-sm">
                {row.original.totalPrice}฿
              </span>
            </div>
          );
        },
        enableHiding: false,
      },
      ...customMenuColumns,
      {
        id: "actions",
        cell: ({ row }) => {
          return (
            <div className="w-[250px]">
              <TableAction
                key={row.original.id}
                rowData={row.original}
                menu={menu}
                handleConfirm={handleConfirm}
                handlePayment={handlePayment}
                handleDelete={handleDelete}
              />
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        enableHiding: true,
        enableSorting: false,
        header: () => null,
        cell: () => null,
      },
      {
        id: "delivery",
        accessorKey: "delivery",
        enableHiding: true,
        enableSorting: false,
        header: () => null,
        cell: () => null,
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
      columnFilters,
      columnVisibility,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);
      const reorderedData = arrayMove(data, oldIndex, newIndex);
      setData(reorderedData);

      // Update sortOrder in store for all affected items
      reorderedData.forEach((item, index) => {
        updateOrder(item.id, { sortOrder: index });
      });
    }
  }

  const handleConfirm = async (id: string, status: OrderStatus) => {
    try {
      const order = data.find(item => item.id === id);
      if (order) {
        updateOrder(id, { status });
        
        setData((current) =>
          current.map((item) =>
            item.id === id ? { ...item, status } : item,
          ),
        );
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  };

  const handlePayment = async (id: string, payment: Payment) => {
    try {
      updateOrder(id, { payment });
      
      setData((current) =>
        current.map((item) =>
          item.id === id ? { ...item, payment } : item,
        ),
      );
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setData((current) => current.filter((item) => item.id !== id));
      deleteOrder(id);
      toast.success("ลบออเดอร์เสร็จสิ้น");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  };

  const allCount = data.length;

  const deliveryCount = React.useMemo(() => {
    return data.filter((row) => row.delivery === true).length;
  }, [data]);

  const pendingCount = React.useMemo(() => {
    return data.filter((row) => row.status === "PENDING").length;
  }, [data]);

  const completedCount = React.useMemo(() => {
    return data.filter((row) => row.status === "COMPLETED").length;
  }, [data]);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
        <div className="flex gap-2 items-center w-full">
          <Input
            placeholder="ค้นหาชื่อ"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onFocus={() => {
              setSelectedTab("all");
              setSearchValue("");
            }}
            className="max-w-md lg:max-w-lg "
          />
          <Button
            type="button"
            variant={"secondary"}
            onClick={() => {
              setSelectedTab("all");
              setSearchValue("");
            }}
          >
            ล้าง
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start h-auto p-1 overflow-x-auto overflow-y-hidden whitespace-nowrap custom-scrollbar">
              <TabsTrigger value="all">
                ทั้งหมด <Badge>{allCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="delivery">
                ลูกค้าที่ต้องส่ง
                <Badge>{deliveryCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                ลูกค้าที่ยังไม่มาเอา
                <Badge>{pendingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed">
                ลูกค้าที่มาเอาไปแล้ว
                <Badge>{completedCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <OrderForm
            mode="CREATE"
            initialData={{
              id: undefined,
              customerName: "",
              date: new Date(),
              orderItems: menu.map((menuItem) => ({
                menuId: menuItem.id,
                menuName: menuItem.name,
                amount: undefined,
              })),
              note: "",
              status: "PENDING",
              delivery: false,
              payment: undefined,
            }}
            menu={menu}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusCircle />
                เพิ่มออเดอร์
              </Button>
            </DialogTrigger>
          </OrderForm>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <div className="h-[80vh] relative overflow-auto">
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
              <TableBody className="**:data-[slot=table-cell]:first:w-8 border-b">
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
                      ไม่มีผลลัพธ์
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
