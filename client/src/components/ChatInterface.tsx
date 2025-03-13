import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ChatMessage } from "@shared/schema";
import { Loader2, PaperclipIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ChatMessageComponent from "./ChatMessage";

interface ChatInterfaceProps {
  initialMessages: ChatMessage[];
  isLoading: boolean;
}

export default function ChatInterface({ initialMessages, isLoading }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Use direct Python API endpoint instead of Express proxy
      const response = await fetch('http://localhost:5000/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return response.json();
    },
    onMutate: async (message) => {
      // Create optimistic user message update
      const userMessage: Partial<ChatMessage> = {
        content: message,
        isUserMessage: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage as ChatMessage]);
      setIsProcessing(true);
    },
    onSuccess: (data) => {
      // Add AI response to chat
      const aiMessage: Partial<ChatMessage> = {
        content: data.response,
        isUserMessage: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage as ChatMessage]);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
    },
    onError: () => {
      toast({
        title: "Message failed",
        description: "Unable to send your message. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isProcessing) return;
    
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 p-6">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Loading conversation history...</p>
      </div>
    );
  }

  const renderWelcomeMessage = () => {
    if (messages.length === 0) {
      const welcomeMessage: Partial<ChatMessage> = {
        content: "Hi there, welcome to FinanceAI! I'm your personal financial assistant. I can help you analyze your finances, track your investments, and provide personalized advice to improve your financial health. What would you like to know about your finances today?",
        isUserMessage: false,
        timestamp: new Date(),
      };
      
      return <ChatMessageComponent message={welcomeMessage as ChatMessage} />;
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {renderWelcomeMessage()}
        
        {messages.map((message, index) => (
          <ChatMessageComponent key={index} message={message} />
        ))}
        
        {isProcessing && (
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-secondary to-[#00D4FF] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="border-t border-gray-200 bg-white p-4 sm:p-6">
        <form className="flex items-center space-x-4" onSubmit={handleSendMessage}>
          <div className="flex-1 relative">
            <Textarea
              rows={1}
              className="block w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary text-gray-900 placeholder-gray-500 resize-none"
              placeholder="Ask anything about your finances..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button 
              type="button" 
              className="absolute right-2 bottom-2 text-gray-400 hover:text-gray-600"
              onClick={() => toast({
                title: "Attachment",
                description: "Attachment functionality coming soon!",
              })}
            >
              <PaperclipIcon className="h-6 w-6" />
            </button>
          </div>
          
          <Button 
            type="submit" 
            size="icon"
            className="rounded-full bg-secondary hover:bg-opacity-90"
            disabled={!inputMessage.trim() || isProcessing}
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-center">
          <span>Powered by</span>
          <span className="font-medium mx-1">Groq</span>
          <span>•</span>
          <span className="font-medium mx-1">Langchain</span>
          <span>•</span>
          <span className="font-medium mx-1">Tavily</span>
        </div>
      </div>
    </div>
  );
}
