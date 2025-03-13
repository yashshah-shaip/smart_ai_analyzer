from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, List, Optional, Any
from datetime import timedelta
from bson.objectid import ObjectId
import json

from .models import (
    User, UserCreate, UserInDB, Token, FinancialProfile, 
    ChatMessage, ChatRequest, ChatResponse, FinancialData,
    PDFAnalysisRequest, PDFAnalysisResponse
)
from .auth import (
    get_current_user, authenticate_user, create_access_token, 
    get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .database import Database
from .ai_chat import FinancialAIChat
from .pdf_processor import PDFProcessor
from .finance_scraper import FinanceScraper

# Initialize routers
auth_router = APIRouter(prefix="/auth", tags=["authentication"])
user_router = APIRouter(prefix="/users", tags=["users"])
chat_router = APIRouter(prefix="/chat", tags=["chat"])
finance_router = APIRouter(prefix="/finance", tags=["finance"])
pdf_router = APIRouter(prefix="/pdf", tags=["pdf"])

# Initialize services
ai_chat = FinancialAIChat()
pdf_processor = PDFProcessor()
finance_scraper = FinanceScraper()

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
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    users_collection = Database.get_collection("users")
    
    # Check if username already exists
    existing_user = await users_collection.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "_id": str(ObjectId()),
        "username": user_data.username,
        "hashed_password": hashed_password,
        "financial_profile": None,
        "onboarding_completed": False
    }
    
    await users_collection.insert_one(user_dict)
    
    return {"id": user_dict["_id"], "username": user_dict["username"]}

@auth_router.get("/status")
async def get_auth_status(current_user: User = Depends(get_current_user)):
    return {
        "authenticated": True,
        "user": current_user,
        "onboardingCompleted": current_user.onboarding_completed
    }

# User routes
@user_router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@user_router.post("/onboarding")
async def complete_onboarding(
    financial_profile: FinancialProfile,
    current_user: User = Depends(get_current_user)
):
    users_collection = Database.get_collection("users")
    financial_data_collection = Database.get_collection("financial_data")
    
    # Update user's financial profile
    await users_collection.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "financial_profile": json.loads(financial_profile.json()),
                "onboarding_completed": True
            }
        }
    )
    
    # Initialize financial data with defaults (in INR)
    initial_data = {
        "_id": str(ObjectId()),
        "user_id": current_user.id,
        "net_worth": 124500,
        "assets": 189300,
        "liabilities": 64800,
        "portfolio_allocation": {
            "stocks": 45,
            "bonds": 25,
            "realEstate": 15,
            "cash": 10,
            "alternatives": 5
        },
        "monthly_budget": [
            {"name": "Housing", "allocated": 2000, "spent": 1800},
            {"name": "Transportation", "allocated": 500, "spent": 450},
            {"name": "Food & Dining", "allocated": 600, "spent": 620},
            {"name": "Entertainment", "allocated": 300, "spent": 180}
        ],
        "upcoming_bills": [
            {"name": "Mortgage", "amount": 1450, "dueInDays": 5},
            {"name": "Auto Loan", "amount": 350, "dueInDays": 12},
            {"name": "Credit Card", "amount": 680, "dueInDays": 18}
        ],
        "expense_breakdown": [
            {"name": "Housing", "amount": 1800},
            {"name": "Food", "amount": 620},
            {"name": "Transport", "amount": 450},
            {"name": "Utilities", "amount": 280},
            {"name": "Entertainment", "amount": 180},
            {"name": "Subscriptions", "amount": 87}
        ]
    }
    
    await financial_data_collection.insert_one(initial_data)
    
    return {"message": "Onboarding completed successfully"}

# Chat routes
@chat_router.get("/history")
async def get_chat_history(current_user: User = Depends(get_current_user)):
    chat_collection = Database.get_collection("chat_messages")
    
    # Get all chat messages for the user
    cursor = chat_collection.find({"user_id": current_user.id}).sort("created_at", 1)
    messages = await cursor.to_list(length=100)  # Limit to last 100 messages
    
    return messages

@chat_router.post("/query", response_model=ChatResponse)
async def process_chat_query(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    chat_collection = Database.get_collection("chat_messages")
    
    # Save user message
    user_message = {
        "_id": str(ObjectId()),
        "user_id": current_user.id,
        "content": chat_request.message,
        "is_user_message": True,
        "metadata": {}
    }
    await chat_collection.insert_one(user_message)
    
    # Generate AI response
    try:
        ai_response = await ai_chat.generate_response(current_user.id, chat_request.message)
        
        # Save AI response
        ai_message = {
            "_id": str(ObjectId()),
            "user_id": current_user.id,
            "content": ai_response,
            "is_user_message": False,
            "metadata": {}
        }
        await chat_collection.insert_one(ai_message)
        
        return {"response": ai_response}
    
    except Exception as e:
        print(f"Error generating AI response: {str(e)}")
        error_message = "I'm sorry, I'm having trouble processing your request right now."
        
        # Save error response
        error_ai_message = {
            "_id": str(ObjectId()),
            "user_id": current_user.id,
            "content": error_message,
            "is_user_message": False,
            "metadata": {"error": str(e)}
        }
        await chat_collection.insert_one(error_ai_message)
        
        return {"response": error_message}

# Finance data routes
@finance_router.get("/data")
async def get_financial_data(current_user: User = Depends(get_current_user)):
    financial_data_collection = Database.get_collection("financial_data")
    
    # Get financial data for the user
    financial_data = await financial_data_collection.find_one({"user_id": current_user.id})
    if not financial_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial data not found"
        )
    
    return financial_data

@finance_router.get("/news")
async def get_financial_news(
    query: str = "Indian stock market",
    current_user: User = Depends(get_current_user)
):
    news = await finance_scraper.search_financial_news(query)
    return {"news": news}

@finance_router.get("/market-summary")
async def get_market_summary(current_user: User = Depends(get_current_user)):
    summary = await finance_scraper.get_market_summary()
    return summary

@finance_router.get("/stock/{ticker}")
async def get_stock_data(
    ticker: str,
    current_user: User = Depends(get_current_user)
):
    stock_data = await finance_scraper.get_stock_information(ticker)
    return stock_data

# PDF processing routes
@pdf_router.post("/analyze", response_model=PDFAnalysisResponse)
async def analyze_pdf(
    request: PDFAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    analysis = await pdf_processor.analyze_financial_document(request.file_url)
    return PDFAnalysisResponse(**analysis)