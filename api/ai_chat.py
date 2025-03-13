import os
import json
from typing import Dict, List, Any, Optional
import logging

# Import langchain modules conditionally
try:
    from langchain.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    from langchain.chains import LLMChain
    langchain_available = True
except ImportError:
    langchain_available = False

from .database import Database

logger = logging.getLogger(__name__)

class FinancialAIChat:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.llm = None
        self.parser = None
        
        # Initialize LLM only if API key is available and langchain is installed
        if self.api_key and langchain_available:
            try:
                # Import Groq only when needed
                from langchain_groq import ChatGroq
                
                self.llm = ChatGroq(
                    model_name="llama3-70b-8192",
                    api_key=self.api_key,
                    temperature=0.2,
                    max_tokens=4096
                )
                self.parser = StrOutputParser()
                logger.info("Successfully initialized Groq LLM")
            except Exception as e:
                logger.error(f"Failed to initialize Groq LLM: {str(e)}")
                self.llm = None
        else:
            logger.warning("GROQ_API_KEY not found or langchain not available. Running in fallback mode.")
            self.llm = None
    
    async def get_financial_context(self, user_id: str) -> str:
        """Get user's financial context from the database"""
        try:
            # Get user data
            users_db = Database.get_collection("users")
            user = await users_db.find_one({"_id": user_id})
            
            # Get financial data
            fin_db = Database.get_collection("financial_data")
            fin_data = await fin_db.find_one({"user_id": user_id})
            
            if not user or not fin_data:
                return "No financial data available."
            
            # Format financial data as context
            context = f"""
            ## User Financial Profile
            Income: {user.get('financial_profile', {}).get('income', 'N/A')}
            Expenses: {user.get('financial_profile', {}).get('expenses', 'N/A')}
            Savings: {user.get('financial_profile', {}).get('savings', 'N/A')}
            Investment Experience: {user.get('financial_profile', {}).get('investment_experience', 'N/A')}
            Risk Tolerance: {user.get('financial_profile', {}).get('risk_tolerance', 'N/A')}
            Financial Goals: {', '.join(user.get('financial_profile', {}).get('financial_goals', []))}
            
            ## Financial Data
            Net Worth: {fin_data.get('net_worth', 'N/A')}
            Assets: {fin_data.get('assets', 'N/A')}
            Liabilities: {fin_data.get('liabilities', 'N/A')}
            
            ## Portfolio Allocation
            {json.dumps(fin_data.get('portfolio_allocation', {}), indent=2)}
            
            ## Monthly Budget
            {json.dumps(fin_data.get('monthly_budget', []), indent=2)}
            
            ## Upcoming Bills
            {json.dumps(fin_data.get('upcoming_bills', []), indent=2)}
            
            ## Expense Breakdown
            {json.dumps(fin_data.get('expense_breakdown', []), indent=2)}
            """
            
            return context
        except Exception as e:
            logger.error(f"Error getting financial context: {str(e)}")
            return "Error retrieving financial context."
    
    async def get_chat_history(self, user_id: str, limit: int = 10) -> str:
        """Get chat history formatted as a string"""
        try:
            chat_db = Database.get_collection("chat_messages")
            cursor = chat_db.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
            
            messages = []
            async for doc in cursor:
                role = "User" if doc.get("is_user_message") else "Assistant"
                content = doc.get("content", "")
                messages.append(f"{role}: {content}")
            
            # Reverse to get chronological order
            messages.reverse()
            
            return "\n\n".join(messages)
        except Exception as e:
            logger.error(f"Error getting chat history: {str(e)}")
            return ""
    
    async def generate_response(self, user_id: str, user_message: str) -> str:
        """Generate AI response using Groq"""
        try:
            # If LLM is not available, use fallback responses
            if not self.llm:
                return self._generate_fallback_response(user_message)
            
            # Get context and chat history
            financial_context = await self.get_financial_context(user_id)
            chat_history = await self.get_chat_history(user_id)
            
            # Create prompt
            prompt = ChatPromptTemplate.from_messages([
                ("system", f"""You are FinanceGPT, an AI financial analyst assistant for a financial dashboard application. 
                You provide personalized financial insights and advice.
                
                Current date: March 13, 2025
                
                USER FINANCIAL CONTEXT:
                {financial_context}
                
                RECENT CONVERSATION HISTORY:
                {chat_history}
                
                GUIDELINES:
                - Be concise, clear, and personalized in your responses.
                - Always consider the user's financial situation when providing advice.
                - Use INR for currency references.
                - Do not mention that you're an AI unless specifically asked.
                - Maintain a professional but friendly tone.
                - If you don't know something specific about the user's finances, don't make it up.
                - Focus on practical, actionable advice.
                - Cite specific data from their profile/financial data when relevant.
                """),
                ("human", "{input}")
            ])
            
            # Create chain
            chain = prompt | self.llm | self.parser
            
            # Generate response
            response = await chain.ainvoke({"input": user_message})
            
            return response
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I apologize, but I'm having trouble generating a response right now. Please try again later."
    
    def _generate_fallback_response(self, message: str) -> str:
        """Generate a fallback response when API is not available"""
        message_lower = message.lower()
        
        # Simple pattern matching for demo purposes
        if "savings" in message_lower or "save" in message_lower:
            return "Based on your current spending patterns, I've identified several opportunities to increase your savings rate. Your food and dining expenses are currently ₹620, which is ₹20 over your budget. Consider meal planning to reduce dining out expenses. You're also spending ₹87 monthly on subscriptions that could be reviewed. Making these changes could increase your monthly savings by approximately ₹180-₹250."
        
        elif "investment" in message_lower or "invest" in message_lower:
            return "Looking at your risk profile and financial goals, I recommend a diversified portfolio with 60% stocks, 25% bonds, and 15% alternative investments. For the additional savings we discussed, consider allocating them to a tax-advantaged retirement account first, then to a low-cost index fund that tracks the broader market."
        
        elif "debt" in message_lower or "loan" in message_lower:
            return "Your current debt consists of a ₹1,450 mortgage payment, ₹350 auto loan, and ₹680 in credit card debt. I recommend prioritizing paying off the credit card debt first as it likely has the highest interest rate. Once that's eliminated, you could potentially save up to ₹75 monthly in interest payments."
        
        elif "budget" in message_lower or "spending" in message_lower:
            return "Your current monthly budget allocates ₹2,000 for housing, ₹500 for transportation, ₹600 for food and dining, and ₹300 for entertainment. You're currently over budget in food and dining by ₹20. Consider implementing a meal planning strategy to better manage these expenses."
        
        elif "goal" in message_lower or "plan" in message_lower:
            return "Based on your financial goals of retirement planning and home ownership, I recommend increasing your savings rate to 20% of your income. At your current income level, that would mean saving approximately ₹5,000 per month. This would put you on track to achieve your home ownership goal within 3-4 years."
        
        else:
            return "I'm here to help with your financial questions. You can ask me about your spending patterns, investment options, debt management strategies, or any other financial concerns you have. How else can I assist you today?"