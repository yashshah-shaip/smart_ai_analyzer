import { FinancialData } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import PortfolioChart from "./PortfolioChart";
import BudgetProgress from "./BudgetProgress";
import UpcomingBills from "./UpcomingBills";

interface FinancialDashboardProps {
  financialData: FinancialData | undefined;
}

export default function FinancialDashboard({ financialData }: FinancialDashboardProps) {
  if (!financialData) {
    return null;
  }

  const {
    netWorth,
    assets,
    liabilities,
    portfolioAllocation,
    monthlyBudget,
    upcomingBills,
  } = financialData;

  const formattedNetWorth = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(netWorth);

  const formattedAssets = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(assets);

  const formattedLiabilities = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(liabilities);

  return (
    <div className="hidden lg:block w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
        
        {/* Net Worth Card */}
        <Card className="bg-gray-50 mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Net Worth</h3>
              <span className="text-xs text-gray-400">Updated today</span>
            </div>
            <div className="flex items-end">
              <div className="text-2xl font-semibold">{formattedNetWorth}</div>
              <div className="ml-2 text-sm text-[#36B37E] flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                8.2%
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Assets & Liabilities */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assets</h3>
              <div className="text-xl font-semibold">{formattedAssets}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Liabilities</h3>
              <div className="text-xl font-semibold">{formattedLiabilities}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Portfolio Chart */}
        <Card className="mb-6 border border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Investment Portfolio</h3>
            <div className="h-[240px]">
              <PortfolioChart data={portfolioAllocation} />
            </div>
          </CardContent>
        </Card>
        
        {/* Budget Overview */}
        <Card className="mb-6 border border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-700">Monthly Budget</h3>
              <span className="text-xs text-secondary font-medium cursor-pointer">View Details</span>
            </div>
            
            <BudgetProgress budget={monthlyBudget} />
          </CardContent>
        </Card>
        
        {/* Upcoming Bills */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Upcoming Bills</h3>
            <UpcomingBills bills={upcomingBills} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
