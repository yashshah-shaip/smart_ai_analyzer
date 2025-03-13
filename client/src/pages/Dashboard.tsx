import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ChatInterface from "@/components/ChatInterface";
import FinancialDashboard from "@/components/FinancialDashboard";
import { FinancialData } from "@shared/schema";

export default function Dashboard() {
  const { data: financialData, isLoading, error } = useQuery<FinancialData>({
    queryKey: ["/api/financial-data"],
  });

  const { data: chatHistory, isLoading: isLoadingChat } = useQuery({
    queryKey: ["/api/chat/history"],
  });

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-error mb-2">Something went wrong</h2>
          <p className="text-gray-600">We couldn't load your financial data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-[#1A1F36]">
      {/* Sidebar/Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Main Chat Interface */}
          <ChatInterface 
            initialMessages={chatHistory?.length ? chatHistory : []} 
            isLoading={isLoadingChat} 
          />

          {/* Financial Dashboard Panel */}
          <FinancialDashboard financialData={financialData} />
        </main>
      </div>
    </div>
  );
}
