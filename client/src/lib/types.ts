import { 
  FinancialProfile, 
  ChatMessage, 
  InvestmentData,
  InvestmentRecord, 
  BudgetData,
  BudgetRecord,
  UserDocument,
  RiskAnalysisData,
  ForecastData,
  ProfileUpdate
} from "@shared/schema";

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

export interface DocumentState {
  documents: UserDocument[];
  isLoading: boolean;
  error: string | null;
}

export interface InvestmentState {
  investments: InvestmentRecord[];
  isLoading: boolean;
  error: string | null;
}

export interface BudgetState {
  budgets: BudgetRecord[];
  isLoading: boolean;
  error: string | null;
}

export interface RiskAnalysisState {
  analysis: RiskAnalysisData | null;
  isLoading: boolean;
  error: string | null;
}

export interface ForecastState {
  forecasts: ForecastData[];
  isLoading: boolean;
  error: string | null;
}

export interface ProfileState {
  profile: {
    id: number;
    username: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    financialProfile: FinancialProfile | null;
    onboardingCompleted: boolean;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export interface AIInsight {
  category: string;
  action: string;
  impact: "Low" | "Medium" | "High";
  details: string;
}

export interface AIAdvisorState {
  insights: string[];
  recommendations: AIInsight[];
  isLoading: boolean;
  error: string | null;
}

export interface FinancialNewsItem {
  title: string;
  url: string;
  source: string;
  published: string;
  summary: string;
}

export interface MarketSummary {
  sensex: {
    value: number;
    change: number;
    percentChange: number;
  };
  nifty: {
    value: number;
    change: number;
    percentChange: number;
  };
  topGainers: Array<{ name: string; change: number }>;
  topLosers: Array<{ name: string; change: number }>;
}

export interface FinancialNewsState {
  news: FinancialNewsItem[];
  isLoading: boolean;
  error: string | null;
}

export interface MarketState {
  summary: MarketSummary | null;
  isLoading: boolean;
  error: string | null;
}
