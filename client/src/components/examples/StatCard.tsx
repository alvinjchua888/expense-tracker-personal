import { StatCard } from "../StatCard";
import { DollarSign, Calendar, Wallet } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      <StatCard
        title="Total Expenses"
        value="$4,532.00"
        trend={{ value: 12.5, isPositive: false }}
        icon={<DollarSign className="h-6 w-6" />}
      />
      <StatCard
        title="This Month"
        value="$1,245.00"
        trend={{ value: 8.2, isPositive: true }}
        icon={<Calendar className="h-6 w-6" />}
      />
      <StatCard
        title="This Week"
        value="$342.50"
        icon={<Wallet className="h-6 w-6" />}
      />
    </div>
  );
}
