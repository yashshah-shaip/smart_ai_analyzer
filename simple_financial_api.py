from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any, Union
import uvicorn
import os
import json
import base64
import io
from datetime import datetime
import random

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

class DocumentUploadRequest(BaseModel):
    documentType: str
    filename: str
    fileContent: str  # Base64 encoded

class InvestmentRequest(BaseModel):
    name: str
    type: str
    value: float
    purchaseDate: Optional[str] = None
    purchasePrice: Optional[float] = None
    currentPrice: Optional[float] = None
    quantity: Optional[float] = None
    notes: Optional[str] = None

class BudgetRequest(BaseModel):
    name: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    totalBudget: float
    categories: List[Dict[str, Any]]
    status: str = "draft"

class ProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatarUrl: Optional[str] = None
    financialProfile: Optional[Dict[str, Any]] = None

# In-memory storage
chat_history = []
financial_data = {
    "netWorth": 124500,
    "assets": 189300,
    "liabilities": 64800,
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

user_documents = []
investments = []
budgets = []
risk_analyses = []
forecasts = []
user_profile = {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+91 98765 43210",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    "financialProfile": {
        "annualIncome": 1200000,
        "monthlyExpenses": 50000,
        "employmentStatus": "full-time",
        "savingsGoal": 300000,
        "riskTolerance": "medium"
    }
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
    
    # AI response generation
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
    try:
        # Try to use Tavily API if TAVILY_API_KEY is available
        tavily_api_key = os.environ.get("TAVILY_API_KEY")
        if tavily_api_key:
            # Implement Tavily API call here
            # This is a placeholder for actual implementation
            return get_news_from_tavily(query)
        else:
            # Return fallback news data
            return get_fallback_news(query)
    except Exception as e:
        print(f"Error getting news: {str(e)}")
        return get_fallback_news(query)

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

# Document routes
@app.post("/documents/upload")
async def upload_document(document: DocumentUploadRequest):
    try:
        # Decode base64 content
        file_content = base64.b64decode(document.fileContent)
        
        # In a real app, we would save the file to storage
        # For now, we'll just extract text and store metadata
        document_id = len(user_documents) + 1
        doc_record = {
            "id": document_id,
            "filename": document.filename,
            "documentType": document.documentType,
            "uploadDate": datetime.now().isoformat(),
            "metadata": {
                "fileSize": len(file_content),
                "mimeType": "application/pdf"  # Assuming PDF
            },
            "insights": generate_document_insights(document.documentType)
        }
        
        user_documents.append(doc_record)
        
        return {
            "id": document_id,
            "message": "Document uploaded successfully",
            "insights": doc_record["insights"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}"
        )

@app.get("/documents")
async def get_documents():
    return user_documents

@app.get("/documents/{document_id}")
async def get_document(document_id: int):
    for doc in user_documents:
        if doc["id"] == document_id:
            return doc
    
    raise HTTPException(
        status_code=404,
        detail=f"Document with ID {document_id} not found"
    )

# Investment routes
@app.get("/investments")
async def get_investments():
    return investments

@app.post("/investments")
async def create_investment(investment: InvestmentRequest):
    investment_id = len(investments) + 1
    new_investment = {
        "id": investment_id,
        **investment.dict(),
        "createdAt": datetime.now().isoformat()
    }
    
    investments.append(new_investment)
    return new_investment

@app.put("/investments/{investment_id}")
async def update_investment(investment_id: int, investment: InvestmentRequest):
    for i, inv in enumerate(investments):
        if inv["id"] == investment_id:
            updated_investment = {
                **inv,
                **investment.dict(),
                "updatedAt": datetime.now().isoformat()
            }
            investments[i] = updated_investment
            return updated_investment
    
    raise HTTPException(
        status_code=404,
        detail=f"Investment with ID {investment_id} not found"
    )

@app.delete("/investments/{investment_id}")
async def delete_investment(investment_id: int):
    for i, inv in enumerate(investments):
        if inv["id"] == investment_id:
            del investments[i]
            return {"message": f"Investment {investment_id} deleted"}
    
    raise HTTPException(
        status_code=404,
        detail=f"Investment with ID {investment_id} not found"
    )

# Budget routes
@app.get("/budgets")
async def get_budgets():
    return budgets

@app.post("/budgets")
async def create_budget(budget: BudgetRequest):
    budget_id = len(budgets) + 1
    new_budget = {
        "id": budget_id,
        **budget.dict(),
        "createdAt": datetime.now().isoformat()
    }
    
    budgets.append(new_budget)
    return new_budget

@app.put("/budgets/{budget_id}")
async def update_budget(budget_id: int, budget: BudgetRequest):
    for i, b in enumerate(budgets):
        if b["id"] == budget_id:
            updated_budget = {
                **b,
                **budget.dict(),
                "updatedAt": datetime.now().isoformat()
            }
            budgets[i] = updated_budget
            return updated_budget
    
    raise HTTPException(
        status_code=404,
        detail=f"Budget with ID {budget_id} not found"
    )

@app.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: int):
    for i, b in enumerate(budgets):
        if b["id"] == budget_id:
            del budgets[i]
            return {"message": f"Budget {budget_id} deleted"}
    
    raise HTTPException(
        status_code=404,
        detail=f"Budget with ID {budget_id} not found"
    )

# Risk Analysis routes
@app.get("/risk-analysis")
async def get_risk_analysis():
    # Generate a new risk analysis if none exists
    if not risk_analyses:
        risk_analysis = generate_risk_analysis()
        risk_analyses.append(risk_analysis)
    
    return risk_analyses[-1]  # Return the most recent analysis

@app.post("/risk-analysis/analyze-portfolio")
async def analyze_portfolio(document_id: Optional[int] = None):
    # Generate risk analysis
    risk_analysis = generate_risk_analysis()
    risk_analyses.append(risk_analysis)
    
    return risk_analysis

# Forecasting routes
@app.get("/forecasts")
async def get_forecasts():
    # Generate a new forecast if none exists
    if not forecasts:
        forecast = generate_forecast()
        forecasts.append(forecast)
    
    return forecasts

@app.post("/forecasts")
async def create_forecast(horizon: str = "medium_term", document_id: Optional[int] = None):
    forecast = generate_forecast(horizon)
    forecasts.append(forecast)
    
    return forecast

# Profile routes
@app.get("/profile")
async def get_profile():
    return user_profile

@app.put("/profile")
async def update_profile(profile: ProfileUpdateRequest):
    # Update only the fields that are provided
    if profile.fullName is not None:
        user_profile["fullName"] = profile.fullName
    
    if profile.email is not None:
        user_profile["email"] = profile.email
    
    if profile.phone is not None:
        user_profile["phone"] = profile.phone
    
    if profile.avatarUrl is not None:
        user_profile["avatarUrl"] = profile.avatarUrl
    
    if profile.financialProfile is not None:
        user_profile["financialProfile"] = {
            **user_profile.get("financialProfile", {}),
            **profile.financialProfile
        }
    
    return user_profile

# AI Advisor route
@app.get("/ai-advisor/insights")
async def get_ai_insights():
    # Generate random insights based on user data
    return {
        "insights": [
            "Based on your spending patterns, you could save ₹4,500 monthly by reducing discretionary expenses.",
            "Your investment portfolio has a 72% concentration in technology stocks, which increases your volatility risk.",
            "Consider increasing your emergency fund to cover 6 months of expenses (currently at 3.2 months).",
            "Your debt-to-income ratio of 32% is higher than the recommended 28%. Focus on reducing high-interest debt."
        ],
        "recommendations": [
            {
                "category": "Savings",
                "action": "Increase monthly savings by ₹2,000",
                "impact": "Medium",
                "details": "This would help you reach your down payment goal 6 months earlier."
            },
            {
                "category": "Investments",
                "action": "Diversify into more defensive sectors",
                "impact": "High",
                "details": "Adding 15% allocation to consumer staples can reduce portfolio volatility by 12%."
            },
            {
                "category": "Debt",
                "action": "Refinance home loan",
                "impact": "High",
                "details": "Current rates are 0.75% lower than your existing loan, potentially saving ₹3,200 monthly."
            }
        ]
    }

# Helper function to generate AI responses
def generate_ai_response(message: str) -> str:
    message_lower = message.lower()
    
    # First try to use Groq API if GROQ_API_KEY is available
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            # This would be where we call the Groq API
            # For now, we'll use our fallback responses
            pass
        except Exception as e:
            print(f"Error using Groq API: {str(e)}")
            # Continue to fallback responses
    
    # Fallback response generation
    if "savings" in message_lower:
        return "Based on your current spending patterns, I've identified several opportunities to increase your savings rate. Your food and dining expenses are currently ₹620, which is ₹20 over your budget. Consider meal planning to reduce dining out expenses. You're also spending ₹87 monthly on subscriptions that could be reviewed. Making these changes could increase your monthly savings by approximately ₹180-₹250."
    
    elif "investment" in message_lower:
        return "Looking at your risk profile and financial goals, I recommend a diversified portfolio with 60% stocks, 25% bonds, and 15% alternative investments. For the additional savings we discussed, consider allocating them to a tax-advantaged retirement account first, then to a low-cost index fund that tracks the broader market."
    
    elif "debt" in message_lower:
        return "Your current debt consists of a ₹1,450 mortgage payment, ₹350 auto loan, and ₹680 in credit card debt. I recommend prioritizing paying off the credit card debt first as it likely has the highest interest rate. Once that's eliminated, you could potentially save up to ₹75 monthly in interest payments."
    
    elif "stock" in message_lower or "market" in message_lower:
        return "The Indian stock market is showing positive momentum with the Sensex at 75,432 points, up 0.42% today. Key sectors leading the rally include IT, banking, and energy. Based on your portfolio allocation, you might consider increasing your exposure to defensive sectors given current market volatility."
    
    elif "budget" in message_lower:
        return "Based on your income and financial goals, I've analyzed your current budget. Your housing costs represent 36% of your monthly expenses, which is within the recommended range of 30-40%. However, your entertainment and dining expenses are trending 15% higher than last month. Setting a specific budget for these categories and tracking expenses with a dedicated app could help you stay on target."
    
    elif "retirement" in message_lower:
        return "Based on your current savings rate and retirement goals, you're on track to reach approximately 85% of your target retirement corpus by age 60. To close this gap, consider increasing your monthly retirement contributions by ₹3,000 or exploring higher-return investment options that align with your risk tolerance. Additionally, maximizing your employer's matching contributions to your EPF could significantly boost your retirement savings."
    
    elif "tax" in message_lower:
        return "I've identified several tax-saving opportunities that could reduce your tax liability. Consider increasing your Section 80C investments (currently at ₹1.2 lakh out of the maximum ₹1.5 lakh). Additionally, health insurance premiums under Section 80D and home loan interest under Section 24 could provide further deductions. Based on your income bracket, these steps could potentially save you ₹45,000-₹60,000 in annual taxes."
    
    else:
        return "I'm here to help with your financial questions. You can ask me about your spending patterns, investment options, debt management strategies, tax planning, retirement planning, or any other financial concerns you have."

# Helper functions for document processing
def generate_document_insights(document_type: str) -> Dict[str, Any]:
    """Generate mock insights for uploaded documents"""
    if document_type == "investment":
        return {
            "summary": "Your investment portfolio shows a diversified approach with exposure to various asset classes.",
            "details": {
                "assetAllocation": {
                    "stocks": 58,
                    "bonds": 22,
                    "cash": 12,
                    "alternatives": 8
                },
                "performance": {
                    "1year": 12.3,
                    "3year": 8.7,
                    "5year": 11.2
                },
                "riskMetrics": {
                    "sharpeRatio": 0.87,
                    "volatility": "medium",
                    "drawdown": -14.3
                }
            },
            "recommendations": [
                "Consider increasing international exposure for better diversification",
                "Your bond allocation could be increased slightly given current market conditions",
                "Review your technology sector exposure which seems concentrated"
            ]
        }
    elif document_type == "tax":
        return {
            "summary": "Your tax documents reveal potential for additional deductions under Section 80C and 80D.",
            "details": {
                "totalIncome": 1450000,
                "taxPaid": 196000,
                "deductionsTaken": 185000,
                "potentialAdditionalDeductions": 65000
            },
            "recommendations": [
                "Maximize your 80C contributions which are currently under the limit",
                "Consider health insurance premium payments for additional deductions",
                "Home loan interest can provide significant tax benefits"
            ]
        }
    elif document_type == "bank":
        return {
            "summary": "Your bank statements show consistent income and some patterns in discretionary spending.",
            "details": {
                "averageMonthlyIncome": 125000,
                "averageMonthlySpending": 87000,
                "topCategories": [
                    {"category": "Housing", "percentage": 35},
                    {"category": "Dining", "percentage": 18},
                    {"category": "Transportation", "percentage": 12}
                ]
            },
            "recommendations": [
                "Your dining expenses seem higher than average for your income bracket",
                "Consider setting up automatic transfers to savings on payday",
                "Review subscription services which total ₹4,200 monthly"
            ]
        }
    else:
        return {
            "summary": "We've analyzed your document and identified potential areas for financial improvement.",
            "details": {
                "generalObservations": [
                    "Document contains financial information that could be better organized",
                    "Several key data points were extracted for analysis"
                ]
            },
            "recommendations": [
                "Consider organizing your financial documents in a more structured way",
                "Regular review of financial statements is recommended"
            ]
        }

def get_news_from_tavily(query: str) -> List[Dict[str, Any]]:
    """Placeholder for Tavily API integration"""
    # In a real implementation, this would call the Tavily API
    # For now, return slightly varied fake news based on the query
    if "market" in query.lower():
        return [
            {
                "title": f"Indian Stock Market Analysis: Trends and Opportunities in {datetime.now().year}",
                "url": "https://example.com/news/market-analysis",
                "source": "Financial Times",
                "published": datetime.now().isoformat(),
                "summary": "Comprehensive analysis of current market trends shows resilience in the Indian economy despite global headwinds. Experts predict continued growth in specific sectors."
            },
            {
                "title": "Foreign Investments in Indian Markets Rise by 12% This Quarter",
                "url": "https://example.com/news/foreign-investment",
                "source": "Economic Times",
                "published": datetime.now().isoformat(),
                "summary": "Foreign institutional investors have shown renewed confidence in Indian markets, with investments rising 12% quarter-over-quarter, primarily in technology and pharmaceutical sectors."
            }
        ]
    elif "crypto" in query.lower():
        return [
            {
                "title": "India's Stance on Cryptocurrency: Regulatory Developments",
                "url": "https://example.com/news/crypto-regulation",
                "source": "Crypto Journal",
                "published": datetime.now().isoformat(),
                "summary": "Recent regulatory developments in India suggest a more structured approach to cryptocurrency, with new guidelines expected to be announced in the coming months."
            },
            {
                "title": "Bitcoin Adoption Among Indian Investors Grows Despite Volatility",
                "url": "https://example.com/news/bitcoin-india",
                "source": "Bloomberg",
                "published": datetime.now().isoformat(),
                "summary": "Despite price volatility, Bitcoin adoption continues to grow among Indian investors, particularly among the 25-40 age demographic in urban centers."
            }
        ]
    else:
        return get_fallback_news(query)

def get_fallback_news(query: str) -> List[Dict[str, Any]]:
    """Return fallback financial news"""
    return [
        {
            "title": "Indian Stock Market Shows Strong Recovery After Recent Dip",
            "url": "https://example.com/news/1",
            "source": "Financial Times",
            "published": datetime.now().isoformat(),
            "summary": "The Indian stock market has shown robust recovery following last week's correction, with the Sensex climbing back over 1,000 points."
        },
        {
            "title": "RBI Announces New Policy Measures to Support Economic Growth",
            "url": "https://example.com/news/2",
            "source": "Economic Times",
            "published": datetime.now().isoformat(),
            "summary": "The Reserve Bank of India has announced a series of policy measures aimed at boosting economic growth and supporting small businesses."
        },
        {
            "title": "Technology Sector Leads Market Gains with 3.2% Weekly Growth",
            "url": "https://example.com/news/3",
            "source": "Business Standard",
            "published": datetime.now().isoformat(),
            "summary": "Technology stocks have outperformed other sectors with a 3.2% growth this week, driven by strong earnings reports and positive global cues."
        }
    ]

def generate_risk_analysis() -> Dict[str, Any]:
    """Generate risk analysis data"""
    return {
        "id": len(risk_analyses) + 1,
        "analysisDate": datetime.now().isoformat(),
        "riskScore": round(random.uniform(55, 85), 1),
        "portfolioHealth": random.choice(["excellent", "good", "moderate", "poor"]),
        "diversificationScore": round(random.uniform(60, 90), 1),
        "volatilityMetrics": {
            "beta": round(random.uniform(0.8, 1.3), 2),
            "standardDeviation": round(random.uniform(9, 20), 2),
            "sharpeRatio": round(random.uniform(0.5, 2.1), 2),
            "maxDrawdown": round(random.uniform(-25, -10), 1)
        },
        "recommendations": [
            "Consider increasing your exposure to defensive sectors for better downside protection",
            "Your portfolio has a high correlation to technology sector, which increases risk",
            "Adding more international diversification could improve risk-adjusted returns",
            "Consider adding some fixed income assets to reduce portfolio volatility"
        ],
        "scenarioAnalysis": {
            "marketCrash": {
                "expectedImpact": f"-{round(random.uniform(15, 30), 1)}%",
                "recoveryTime": f"{random.randint(8, 24)} months"
            },
            "recession": {
                "expectedImpact": f"-{round(random.uniform(10, 20), 1)}%",
                "recoveryTime": f"{random.randint(6, 18)} months"
            },
            "highInflation": {
                "expectedImpact": f"-{round(random.uniform(5, 15), 1)}%",
                "recoveryTime": f"{random.randint(3, 12)} months"
            }
        }
    }

def generate_forecast(horizon: str = "medium_term") -> Dict[str, Any]:
    """Generate financial forecast data"""
    forecast_id = len(forecasts) + 1
    
    # Base multipliers for different horizons
    multipliers = {
        "short_term": {"best": 1.15, "worst": 0.9, "mostLikely": 1.05},
        "medium_term": {"best": 1.35, "worst": 0.85, "mostLikely": 1.15},
        "long_term": {"best": 1.8, "worst": 0.75, "mostLikely": 1.45}
    }
    
    m = multipliers.get(horizon, multipliers["medium_term"])
    
    current_net_worth = financial_data.get("netWorth", 100000)
    
    return {
        "id": forecast_id,
        "forecastDate": datetime.now().isoformat(),
        "horizon": horizon,
        "scenarios": {
            "best": {
                "netWorth": round(current_net_worth * m["best"]),
                "monthlyIncome": round(user_profile.get("financialProfile", {}).get("annualIncome", 1200000) / 12 * 1.2),
                "savingsRate": f"{round(random.uniform(25, 40), 1)}%",
                "investmentReturns": f"{round(random.uniform(12, 18), 1)}%"
            },
            "worst": {
                "netWorth": round(current_net_worth * m["worst"]),
                "monthlyIncome": round(user_profile.get("financialProfile", {}).get("annualIncome", 1200000) / 12 * 0.9),
                "savingsRate": f"{round(random.uniform(5, 15), 1)}%",
                "investmentReturns": f"{round(random.uniform(-5, 5), 1)}%"
            },
            "mostLikely": {
                "netWorth": round(current_net_worth * m["mostLikely"]),
                "monthlyIncome": round(user_profile.get("financialProfile", {}).get("annualIncome", 1200000) / 12 * 1.05),
                "savingsRate": f"{round(random.uniform(15, 25), 1)}%",
                "investmentReturns": f"{round(random.uniform(8, 12), 1)}%"
            }
        },
        "assumptions": {
            "inflationRate": f"{round(random.uniform(4, 6), 1)}%",
            "taxRate": f"{round(random.uniform(20, 30), 1)}%",
            "investmentGrowthRate": f"{round(random.uniform(8, 12), 1)}%",
            "incomeGrowthRate": f"{round(random.uniform(5, 10), 1)}%"
        },
        "projections": {
            "retirementCorpus": {
                "target": 50000000,
                "projected": round(random.uniform(35000000, 55000000)),
                "shortfall": f"{round(random.uniform(0, 20), 1)}%",
                "timeToTarget": f"{random.randint(20, 30)} years"
            },
            "majorGoals": [
                {
                    "name": "Home Purchase",
                    "targetAmount": 10000000,
                    "currentSavings": round(random.uniform(2000000, 4000000)),
                    "timeToTarget": f"{random.randint(3, 8)} years",
                    "monthlySavingsRequired": round(random.uniform(40000, 80000))
                },
                {
                    "name": "Children's Education",
                    "targetAmount": 5000000,
                    "currentSavings": round(random.uniform(500000, 1500000)),
                    "timeToTarget": f"{random.randint(10, 15)} years",
                    "monthlySavingsRequired": round(random.uniform(15000, 30000))
                }
            ]
        }
    }

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)