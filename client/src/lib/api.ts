import { apiRequest } from "./queryClient";
import { ChatResponse } from "./types";
import { FinancialProfile } from "@shared/schema";

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
  return apiRequest("GET", "/api/financial-data", undefined);
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
  const response = await apiRequest("POST", "/api/chat/query", { message });
  return response.json();
}
