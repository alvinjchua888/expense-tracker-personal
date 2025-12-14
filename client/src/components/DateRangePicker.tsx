import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import type { DateRange } from "react-day-picker";

type PresetRange = "week" | "month" | "year" | "custom";

interface DateRangePickerProps {
  onRangeChange?: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const presets = [
    { label: "Week", value: "week" as PresetRange },
    { label: "Month", value: "month" as PresetRange },
    { label: "Year", value: "year" as PresetRange },
    { label: "Custom", value: "custom" as PresetRange },
  ];

  const handlePresetClick = (preset: PresetRange) => {
    setSelectedPreset(preset);
    let newRange: DateRange | undefined;

    const today = new Date();
    switch (preset) {
      case "week":
        newRange = { from: subDays(today, 7), to: today };
        break;
      case "month":
        newRange = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case "year":
        newRange = { from: startOfYear(today), to: endOfYear(today) };
        break;
      default:
        newRange = dateRange;
    }

    setDateRange(newRange);
    onRangeChange?.(newRange);
  };

  const handleCustomRange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSelectedPreset("custom");
    onRangeChange?.(range);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex rounded-md border border-input overflow-hidden">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant="ghost"
            size="sm"
            className={`rounded-none ${
              selectedPreset === preset.value
                ? "bg-primary text-primary-foreground"
                : ""
            }`}
            onClick={() => handlePresetClick(preset.value)}
            data-testid={`button-preset-${preset.value}`}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" data-testid="button-date-range">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              "Pick a date range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleCustomRange}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
