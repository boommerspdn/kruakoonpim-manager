"use client";

import { DatePickerForm } from "./date-picker";
import { LogoutButton } from "./logout-button";

export function SiteHeader() {
  return (
    <header className="grid grid-cols-3 place-items-center w-full border-b gap-1 px-4 lg:gap-2 lg:px-6 h-16 py-3">
      <DatePickerForm />
      <LogoutButton />
    </header>
  );
}
