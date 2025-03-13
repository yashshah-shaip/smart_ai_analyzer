from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Any
import uvicorn
import os
import asyncio
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import Database
from .routes import auth_router, user_router, chat_router, finance_router, pdf_router

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

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(finance_router)
app.include_router(pdf_router)

@app.get("/")
async def root():
    return {"message": "Financial AI API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_db_client():
    await Database.connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await Database.close_mongo_connection()

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="0.0.0.0", port=5000, reload=True)