import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ChatInterface from "@/components/ChatInterface";
import FinancialDashboard from "@/components/FinancialDashboard";
import { FinancialData } from "@shared/schema";
import { 
  getFinancialData, 
  getChatHistory, 
  getAIInsights, 
  getMarketSummary, 
  getFinancialNews 
} from "@/lib/api";
import { AIAdvisorState, MarketState, FinancialNewsState, AIInsight, FinancialNewsItem } from "@/lib/types";

export default function Dashboard() {
  const [pythonData, setPythonData] = useState<any>(null);
  const [isLoadingPythonData, setIsLoadingPythonData] = useState(true);
  const [pythonDataError, setPythonDataError] = useState<Error | null>(null);

  // Financial data query
  const { data: financialData, isLoading, error } = useQuery<FinancialData>({
    queryKey: ["/api/financial-data"],
    queryFn: getFinancialData,
    enabled: true,  // Always try Express API first
  });

  // Chat history query  
  const { data: chatHistory, isLoading: isLoadingChat } = useQuery({
    queryKey: ["/api/chat/history"],
    queryFn: getChatHistory,
  });
  
  // AI insights query - we wrap this in a try-catch because it's a new feature
  const { 
    data: aiInsights = { insights: [], recommendations: [], isLoading: false, error: null }, 
    isLoading: isLoadingInsights 
  } = useQuery<AIAdvisorState>({
    queryKey: ["/api/ai-advisor/insights"],
    queryFn: getAIInsights,
    enabled: true,
    retry: false
  });
  
  // Market summary query
  const { 
    data: marketSummary = { summary: null, isLoading: false, error: null }, 
    isLoading: isLoadingMarket 
  } = useQuery<MarketState>({
    queryKey: ["/api/market-summary"],
    queryFn: getMarketSummary,
    enabled: true,
    retry: false,
  });
  
  // Financial news query
  const { 
    data: financialNews = { news: [], isLoading: false, error: null }, 
    isLoading: isLoadingNews 
  } = useQuery<FinancialNewsState>({
    queryKey: ["/api/financial-news"],
    queryFn: () => getFinancialNews(),
    enabled: true,
    retry: false,
  });

  // Fallback to direct Python API if Express fails
  useEffect(() => {
    if (!isLoading && !financialData) {
      setIsLoadingPythonData(true);
      
      fetch('http://localhost:5000/finance/data')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          setPythonData(data);
          setIsLoadingPythonData(false);
        })
        .catch(err => {
          console.error("Error fetching from Python API:", err);
          setPythonDataError(err);
          setIsLoadingPythonData(false);
        });
    } else if (financialData) {
      setIsLoadingPythonData(false);
    }
  }, [isLoading, financialData]);

  // Determine what data to show
  const effectiveFinancialData = financialData || pythonData;
  const effectiveIsLoading = isLoading || isLoadingPythonData;
  const effectiveError = error || pythonDataError;

  if (effectiveIsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (effectiveError && !effectiveFinancialData) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-error mb-2">Something went wrong</h2>
          <p className="text-gray-600">We couldn't load your financial data. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Calculate overall loading state
  const isPageLoading = effectiveIsLoading || isLoadingChat || isLoadingInsights || isLoadingMarket || isLoadingNews;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-[#1A1F36]">
      {/* Sidebar/Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Market Summary Bar (if available) */}
        {marketSummary && marketSummary.summary && (
          <div className="bg-[#0A2540] text-white py-2 px-4 flex items-center justify-between overflow-x-auto">
            <div className="flex items-center space-x-6">
              <div className="flex flex-col">
                <span className="text-xs opacity-70">SENSEX</span>
                <div className="flex items-center">
                  <span className="font-medium">{marketSummary.summary.sensex.value.toLocaleString()}</span>
                  <span className={`text-xs ml-2 ${marketSummary.summary.sensex.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {marketSummary.summary.sensex.change >= 0 ? '▲' : '▼'} {Math.abs(marketSummary.summary.sensex.change).toLocaleString()} ({marketSummary.summary.sensex.percentChange.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs opacity-70">NIFTY</span>
                <div className="flex items-center">
                  <span className="font-medium">{marketSummary.summary.nifty.value.toLocaleString()}</span>
                  <span className={`text-xs ml-2 ${marketSummary.summary.nifty.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {marketSummary.summary.nifty.change >= 0 ? '▲' : '▼'} {Math.abs(marketSummary.summary.nifty.change).toLocaleString()} ({marketSummary.summary.nifty.percentChange.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <span className="text-xs opacity-70">Top Gainers:</span>
                <div className="flex space-x-3">
                  {marketSummary.summary.topGainers.slice(0, 2).map((gainer, idx) => (
                    <span key={idx} className="text-xs text-green-400">{gainer.name} (+{gainer.change.toFixed(1)}%)</span>
                  ))}
                </div>
              </div>
              
              <div className="hidden md:block">
                <span className="text-xs opacity-70">Top Losers:</span>
                <div className="flex space-x-3">
                  {marketSummary.summary.topLosers.slice(0, 2).map((loser, idx) => (
                    <span key={idx} className="text-xs text-red-400">{loser.name} ({loser.change.toFixed(1)}%)</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-auto">
          {/* Left Panel - Chat & AI Advisor */}
          <div className="col-span-12 lg:col-span-5 flex flex-col space-y-4">
            {/* Chat Interface */}
            <div className="bg-white rounded-lg shadow-sm h-[600px]">
              <ChatInterface 
                initialMessages={chatHistory?.length ? chatHistory : []} 
                isLoading={isLoadingChat} 
              />
            </div>
            
            {/* AI Advisor Insights */}
            {aiInsights && aiInsights.insights && aiInsights.insights.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-indigo-100 rounded-full mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold">AI Advisor Insights</h2>
                </div>
                
                <div className="space-y-3">
                  {aiInsights.insights.slice(0, 2).map((insight: string, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded">
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                  
                  {aiInsights.recommendations && aiInsights.recommendations.length > 0 && 
                    aiInsights.recommendations.slice(0, 1).map((rec: AIInsight, idx: number) => (
                    <div key={idx} className="p-3 border border-indigo-100 rounded bg-indigo-50">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{rec.category}: {rec.action}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          rec.impact === "High" ? "bg-red-100 text-red-700" :
                          rec.impact === "Medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {rec.impact} Impact
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{rec.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Panel - Financial Dashboard & News */}
          <div className="col-span-12 lg:col-span-7 flex flex-col space-y-4">
            {/* Financial Dashboard */}
            <div className="bg-white rounded-lg shadow-sm">
              <FinancialDashboard financialData={effectiveFinancialData} />
            </div>
            
            {/* Financial News */}
            {financialNews && financialNews.news && financialNews.news.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Financial News</h2>
                  <span className="text-xs text-gray-500">Last updated: {new Date().toLocaleDateString()}</span>
                </div>
                
                <div className="divide-y">
                  {financialNews.news.slice(0, 3).map((item: FinancialNewsItem, idx: number) => (
                    <div key={idx} className="py-3">
                      <h3 className="font-medium text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{item.summary}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{item.source}</span>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          Read more
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
