import os
from typing import Dict, List, Optional, Any
from langchain.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain.chains import LLMChain
from langchain_core.output_parsers import StrOutputParser
from .database import Database

class FinancialAIChat:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        
        # Initialize Groq LLM
        self.llm = ChatGroq(
            groq_api_key=self.groq_api_key,
            model_name="llama3-8b-8192", # Can be switched to different models
            temperature=0.2,
            max_tokens=2048
        )
        
        # Create a system prompt that provides context about the financial advisor
        self.system_prompt = """
        You are FinWise, an AI financial advisor. You provide personalized financial advice 
        based on the user's financial profile and data.
        
        You have access to the following information about the user:
        - Income
        - Expenses
        - Savings
        - Investment experience
        - Risk tolerance
        - Financial goals
        - Net worth
        - Assets and liabilities
        - Portfolio allocation
        - Monthly budget
        - Upcoming bills
        - Expense breakdown
        
        When providing advice:
        1. Be conversational but professional
        2. Always consider the user's financial profile and risk tolerance
        3. Provide actionable recommendations when possible
        4. Always use INR (₹) when discussing monetary values
        5. Be transparent about any limitations in your advice
        6. Focus on long-term financial health and wealth building
        
        If you don't have specific information, acknowledge the limitation and provide 
        general advice that would apply to most situations.
        """
        
    async def get_financial_context(self, user_id: str) -> str:
        """Get user's financial context from the database"""
        users_collection = Database.get_collection("users")
        financial_data_collection = Database.get_collection("financial_data")
        
        user = await users_collection.find_one({"_id": user_id})
        financial_data = await financial_data_collection.find_one({"user_id": user_id})
        
        if not user or not financial_data:
            return "No financial data available for this user."
        
        # Format the user's financial data into a context string
        context = f"""
        User's Financial Profile:
        - Monthly Income: ₹{user.get('financial_profile', {}).get('income', 'Unknown')}
        - Monthly Expenses: ₹{user.get('financial_profile', {}).get('expenses', 'Unknown')}
        - Monthly Savings: ₹{user.get('financial_profile', {}).get('savings', 'Unknown')}
        - Investment Experience: {user.get('financial_profile', {}).get('investment_experience', 'Unknown')}
        - Risk Tolerance: {user.get('financial_profile', {}).get('risk_tolerance', 'Unknown')}
        - Financial Goals: {', '.join(user.get('financial_profile', {}).get('financial_goals', ['Unknown']))}
        
        User's Financial Data:
        - Net Worth: ₹{financial_data.get('net_worth', 'Unknown')}
        - Total Assets: ₹{financial_data.get('assets', 'Unknown')}
        - Total Liabilities: ₹{financial_data.get('liabilities', 'Unknown')}
        
        Portfolio Allocation:
        """
        
        portfolio_allocation = financial_data.get('portfolio_allocation', {})
        for asset_class, percentage in portfolio_allocation.items():
            context += f"- {asset_class.title()}: {percentage}%\n"
        
        context += "\nMonthly Budget:\n"
        monthly_budget = financial_data.get('monthly_budget', [])
        for category in monthly_budget:
            context += f"- {category.get('name')}: Allocated ₹{category.get('allocated')}, Spent ₹{category.get('spent')}\n"
        
        context += "\nUpcoming Bills:\n"
        upcoming_bills = financial_data.get('upcoming_bills', [])
        for bill in upcoming_bills:
            context += f"- {bill.get('name')}: ₹{bill.get('amount')} due in {bill.get('dueInDays')} days\n"
        
        context += "\nExpense Breakdown:\n"
        expense_breakdown = financial_data.get('expense_breakdown', [])
        for expense in expense_breakdown:
            context += f"- {expense.get('name')}: ₹{expense.get('amount')}\n"
        
        return context
        
    async def get_chat_history(self, user_id: str, limit: int = 10) -> str:
        """Get chat history formatted as a string"""
        chat_collection = Database.get_collection("chat_messages")
        
        # Get the most recent messages, limited to `limit`
        cursor = chat_collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        messages = await cursor.to_list(length=limit)
        messages.reverse()  # Reverse to get chronological order
        
        if not messages:
            return "No chat history available."
        
        # Format chat history
        history = ""
        for msg in messages:
            sender = "User" if msg.get("is_user_message") else "AI"
            history += f"{sender}: {msg.get('content')}\n\n"
        
        return history
    
    async def generate_response(self, user_id: str, user_message: str) -> str:
        """Generate AI response using Groq"""
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
            
        # Get user context and chat history
        context = await self.get_financial_context(user_id)
        chat_history = await self.get_chat_history(user_id)
        
        # Create chat prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt + f"\n\nUser's Financial Information:\n{context}\n\nChat History:\n{chat_history}"),
            ("human", "{input}")
        ])
        
        # Create chain
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            # Generate response
            response = await chain.ainvoke({"input": user_message})
            return response
        except Exception as e:
            print(f"Error generating AI response: {str(e)}")
            return "I'm sorry, I'm having trouble processing your request right now. Please try again later."