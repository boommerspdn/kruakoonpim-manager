"use client";

import Link from "next/link";
import { DatePickerForm } from "./date-picker";
import { LogoutButton } from "./logout-button";
import { Button } from "./ui/button";
import { Home, Settings, UserPlus } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="flex justify-between w-full border-b gap-1 px-4 lg:gap-2 lg:px-6 h-16 py-3">
      <div className="flex gap-1 items-center col-span-1 place-self-center">
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
      <div>
        <DatePickerForm />
      </div>
      <div className="flex gap-1 items-center">
        <Link href={"/settings"}>
          <Button variant={"outline"} size={"icon"}>
            <Settings />
          </Button>
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
