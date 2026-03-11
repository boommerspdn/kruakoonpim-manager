"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PublicCustomer } from "../../types/customer";
import { Badge } from "@/components/ui/badge";
import CustomerActions from "@/components/customer-actions";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<PublicCustomer>[] = [
  {
    accessorKey: "name",
    header: "ชื่อลูกค้า",
    size: 200,
  },
  {
    accessorKey: "aliases",
    header: "ชื่อที่ AI มักอ่านผิด",
    cell: ({ row }) => {
      const aliases = row.original.aliases;

      if (aliases.length > 0) {
        return aliases.map((a) => <Badge key={a}>{a}</Badge>);
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;

      return <CustomerActions customer={customer} />;
    },
  },
];
