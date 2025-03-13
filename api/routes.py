from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from bson.objectid import ObjectId

from .auth import authenticate_user, create_access_token, get_current_user
from .models import (
    User, UserCreate, UserInDB, Token,
    FinancialProfile, ChatMessage, ChatRequest, ChatResponse,
    FinancialData, PDFAnalysisRequest, PDFAnalysisResponse
)
from .database import Database
from .ai_chat import FinancialAIChat
from .finance_scraper import FinanceScraper
from .pdf_processor import PDFProcessor

# Initialize routers
auth_router = APIRouter(prefix="/auth", tags=["authentication"])
user_router = APIRouter(prefix="/users", tags=["users"])
chat_router = APIRouter(prefix="/chat", tags=["chat"])
finance_router = APIRouter(prefix="/finance", tags=["finance"])
pdf_router = APIRouter(prefix="/pdf", tags=["pdf"])

# Initialize services
ai_chat = FinancialAIChat()
finance_scraper = FinanceScraper()
pdf_processor = PDFProcessor()

# Authentication routes
@auth_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    # Check if user already exists
    db = Database.get_collection("users")
    existing_user = await db.find_one({"username": user_data.username})
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    from .auth import get_password_hash
    hashed_password = get_password_hash(user_data.password)
    
    user_in_db = UserInDB(
        id=str(ObjectId()),
        username=user_data.username,
        hashed_password=hashed_password,
        financial_profile=None,
        onboarding_completed=False
    )
    
    await db.insert_one(user_in_db.dict())
    
    return User(
        id=user_in_db.id,
        username=user_in_db.username,
        financial_profile=user_in_db.financial_profile,
        onboarding_completed=user_in_db.onboarding_completed
    )

# User routes
@auth_router.get("/status", response_model=Dict[str, Any])
async def get_auth_status(current_user: User = Depends(get_current_user)):
    return {
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "financialProfile": current_user.financial_profile,
            "onboardingCompleted": current_user.onboarding_completed
        }
    }

@user_router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@user_router.post("/onboarding", response_model=Dict[str, str])
async def complete_onboarding(
    financial_profile: FinancialProfile,
    current_user: User = Depends(get_current_user)
):
    db = Database.get_collection("users")
    
    # Update user with financial profile
    await db.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "financial_profile": financial_profile.dict(),
                "onboarding_completed": True
            }
        }
    )
    
    # Initialize financial data
    fin_db = Database.get_collection("financial_data")
    
    # Check if financial data already exists
    existing_data = await fin_db.find_one({"user_id": current_user.id})
    if not existing_data:
        # Create initial financial data
        financial_data = FinancialData(
            id=str(ObjectId()),
            user_id=current_user.id,
            net_worth=124500,
            assets=189300,
            liabilities=64800,
            portfolio_allocation={
                "stocks": 45,
                "bonds": 25,
                "realEstate": 15,
                "cash": 10,
                "alternatives": 5
            },
            monthly_budget=[
                {"name": "Housing", "allocated": 2000, "spent": 1800},
                {"name": "Transportation", "allocated": 500, "spent": 450},
                {"name": "Food & Dining", "allocated": 600, "spent": 620},
                {"name": "Entertainment", "allocated": 300, "spent": 180}
            ],
            upcoming_bills=[
                {"name": "Mortgage", "amount": 1450, "dueInDays": 5},
                {"name": "Auto Loan", "amount": 350, "dueInDays": 12},
                {"name": "Credit Card", "amount": 680, "dueInDays": 18}
            ],
            expense_breakdown=[
                {"name": "Housing", "amount": 1800},
                {"name": "Food", "amount": 620},
                {"name": "Transport", "amount": 450},
                {"name": "Utilities", "amount": 280},
                {"name": "Entertainment", "amount": 180},
                {"name": "Subscriptions", "amount": 87}
            ]
        )
        
        await fin_db.insert_one(financial_data.dict())
    
    return {"message": "Onboarding completed successfully"}

# Chat routes
@chat_router.get("/history", response_model=List[ChatMessage])
async def get_chat_history(current_user: User = Depends(get_current_user)):
    chat_db = Database.get_collection("chat_messages")
    cursor = chat_db.find({"user_id": current_user.id}).sort("created_at", -1).limit(20)
    
    messages = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        messages.append(ChatMessage(**doc))
    
    return sorted(messages, key=lambda x: x.created_at)

@chat_router.post("/query", response_model=ChatResponse)
async def process_chat_query(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    # Save user message
    chat_db = Database.get_collection("chat_messages")
    
    user_message = ChatMessage(
        id=str(ObjectId()),
        user_id=current_user.id,
        content=chat_request.message,
        is_user_message=True,
        metadata={},
    )
    
    await chat_db.insert_one(user_message.dict(by_alias=True))
    
    # Generate AI response
    ai_response = await ai_chat.generate_response(current_user.id, chat_request.message)
    
    # Save AI response
    ai_message = ChatMessage(
        id=str(ObjectId()),
        user_id=current_user.id,
        content=ai_response,
        is_user_message=False,
        metadata={}
    )
    
    await chat_db.insert_one(ai_message.dict(by_alias=True))
    
    return ChatResponse(response=ai_response)

# Financial data routes
@finance_router.get("/data", response_model=FinancialData)
async def get_financial_data(current_user: User = Depends(get_current_user)):
    fin_db = Database.get_collection("financial_data")
    data = await fin_db.find_one({"user_id": current_user.id})
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial data not found"
        )
    
    data["id"] = str(data.pop("_id"))
    return FinancialData(**data)

@finance_router.get("/news", response_model=List[Dict[str, Any]])
async def get_financial_news(
    query: str = "Indian stock market",
    current_user: User = Depends(get_current_user)
):
    news = await finance_scraper.search_financial_news(query)
    return news

@finance_router.get("/market-summary", response_model=Dict[str, Any])
async def get_market_summary(current_user: User = Depends(get_current_user)):
    summary = await finance_scraper.get_market_summary()
    return summary

@finance_router.get("/stock/{ticker}", response_model=Dict[str, Any])
async def get_stock_data(
    ticker: str,
    current_user: User = Depends(get_current_user)
):
    stock_data = await finance_scraper.get_stock_information(ticker)
    return stock_data

# PDF analysis routes
@pdf_router.post("/analyze", response_model=PDFAnalysisResponse)
async def analyze_pdf(
    request: PDFAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    result = await pdf_processor.analyze_financial_document(request.file_url)
    return PDFAnalysisResponse(
        assets=result.get("assets"),
        liabilities=result.get("liabilities"),
        summary=result.get("summary", "Document analysis complete"),
        details=result.get("details", {})
    )