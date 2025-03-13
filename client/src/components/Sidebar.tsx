import { HomeIcon, BarChart3, WalletCards, FileText, MessagesSquare, LineChart, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { 
      title: "Dashboard", 
      href: "/", 
      icon: HomeIcon, 
      active: location === "/" 
    },
    { 
      title: "Investments", 
      href: "/investments", 
      icon: BarChart3, 
      active: location === "/investments" 
    },
    { 
      title: "Budget", 
      href: "/budget", 
      icon: WalletCards, 
      active: location === "/budget" 
    },
    { 
      title: "Reports", 
      href: "/reports", 
      icon: FileText, 
      active: location === "/reports" 
    },
  ];

  const analysisItems = [
    { 
      title: "AI Advisor", 
      href: "/advisor", 
      icon: MessagesSquare, 
      active: location === "/advisor" 
    },
    { 
      title: "Forecasting", 
      href: "/forecasting", 
      icon: LineChart, 
      active: location === "/forecasting" 
    },
    { 
      title: "Risk Analysis", 
      href: "/risk", 
      icon: ShieldCheck, 
      active: location === "/risk" 
    },
  ];

  return (
    <div className="hidden md:flex flex-col bg-white w-64 border-r border-gray-200 shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-gradient-to-r from-secondary to-[#00D4FF] flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#0A2540]">FinanceAI</h1>
        </div>
      </div>
      
      <nav className="flex-1 pt-4">
        <div className="px-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold px-3 mb-2">Dashboard</h2>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
            >
              <a className={cn(
                "flex items-center px-3 py-2 rounded-md mb-1",
                item.active 
                  ? "text-secondary bg-blue-50" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <item.icon className="h-5 w-5 mr-3" />
                {item.title}
              </a>
            </Link>
          ))}
        </div>
        
        <div className="px-4 mb-4">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold px-3 mb-2">Analysis</h2>
          {analysisItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
            >
              <a className={cn(
                "flex items-center px-3 py-2 rounded-md mb-1",
                item.active 
                  ? "text-secondary bg-blue-50" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <item.icon className="h-5 w-5 mr-3" />
                {item.title}
              </a>
            </Link>
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="User profile" 
            className="w-8 h-8 rounded-full mr-3"
          />
          <div>
            <div className="text-sm font-medium">Alex Johnson</div>
            <div className="text-xs text-gray-500">Personal Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
