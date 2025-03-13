import { 
  users, 
  type User, 
  type InsertUser, 
  type ChatMessage, 
  type FinancialData,
  type InsertChatMessage,
  type InsertFinancialData,
  type FinancialProfile,
  type ProfileUpdate,
  type InvestmentData,
  type BudgetData,
  type DocumentUpload,
  type UserDocument,
  type InvestmentRecord,
  type RiskAnalysisData,
  type RiskAnalysisRecord,
  type BudgetRecord,
  type ForecastData,
  type ForecastRecord
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserFinancialProfile(userId: number, profile: FinancialProfile): Promise<User>;
  completeUserOnboarding(userId: number): Promise<User>;
  updateUserProfile(userId: number, profile: ProfileUpdate): Promise<User>;
  
  // Financial data operations
  createFinancialData(data: InsertFinancialData): Promise<FinancialData>;
  getFinancialData(userId: number): Promise<FinancialData | undefined>;
  
  // Chat operations
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Document operations
  getDocuments(userId: number): Promise<UserDocument[]>;
  getDocument(id: number): Promise<UserDocument | undefined>;
  createDocument(userId: number, document: DocumentUpload): Promise<UserDocument>;
  
  // Investment operations
  getInvestments(userId: number): Promise<InvestmentRecord[]>;
  getInvestment(id: number): Promise<InvestmentRecord | undefined>;
  createInvestment(userId: number, investment: InvestmentData): Promise<InvestmentRecord>;
  updateInvestment(id: number, investment: InvestmentData): Promise<InvestmentRecord>;
  deleteInvestment(id: number): Promise<boolean>;
  
  // Budget operations
  getBudgets(userId: number): Promise<BudgetRecord[]>;
  getBudget(id: number): Promise<BudgetRecord | undefined>;
  createBudget(userId: number, budget: BudgetData): Promise<BudgetRecord>;
  updateBudget(id: number, budget: BudgetData): Promise<BudgetRecord>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Risk Analysis operations
  getRiskAnalyses(userId: number): Promise<RiskAnalysisRecord[]>;
  createRiskAnalysis(userId: number, analysis: RiskAnalysisData): Promise<RiskAnalysisRecord>;
  
  // Forecast operations
  getForecasts(userId: number): Promise<ForecastRecord[]>;
  createForecast(userId: number, forecast: ForecastData): Promise<ForecastRecord>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private financialData: Map<number, FinancialData>;
  private chatMessages: Map<number, ChatMessage[]>;
  private documents: Map<number, UserDocument>;
  private investments: Map<number, InvestmentRecord>;
  private budgets: Map<number, BudgetRecord>;
  private riskAnalyses: Map<number, RiskAnalysisRecord>;
  private forecasts: Map<number, ForecastRecord>;
  
  // ID counters
  private userId: number;
  private financialDataId: number;
  private chatMessageId: number;
  private documentId: number;
  private investmentId: number;
  private budgetId: number;
  private riskAnalysisId: number;
  private forecastId: number;
  
  // User ID mappings
  private userDocuments: Map<number, number[]>;
  private userInvestments: Map<number, number[]>;
  private userBudgets: Map<number, number[]>;
  private userRiskAnalyses: Map<number, number[]>;
  private userForecasts: Map<number, number[]>;

  constructor() {
    // Storage
    this.users = new Map();
    this.financialData = new Map();
    this.chatMessages = new Map();
    this.documents = new Map();
    this.investments = new Map();
    this.budgets = new Map();
    this.riskAnalyses = new Map();
    this.forecasts = new Map();
    
    // ID counters
    this.userId = 1;
    this.financialDataId = 1;
    this.chatMessageId = 1;
    this.documentId = 1;
    this.investmentId = 1;
    this.budgetId = 1;
    this.riskAnalysisId = 1;
    this.forecastId = 1;
    
    // User ID mappings
    this.userDocuments = new Map();
    this.userInvestments = new Map();
    this.userBudgets = new Map();
    this.userRiskAnalyses = new Map();
    this.userForecasts = new Map();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      financialProfile: null, 
      onboardingCompleted: false 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserFinancialProfile(userId: number, profile: FinancialProfile): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = {
      ...user,
      financialProfile: profile
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async completeUserOnboarding(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = {
      ...user,
      onboardingCompleted: true
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createFinancialData(data: InsertFinancialData): Promise<FinancialData> {
    const id = this.financialDataId++;
    const financialData: FinancialData = {
      ...data,
      id,
      lastUpdated: new Date()
    };
    
    this.financialData.set(data.userId, financialData);
    return financialData;
  }

  async getFinancialData(userId: number): Promise<FinancialData | undefined> {
    return this.financialData.get(userId);
  }

  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return this.chatMessages.get(userId) || [];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const chatMessage: ChatMessage = {
      ...message,
      id,
      timestamp: new Date() as unknown as string // Fix type issue for now
    };
    
    const userMessages = this.chatMessages.get(message.userId) || [];
    userMessages.push(chatMessage);
    this.chatMessages.set(message.userId, userMessages);
    
    return chatMessage;
  }

  // User Profile methods
  async updateUserProfile(userId: number, profile: ProfileUpdate): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create updated user data by merging existing with updates
    const updatedUser = {
      ...user,
      fullName: profile.fullName !== undefined ? profile.fullName : user.fullName,
      email: profile.email !== undefined ? profile.email : user.email,
      phone: profile.phone !== undefined ? profile.phone : user.phone,
      avatarUrl: profile.avatarUrl !== undefined ? profile.avatarUrl : user.avatarUrl,
      financialProfile: profile.financialProfile ? {
        ...user.financialProfile as FinancialProfile, 
        ...profile.financialProfile
      } : user.financialProfile
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Document methods
  async getDocuments(userId: number): Promise<UserDocument[]> {
    const documentIds = this.userDocuments.get(userId) || [];
    return documentIds.map(id => this.documents.get(id)).filter(Boolean) as UserDocument[];
  }
  
  async getDocument(id: number): Promise<UserDocument | undefined> {
    return this.documents.get(id);
  }
  
  async createDocument(userId: number, document: DocumentUpload): Promise<UserDocument> {
    const id = this.documentId++;
    const now = new Date() as unknown as string; // Fix type issue for now
    
    const newDocument: UserDocument = {
      id,
      userId,
      filename: document.filename,
      documentType: document.documentType,
      uploadDate: now,
      content: "",
      metadata: {},
      insights: {}
    };
    
    this.documents.set(id, newDocument);
    
    // Add to user's documents
    const userDocs = this.userDocuments.get(userId) || [];
    userDocs.push(id);
    this.userDocuments.set(userId, userDocs);
    
    return newDocument;
  }
  
  // Investment methods
  async getInvestments(userId: number): Promise<InvestmentRecord[]> {
    const investmentIds = this.userInvestments.get(userId) || [];
    return investmentIds.map(id => this.investments.get(id)).filter(Boolean) as InvestmentRecord[];
  }
  
  async getInvestment(id: number): Promise<InvestmentRecord | undefined> {
    return this.investments.get(id);
  }
  
  async createInvestment(userId: number, investment: InvestmentData): Promise<InvestmentRecord> {
    const id = this.investmentId++;
    
    const newInvestment: InvestmentRecord = {
      id,
      userId,
      name: investment.name,
      type: investment.type,
      value: investment.value,
      purchaseDate: investment.purchaseDate as unknown as Date,
      purchasePrice: investment.purchasePrice,
      currentPrice: investment.currentPrice,
      quantity: investment.quantity,
      notes: investment.notes,
      metadata: {}
    };
    
    this.investments.set(id, newInvestment);
    
    // Add to user's investments
    const userInvs = this.userInvestments.get(userId) || [];
    userInvs.push(id);
    this.userInvestments.set(userId, userInvs);
    
    return newInvestment;
  }
  
  async updateInvestment(id: number, investment: InvestmentData): Promise<InvestmentRecord> {
    const existingInvestment = this.investments.get(id);
    if (!existingInvestment) {
      throw new Error(`Investment with ID ${id} not found`);
    }
    
    const updatedInvestment: InvestmentRecord = {
      ...existingInvestment,
      name: investment.name,
      type: investment.type,
      value: investment.value,
      purchaseDate: investment.purchaseDate as unknown as Date || existingInvestment.purchaseDate,
      purchasePrice: investment.purchasePrice ?? existingInvestment.purchasePrice,
      currentPrice: investment.currentPrice ?? existingInvestment.currentPrice,
      quantity: investment.quantity ?? existingInvestment.quantity,
      notes: investment.notes ?? existingInvestment.notes,
    };
    
    this.investments.set(id, updatedInvestment);
    return updatedInvestment;
  }
  
  async deleteInvestment(id: number): Promise<boolean> {
    const investment = this.investments.get(id);
    if (!investment) {
      return false;
    }
    
    // Remove from investments map
    this.investments.delete(id);
    
    // Remove from user's investments list
    const userId = investment.userId;
    const userInvs = this.userInvestments.get(userId) || [];
    const updatedUserInvs = userInvs.filter(invId => invId !== id);
    this.userInvestments.set(userId, updatedUserInvs);
    
    return true;
  }
  
  // Budget methods
  async getBudgets(userId: number): Promise<BudgetRecord[]> {
    const budgetIds = this.userBudgets.get(userId) || [];
    return budgetIds.map(id => this.budgets.get(id)).filter(Boolean) as BudgetRecord[];
  }
  
  async getBudget(id: number): Promise<BudgetRecord | undefined> {
    return this.budgets.get(id);
  }
  
  async createBudget(userId: number, budget: BudgetData): Promise<BudgetRecord> {
    const id = this.budgetId++;
    
    const newBudget: BudgetRecord = {
      id,
      userId,
      name: budget.name,
      startDate: budget.startDate as unknown as Date,
      endDate: budget.endDate as unknown as Date,
      totalBudget: budget.totalBudget,
      categories: budget.categories,
      status: budget.status
    };
    
    this.budgets.set(id, newBudget);
    
    // Add to user's budgets
    const userBudgets = this.userBudgets.get(userId) || [];
    userBudgets.push(id);
    this.userBudgets.set(userId, userBudgets);
    
    return newBudget;
  }
  
  async updateBudget(id: number, budget: BudgetData): Promise<BudgetRecord> {
    const existingBudget = this.budgets.get(id);
    if (!existingBudget) {
      throw new Error(`Budget with ID ${id} not found`);
    }
    
    const updatedBudget: BudgetRecord = {
      ...existingBudget,
      name: budget.name,
      startDate: budget.startDate as unknown as Date || existingBudget.startDate,
      endDate: budget.endDate as unknown as Date || existingBudget.endDate,
      totalBudget: budget.totalBudget,
      categories: budget.categories,
      status: budget.status
    };
    
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }
  
  async deleteBudget(id: number): Promise<boolean> {
    const budget = this.budgets.get(id);
    if (!budget) {
      return false;
    }
    
    // Remove from budgets map
    this.budgets.delete(id);
    
    // Remove from user's budgets list
    const userId = budget.userId;
    const userBudgets = this.userBudgets.get(userId) || [];
    const updatedUserBudgets = userBudgets.filter(budgetId => budgetId !== id);
    this.userBudgets.set(userId, updatedUserBudgets);
    
    return true;
  }
  
  // Risk Analysis methods
  async getRiskAnalyses(userId: number): Promise<RiskAnalysisRecord[]> {
    const analysisIds = this.userRiskAnalyses.get(userId) || [];
    return analysisIds.map(id => this.riskAnalyses.get(id)).filter(Boolean) as RiskAnalysisRecord[];
  }
  
  async createRiskAnalysis(userId: number, analysis: RiskAnalysisData): Promise<RiskAnalysisRecord> {
    const id = this.riskAnalysisId++;
    const now = new Date() as unknown as string; // Fix type issue for now
    
    const newAnalysis: RiskAnalysisRecord = {
      id,
      userId,
      analysisDate: now,
      riskScore: analysis.riskScore,
      portfolioHealth: analysis.portfolioHealth,
      diversificationScore: analysis.diversificationScore,
      volatilityMetrics: analysis.volatilityMetrics,
      recommendations: analysis.recommendations,
      scenarioAnalysis: analysis.scenarioAnalysis
    };
    
    this.riskAnalyses.set(id, newAnalysis);
    
    // Add to user's risk analyses
    const userAnalyses = this.userRiskAnalyses.get(userId) || [];
    userAnalyses.push(id);
    this.userRiskAnalyses.set(userId, userAnalyses);
    
    return newAnalysis;
  }
  
  // Forecast methods
  async getForecasts(userId: number): Promise<ForecastRecord[]> {
    const forecastIds = this.userForecasts.get(userId) || [];
    return forecastIds.map(id => this.forecasts.get(id)).filter(Boolean) as ForecastRecord[];
  }
  
  async createForecast(userId: number, forecast: ForecastData): Promise<ForecastRecord> {
    const id = this.forecastId++;
    const now = new Date() as unknown as string; // Fix type issue for now
    
    const newForecast: ForecastRecord = {
      id,
      userId,
      forecastDate: now,
      horizon: forecast.horizon,
      scenarios: forecast.scenarios,
      assumptions: forecast.assumptions,
      projections: forecast.projections
    };
    
    this.forecasts.set(id, newForecast);
    
    // Add to user's forecasts
    const userForecasts = this.userForecasts.get(userId) || [];
    userForecasts.push(id);
    this.userForecasts.set(userId, userForecasts);
    
    return newForecast;
  }
}

export const storage = new MemStorage();
