"use client";

import { th } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDateStore } from "@/hooks/use-date";
import { useTableModeStore } from "@/hooks/use-table-mode";
import { useState } from "react";

export function DatePickerForm() {
  const [open, setOpen] = useState(false);
  const { date, setDate } = useDateStore();
  const { tableMode } = useTableModeStore();

  return (
    <div className="flex gap-3 col-start-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="w-56 justify-between font-normal"
            disabled={tableMode === "edit"}
          >
            {date
              ? date.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "เลือกวันที่"}
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            locale={th}
            selected={date}
            captionLayout="dropdown"
            onSelect={(selected) => {
              setDate(selected);
              setOpen(false);
            }}
            required
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
