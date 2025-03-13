import { Progress } from "@/components/ui/progress";
import { BudgetCategory } from "@shared/schema";

interface BudgetProgressProps {
  budget: BudgetCategory[] | null | undefined;
}

export default function BudgetProgress({ budget }: BudgetProgressProps) {
  // Default data if none is provided
  const budgetData = budget || [
    { name: "Housing", allocated: 2000, spent: 1800 },
    { name: "Transportation", allocated: 500, spent: 450 },
    { name: "Food & Dining", allocated: 600, spent: 620 },
    { name: "Entertainment", allocated: 300, spent: 180 },
  ];

  const getProgressColor = (spent: number, allocated: number) => {
    const percentage = (spent / allocated) * 100;
    if (percentage > 100) return "bg-[#FF5630]"; // Over budget
    if (percentage > 85) return "bg-[#FFAB00]"; // Near budget
    return "bg-[#36B37E]"; // Under budget
  };

  return (
    <div className="space-y-4">
      {budgetData.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{item.name}</span>
            <span>
              ${item.spent.toLocaleString()} / ${item.allocated.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`${getProgressColor(item.spent, item.allocated)} rounded-full h-2`} 
              style={{ width: `${Math.min((item.spent / item.allocated) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
