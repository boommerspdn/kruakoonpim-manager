"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  MoreHorizontal,
  Edit,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Customer } from "@/app/types/customer";
import { toast } from "react-hot-toast";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch data");
  return json.data;
};

export default function CustomerManager() {
  const {
    data: customers = [],
    isLoading,
    mutate,
  } = useSWR<Customer[]>("/api/customers", fetcher, {
    onError: (err) => {
      toast.error(err.message || "ไม่สามารถดึงข้อมูลลูกค้าได้");
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editAliases, setEditAliases] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aliases.some((alias) =>
        alias.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const handleAddCustomer = () => {
    if (!newCustomerName.trim()) return;

    const addCustomerPromise = fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCustomerName.trim() }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add customer");
      return data.data;
    });

    toast.promise(addCustomerPromise, {
      loading: "กำลังบันทึก...",
      success: (newCustomerFromDB) => {
        mutate([...customers, newCustomerFromDB], false);
        setNewCustomerName("");
        setIsAddDialogOpen(false);
        mutate();
        return "เพิ่มลูกค้าสำเร็จ!";
      },
      error: (err) => err.message,
    });
  };

  const openEditDialog = (customer: Customer) => {
    setCustomerToEdit(customer);
    setEditName(customer.name);
    setEditAliases(customer.aliases.join(", "));
  };

  const handleSaveEdit = () => {
    if (!customerToEdit || !editName.trim()) return;

    const updatedAliasesArray = editAliases
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const editPromise = fetch(`/api/customers/${customerToEdit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        aliases: updatedAliasesArray,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update customer");
      return data.data;
    });

    toast.promise(editPromise, {
      loading: "กำลังอัปเดต...",
      success: (updatedCustomer) => {
        mutate(
          customers.map((c) =>
            c.id === updatedCustomer.id ? updatedCustomer : c,
          ),
          false,
        );
        setCustomerToEdit(null);
        mutate();
        return "อัปเดตข้อมูลสำเร็จ!";
      },
      error: (err) => err.message,
    });
  };

  const confirmDelete = () => {
    if (!customerToDelete) return;
    const { id } = customerToDelete;

    const deletePromise = fetch(`/api/customers/${id}`, {
      method: "DELETE",
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete customer");
      return id;
    });

    toast.promise(deletePromise, {
      loading: "กำลังลบ...",
      success: (deletedId) => {
        mutate(
          customers.filter((c) => c.id !== deletedId),
          false,
        );
        mutate();
        return "ลบข้อมูลสำเร็จ!";
      },
      error: (err) => err.message,
    });

    setCustomerToDelete(null);
  };

  return (
    <div className="p-6 space-y-6 bg-white rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">รายชื่อลูกค้า</h2>
          <p className="text-sm text-muted-foreground">
            จัดการฐานข้อมูลลูกค้าและคำพ้อง (Aliases) ที่ AI มักอ่านผิด
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> เพิ่มลูกค้าใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
              <DialogDescription>
                พิมพ์ชื่อลูกค้าที่ถูกต้องเพื่อเพิ่มเข้าสู่ระบบ
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">ชื่อลูกค้า</Label>
                <Input
                  id="name"
                  placeholder="เช่น P'สมชาย"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomer()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleAddCustomer}
                disabled={!newCustomerName.trim()}
              >
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาชื่อลูกค้า หรือ Aliases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border max-w-[800px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">ชื่อลูกค้าหลัก</TableHead>
              <TableHead className="border-e-0">คำที่ AI มักอ่านผิด</TableHead>
              <TableHead className="w-[80px] border-e-0 text-center">
                จัดการ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>กำลังโหลดข้อมูล...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="border-e-0">
                    {customer.aliases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {customer.aliases.map((alias, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="font-normal"
                          >
                            {alias}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="border-e-0 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">เปิดเมนูจัดการ</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(customer)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>แก้ไขข้อมูล</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCustomerToDelete(customer)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>ลบข้อมูล</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  ไม่พบข้อมูลลูกค้า
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={customerToEdit !== null}
        onOpenChange={(open) => !open && setCustomerToEdit(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
            <DialogDescription>
              อัปเดตชื่อหลัก หรือเพิ่ม/ลบ Aliases
              (คั่นแต่ละคำด้วยเครื่องหมายจุลภาค <b>,</b>)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">ชื่อลูกค้าหลัก</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-aliases">คำที่ AI มักอ่านผิด</Label>
              <Input
                id="edit-aliases"
                placeholder="เช่น Ton, โอค, P'เอียด"
                value={editAliases}
                onChange={(e) => setEditAliases(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerToEdit(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>
              อัปเดตข้อมูล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={customerToDelete !== null}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบข้อมูล?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะลบรายชื่อ{" "}
              <strong>{`"${customerToDelete?.name}"`}</strong> ออกจากระบบ
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบข้อมูล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
