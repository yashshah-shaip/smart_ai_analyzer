from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import uvicorn
import os
import json
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(title="Financial AI API", description="AI-powered financial analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "https://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# In-memory storage
chat_history = []
financial_data = {
    "netWorth": 124500,
    "assets": 189300,
    "liabilities": 64800,
    "portfolioAllocation": {
        "stocks": 45,
        "bonds": 25,
        "realEstate": 15,
        "cash": 10,
        "alternatives": 5
    },
    "monthlyBudget": [
        {"name": "Housing", "allocated": 2000, "spent": 1800},
        {"name": "Transportation", "allocated": 500, "spent": 450},
        {"name": "Food & Dining", "allocated": 600, "spent": 620},
        {"name": "Entertainment", "allocated": 300, "spent": 180}
    ],
    "upcomingBills": [
        {"name": "Mortgage", "amount": 1450, "dueInDays": 5},
        {"name": "Auto Loan", "amount": 350, "dueInDays": 12},
        {"name": "Credit Card", "amount": 680, "dueInDays": 18}
    ],
    "expenseBreakdown": [
        {"name": "Housing", "amount": 1800},
        {"name": "Food", "amount": 620},
        {"name": "Transport", "amount": 450},
        {"name": "Utilities", "amount": 280},
        {"name": "Entertainment", "amount": 180},
        {"name": "Subscriptions", "amount": 87}
    ]
}

# Root routes
@app.get("/")
async def root():
    return {"message": "Financial AI API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Chat routes
@app.get("/chat/history")
async def get_chat_history():
    return chat_history

@app.post("/chat/query")
async def process_chat_query(chat_request: ChatRequest):
    # Store user message
    user_message = {
        "id": len(chat_history) + 1,
        "content": chat_request.message,
        "is_user_message": True,
        "created_at": datetime.now().isoformat()
    }
    chat_history.append(user_message)
    
    # Simple AI response generation
    ai_response = generate_ai_response(chat_request.message)
    
    # Store AI response
    ai_message = {
        "id": len(chat_history) + 1,
        "content": ai_response,
        "is_user_message": False,
        "created_at": datetime.now().isoformat()
    }
    chat_history.append(ai_message)
    
    return {"response": ai_response}

# Financial data routes
@app.get("/finance/data")
async def get_financial_data():
    return financial_data

@app.get("/finance/news")
async def get_financial_news(query: str = "Indian stock market"):
    return [
        {
            "title": "Indian Stock Market Shows Strong Recovery After Recent Dip",
            "url": "https://example.com/news/1",
            "source": "Financial Times",
            "published": "2025-03-12T10:30:00Z",
            "summary": "The Indian stock market has shown robust recovery following last week's correction, with the Sensex climbing back over 1,000 points."
        },
        {
            "title": "RBI Announces New Policy Measures to Support Economic Growth",
            "url": "https://example.com/news/2",
            "source": "Economic Times",
            "published": "2025-03-11T14:45:00Z",
            "summary": "The Reserve Bank of India has announced a series of policy measures aimed at boosting economic growth and supporting small businesses."
        }
    ]

@app.get("/finance/market-summary")
async def get_market_summary():
    return {
        "sensex": {
            "value": 75432.18,
            "change": 324.56,
            "percentChange": 0.42
        },
        "nifty": {
            "value": 22650.75,
            "change": 98.25,
            "percentChange": 0.35
        },
        "topGainers": [
            {"name": "Reliance Industries", "change": 2.4},
            {"name": "HDFC Bank", "change": 1.8},
            {"name": "Infosys", "change": 1.5}
        ],
        "topLosers": [
            {"name": "Bharti Airtel", "change": -1.2},
            {"name": "ITC Ltd", "change": -0.8},
            {"name": "HUL", "change": -0.5}
        ]
    }

# Helper function to generate AI responses
def generate_ai_response(message: str) -> str:
    message_lower = message.lower()
    
    if "savings" in message_lower:
        return "Based on your current spending patterns, I've identified several opportunities to increase your savings rate. Your food and dining expenses are currently ₹620, which is ₹20 over your budget. Consider meal planning to reduce dining out expenses. You're also spending ₹87 monthly on subscriptions that could be reviewed. Making these changes could increase your monthly savings by approximately ₹180-₹250."
    
    elif "investment" in message_lower:
        return "Looking at your risk profile and financial goals, I recommend a diversified portfolio with 60% stocks, 25% bonds, and 15% alternative investments. For the additional savings we discussed, consider allocating them to a tax-advantaged retirement account first, then to a low-cost index fund that tracks the broader market."
    
    elif "debt" in message_lower:
        return "Your current debt consists of a ₹1,450 mortgage payment, ₹350 auto loan, and ₹680 in credit card debt. I recommend prioritizing paying off the credit card debt first as it likely has the highest interest rate. Once that's eliminated, you could potentially save up to ₹75 monthly in interest payments."
    
    elif "stock" in message_lower or "market" in message_lower:
        return "The Indian stock market is showing positive momentum with the Sensex at 75,432 points, up 0.42% today. Key sectors leading the rally include IT, banking, and energy. Based on your portfolio allocation, you might consider increasing your exposure to defensive sectors given current market volatility."
    
    else:
        return "I'm here to help with your financial questions. You can ask me about your spending patterns, investment options, debt management strategies, or any other financial concerns you have."

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)