from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str
    financial_profile: Optional[Dict[str, Any]] = None
    onboarding_completed: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

class User(UserBase):
    id: str
    financial_profile: Optional[Dict[str, Any]] = None
    onboarding_completed: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class FinancialProfile(BaseModel):
    income: float
    expenses: float
    savings: float
    investment_experience: str
    risk_tolerance: str
    financial_goals: List[str]

class ChatMessage(BaseModel):
    id: Optional[str] = None
    user_id: str
    content: str
    is_user_message: bool
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.now)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

class FinancialData(BaseModel):
    id: Optional[str] = None
    user_id: str
    net_worth: float
    assets: float
    liabilities: float
    portfolio_allocation: Dict[str, float]
    monthly_budget: List[Dict[str, Any]]
    upcoming_bills: List[Dict[str, Any]]
    expense_breakdown: List[Dict[str, Any]]
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class PDFAnalysisRequest(BaseModel):
    file_url: str

class PDFAnalysisResponse(BaseModel):
    assets: Optional[float] = None
    liabilities: Optional[float] = None
    summary: str
    details: Dict[str, Any]