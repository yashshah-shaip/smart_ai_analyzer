import { ChatMessage } from "@shared/schema";
import { Card } from "@/components/ui/card";
import ExpenseChart from "./ExpenseChart";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  message: ChatMessage;
}

export default function ChatMessageComponent({ message }: ChatMessageProps) {
  const { content, isUserMessage, timestamp } = message;
  
  // Check if message contains expense chart data
  const hasExpenseChart = content.includes("expense breakdown") || content.includes("spending patterns");
  
  // Format the timestamp if available
  const formattedTime = timestamp ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) : "";

  if (isUserMessage) {
    return (
      <div className="flex items-start justify-end" data-message-type="user">
        <div className="flex-1 max-w-2xl bg-secondary bg-opacity-10 rounded-lg p-5">
          <p className="text-gray-800">{content}</p>
          {formattedTime && (
            <div className="mt-2 text-xs text-gray-500 text-right">{formattedTime}</div>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="User" 
            className="w-8 h-8 rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start" data-message-type="ai">
      <div className="flex-shrink-0 mr-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-secondary to-[#00D4FF] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
        {/* Render message content, splitting by paragraphs */}
        {content.split('\n').map((paragraph, index) => (
          <p key={index} className={`text-gray-800 ${index < content.split('\n').length - 1 ? 'mb-4' : ''}`}>
            {paragraph}
          </p>
        ))}
        
        {/* Conditionally render expense chart if message mentions expense analysis */}
        {hasExpenseChart && (
          <Card className="bg-gray-50 rounded-lg p-4 my-4">
            <h4 className="text-sm font-medium mb-3">Your Expense Breakdown</h4>
            <div style={{ height: "180px" }}>
              <ExpenseChart />
            </div>
          </Card>
        )}
        
        {formattedTime && (
          <div className="mt-2 text-xs text-gray-500">{formattedTime}</div>
        )}
      </div>
    </div>
  );
}
