import { BellIcon, Settings, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function TopBar() {
  const { toast } = useToast();

  const handleNewAnalysis = () => {
    toast({
      title: "New Analysis",
      description: "This feature is coming soon!",
    });
  };

  const toggleSidebar = () => {
    // In a real implementation, this would toggle the sidebar on mobile
    toast({
      title: "Mobile Navigation",
      description: "Sidebar toggle would appear here on mobile screens",
    });
  };

  return (
    <header className="bg-white shadow-[0_4px_6px_rgba(0,0,0,0.1)] z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button 
            className="mr-4 md:hidden text-gray-500"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-[#0A2540]">FinanceAI Advisor</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <BellIcon className="h-6 w-6" />
          </button>
          
          <button className="text-gray-500 hover:text-gray-700">
            <Settings className="h-6 w-6" />
          </button>
          
          <div className="hidden md:block">
            <Button 
              className="bg-secondary hover:bg-opacity-90"
              onClick={handleNewAnalysis}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
