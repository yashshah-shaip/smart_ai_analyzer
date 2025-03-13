import { 
  users, 
  type User, 
  type InsertUser, 
  type ChatMessage, 
  type FinancialData,
  type InsertChatMessage,
  type InsertFinancialData,
  type FinancialProfile
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserFinancialProfile(userId: number, profile: FinancialProfile): Promise<User>;
  completeUserOnboarding(userId: number): Promise<User>;
  createFinancialData(data: InsertFinancialData): Promise<FinancialData>;
  getFinancialData(userId: number): Promise<FinancialData | undefined>;
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private financialData: Map<number, FinancialData>;
  private chatMessages: Map<number, ChatMessage[]>;
  private userId: number;
  private financialDataId: number;
  private chatMessageId: number;

  constructor() {
    this.users = new Map();
    this.financialData = new Map();
    this.chatMessages = new Map();
    this.userId = 1;
    this.financialDataId = 1;
    this.chatMessageId = 1;
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
      timestamp: new Date()
    };
    
    const userMessages = this.chatMessages.get(message.userId) || [];
    userMessages.push(chatMessage);
    this.chatMessages.set(message.userId, userMessages);
    
    return chatMessage;
  }
}

export const storage = new MemStorage();
