import { FinancialProfile, ChatMessage } from "@shared/schema";

export interface UserSession {
  id: number;
  username: string;
  financialProfile?: FinancialProfile;
  onboardingCompleted: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserSession | null;
  isLoading: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatResponse {
  response: string;
}
