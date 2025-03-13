import { apiRequest } from "./queryClient";
import { ChatResponse } from "./types";
import { 
  FinancialProfile, 
  DocumentUpload,
  InvestmentData,
  BudgetData,
  RiskAnalysisData,
  ForecastData,
  ProfileUpdate
} from "@shared/schema";

// Authentication
export async function login(username: string, password: string) {
  return apiRequest("POST", "/api/auth/login", { username, password });
}

export async function register(username: string, password: string) {
  return apiRequest("POST", "/api/auth/register", { username, password });
}

export async function logout() {
  return apiRequest("POST", "/api/auth/logout", undefined);
}

export async function getAuthStatus() {
  return apiRequest("GET", "/api/auth/status", undefined);
}

// Financial Data
export async function getFinancialData() {
  // Try to get data from Express server first
  try {
    return apiRequest("GET", "/api/financial-data", undefined);
  } catch (error) {
    // Fallback to direct Python API if Express route fails
    const response = await fetch('http://localhost:5000/finance/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return response;
  }
}

// Onboarding
export async function submitFinancialProfile(profile: FinancialProfile) {
  return apiRequest("POST", "/api/onboarding", profile);
}

// Chat
export async function getChatHistory() {
  return apiRequest("GET", "/api/chat/history", undefined);
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  return apiRequest("POST", "/api/chat/query", { message });
}

// Document methods
export async function getDocuments() {
  return apiRequest("GET", "/api/documents", undefined);
}

export async function getDocument(id: number) {
  return apiRequest("GET", `/api/documents/${id}`, undefined);
}

export async function uploadDocument(document: DocumentUpload) {
  return apiRequest("POST", "/api/documents", document);
}

// Investment methods
export async function getInvestments() {
  return apiRequest("GET", "/api/investments", undefined);
}

export async function getInvestment(id: number) {
  return apiRequest("GET", `/api/investments/${id}`, undefined);
}

export async function createInvestment(investment: InvestmentData) {
  return apiRequest("POST", "/api/investments", investment);
}

export async function updateInvestment(id: number, investment: InvestmentData) {
  return apiRequest("PUT", `/api/investments/${id}`, investment);
}

export async function deleteInvestment(id: number) {
  return apiRequest("DELETE", `/api/investments/${id}`, undefined);
}

// Budget methods
export async function getBudgets() {
  return apiRequest("GET", "/api/budgets", undefined);
}

export async function getBudget(id: number) {
  return apiRequest("GET", `/api/budgets/${id}`, undefined);
}

export async function createBudget(budget: BudgetData) {
  return apiRequest("POST", "/api/budgets", budget);
}

export async function updateBudget(id: number, budget: BudgetData) {
  return apiRequest("PUT", `/api/budgets/${id}`, budget);
}

export async function deleteBudget(id: number) {
  return apiRequest("DELETE", `/api/budgets/${id}`, undefined);
}

// Risk Analysis methods
export async function getRiskAnalysis() {
  return apiRequest("GET", "/api/risk-analysis", undefined);
}

export async function generateRiskAnalysis(documentId?: number) {
  return apiRequest("POST", "/api/risk-analysis", documentId ? { documentId } : undefined);
}

// Forecast methods
export async function getForecasts() {
  return apiRequest("GET", "/api/forecasts", undefined);
}

export async function createForecast(horizon: "short_term" | "medium_term" | "long_term" = "medium_term", documentId?: number) {
  return apiRequest("POST", "/api/forecasts", { horizon, documentId });
}

// Profile methods
export async function getProfile() {
  return apiRequest("GET", "/api/profile", undefined);
}

export async function updateProfile(profile: ProfileUpdate) {
  return apiRequest("PUT", "/api/profile", profile);
}

// AI Advisor methods
export async function getAIInsights() {
  return apiRequest("GET", "/api/ai-advisor/insights", undefined);
}

// Financial News and Market Data
export async function getFinancialNews(query?: string) {
  return apiRequest("GET", `/api/financial-news${query ? `?query=${encodeURIComponent(query)}` : ''}`, undefined);
}

export async function getMarketSummary() {
  return apiRequest("GET", "/api/market-summary", undefined);
}
