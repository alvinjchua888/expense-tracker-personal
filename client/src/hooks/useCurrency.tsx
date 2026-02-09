import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CURRENCY_SYMBOLS, CURRENCIES, type Currency } from "@shared/schema";

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
}

interface CurrencyContextType {
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
  convert: (amount: number, fromCurrency?: Currency) => number;
  formatAmount: (amount: number, fromCurrency?: Currency) => string;
  symbol: string;
  rates: Record<string, number> | null;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("displayCurrency");
    return (saved && CURRENCIES.includes(saved as Currency)) ? saved as Currency : "PHP";
  });

  const { data: rateData, isLoading } = useQuery<ExchangeRates>({
    queryKey: ["/api/exchange-rates"],
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });

  const setDisplayCurrency = useCallback((currency: Currency) => {
    setDisplayCurrencyState(currency);
    localStorage.setItem("displayCurrency", currency);
  }, []);

  const convert = useCallback((amount: number, fromCurrency: Currency = "PHP"): number => {
    if (!rateData?.rates || fromCurrency === displayCurrency) return amount;

    const rates = rateData.rates;

    if (fromCurrency === "PHP") {
      const rate = rates[displayCurrency];
      return rate ? amount * rate : amount;
    }

    const fromRate = rates[fromCurrency];
    const toRate = rates[displayCurrency];
    if (!fromRate || !toRate) return amount;
    const amountInPHP = amount / fromRate;
    return amountInPHP * toRate;
  }, [rateData, displayCurrency]);

  const formatAmount = useCallback((amount: number, fromCurrency: Currency = "PHP"): string => {
    const converted = convert(amount, fromCurrency);
    const sym = CURRENCY_SYMBOLS[displayCurrency];
    return `${sym}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [convert, displayCurrency]);

  return (
    <CurrencyContext.Provider value={{
      displayCurrency,
      setDisplayCurrency,
      convert,
      formatAmount,
      symbol: CURRENCY_SYMBOLS[displayCurrency],
      rates: rateData?.rates || null,
      isLoading,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
