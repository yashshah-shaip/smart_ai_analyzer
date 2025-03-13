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
  // Use the Python API endpoint directly for chat functionality
  const response = await fetch('http://localhost:5000/chat/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return response.json();
}
