"use client";

import Link from "next/link";
import { DatePickerForm } from "./date-picker";
import { LogoutButton } from "./logout-button";
import { Button } from "./ui/button";
import { Home, UserPlus } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="grid grid-cols-3 place-items-center w-full border-b gap-1 px-4 lg:gap-2 lg:px-6 h-16 py-3">
      <div className="place-self-start space-x-2">
        <Link href={"/"}>
          <Button variant={"outline"} size={"icon"}>
            <Home />
          </Button>
        </Link>
        <Link href={"/add-customer"}>
          <Button variant={"outline"} size={"icon"}>
            <UserPlus />
          </Button>
        </Link>
      </div>
      <DatePickerForm />
      <LogoutButton />
    </header>
  );
}
