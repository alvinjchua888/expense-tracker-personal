import { DateRangePicker } from "../DateRangePicker";

export default function DateRangePickerExample() {
  return (
    <DateRangePicker
      onRangeChange={(range) => console.log("Date range changed:", range)}
    />
  );
}
