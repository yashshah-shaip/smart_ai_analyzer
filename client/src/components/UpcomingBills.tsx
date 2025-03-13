import { Bill } from "@shared/schema";

interface UpcomingBillsProps {
  bills: Bill[] | null | undefined;
}

export default function UpcomingBills({ bills }: UpcomingBillsProps) {
  // Default data if none is provided
  const billsData = bills || [
    { name: "Mortgage", amount: 1450, dueInDays: 5 },
    { name: "Auto Loan", amount: 350, dueInDays: 12 },
    { name: "Credit Card", amount: 680, dueInDays: 18 },
  ];

  // Format currency as $X,XXX
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ul className="divide-y divide-gray-200">
      {billsData.map((bill, index) => (
        <li key={index} className="py-3 flex justify-between">
          <div>
            <p className="text-sm font-medium">{bill.name}</p>
            <p className="text-xs text-gray-500">
              Due in {bill.dueInDays} {bill.dueInDays === 1 ? 'day' : 'days'}
            </p>
          </div>
          <span className="text-sm font-semibold">{formatCurrency(bill.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
