import { DatePickerForm } from "./date-picker";

export function SiteHeader() {
  return (
    <header className="flex w-full border-b justify-center items-center gap-1 px-4 lg:gap-2 lg:px-6 h-fit py-4">
      <DatePickerForm />
    </header>
  );
}
