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
import { useDateStore } from "@/hooks/use-date";
import { cn } from "@/lib/utils";
import axios from "axios";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { PublicMenu } from "./types/menu";
import {
  OrderStatus,
  Payment,
  publicOrderSchema,
  RowSwapBody,
} from "./types/order";

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

  const { date } = useDateStore();
  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const { mutate } = useSWRConfig();

  const columns = React.useMemo<
    ColumnDef<z.infer<typeof publicOrderSchema>>[]
  >(() => {
    const customColumnSize = 110;
    const customMenuColumns: ColumnDef<z.infer<typeof publicOrderSchema>>[] =
      menu.map((menuItem) => ({
        accessorKey: menuItem.id,
        header: () => (
          <div className={`w-auto text-center whitespace-pre-line`}>
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
                `w-[${customColumnSize}px] text-center flex items-center gap-2 justify-center`,
                status === "COMPLETED" ? "text-destructive line-through" : "",
              )}
            >
              {existingOrderItem?.amount}
            </div>
          );
        },
        size: customColumnSize, //starting column size
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
        size: 110,
        cell: ({ row }) => {
          const status = row.original.status;

          return (
            <div
              className={cn(
                "flex gap-2 items-center",
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
        size: 300,
        cell: ({ row }) => {
          return (
            <TableAction
              key={row.original.id}
              rowData={row.original}
              menu={menu}
              handleConfirm={handleConfirm}
              handlePayment={handlePayment}
              handleDelete={handleDelete}
            />
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
  }, [menu, date]); // Recreate columns only when `menu` prop changes

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
      setData((data) => {
        return arrayMove(data, oldIndex, newIndex);
      });

      const body: RowSwapBody = {
        active: active.id as string,
        over: over.id as string,
      };

      try {
        const response = await axios.put("/api/order/swap-row", body);
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    }
  }

  const handleConfirm = async (id: string, status: OrderStatus) => {
    try {
      setData((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: item.status === "COMPLETED" ? "PENDING" : "COMPLETED",
              }
            : item,
        ),
      );

      const response = await axios.put(
        `/api/order/confirm?id=${id}&status=${status}`,
      );

      // await mutate(`/api/order?date=${formattedDate}`);
      await mutate(`/api/dashboard?date=${formattedDate}`);
      console.log(response);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  };

  const handlePayment = async (id: string, payment: Payment) => {
    try {
      setData((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                payment: payment,
              }
            : item,
        ),
      );

      const response = await axios.put(
        `/api/order/payment?id=${id}&payment=${payment}`,
      );
      console.log(response);

      // await mutate(`/api/order?date=${formattedDate}`);
      await mutate(`/api/dashboard?date=${formattedDate}`);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setData((current) => current.filter((item) => item.id !== id));
      const response = await axios.delete(`/api/order?id=${id}`);

      await mutate(`/api/order?date=${formattedDate}`);
      await mutate(`/api/dashboard?date=${formattedDate}`);
      toast.success("ลบออเดอร์เสร็จสิ้น");
      console.log(response);
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
      <div className="flex justify-between">
        <div className="w-[600px] space-x-2 flex">
          <Input
            placeholder="ค้นหาชื่อ"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onFocus={() => {
              setSelectedTab("all");
              setSearchValue("");
            }}
            className="max-w-md "
          />
        </div>
        <div className="flex gap-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">
                ทั้งหมด <Badge>{allCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="delivery">
                คนส่ง
                <Badge>{deliveryCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                คนที่ยังไม่มาเอา
                <Badge>{pendingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed">
                คนที่มาเอาไปแล้ว
                <Badge>{completedCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <OrderForm
            mode="CREATE"
            initialData={{
              id: undefined,
              customerName: "",
              date: date,
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
