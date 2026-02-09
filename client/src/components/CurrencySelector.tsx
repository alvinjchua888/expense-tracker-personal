import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight } from "lucide-react";

export function CurrencySelector() {
  const { displayCurrency, setDisplayCurrency, isLoading } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
      <Select
        value={displayCurrency}
        onValueChange={(v) => setDisplayCurrency(v as Currency)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-28" data-testid="select-display-currency">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency) => (
            <SelectItem key={currency} value={currency} data-testid={`currency-option-${currency}`}>
              {CURRENCY_SYMBOLS[currency]} {currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
