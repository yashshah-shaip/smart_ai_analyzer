import { pgTable, text, serial, integer, boolean, jsonb, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  phone: text("phone"),
  financialProfile: jsonb("financial_profile"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  timestamp: date("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const financialData = pgTable("financial_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  netWorth: real("net_worth"),
  assets: real("assets"),
  liabilities: real("liabilities"),
  upcomingBills: jsonb("upcoming_bills"),
  expenseBreakdown: jsonb("expense_breakdown"),
  lastUpdated: date("last_updated").notNull().defaultNow(),
});

export const userDocuments = pgTable("user_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(),
  documentType: text("document_type").notNull(), // "investment", "tax", "bank", etc.
  uploadDate: date("upload_date").notNull().defaultNow(),
  content: text("content"), // Extracted text content
  metadata: jsonb("metadata"), // Analysis results
  insights: jsonb("insights"), // AI-generated insights
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // "stock", "bond", "mutual_fund", etc.
  value: real("value").notNull(),
  purchaseDate: date("purchase_date"),
  purchasePrice: real("purchase_price"),
  currentPrice: real("current_price"),
  quantity: real("quantity"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
});

export const riskAnalysis = pgTable("risk_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  analysisDate: date("analysis_date").notNull().defaultNow(),
  riskScore: real("risk_score"),
  recommendations: jsonb("recommendations"),
  portfolioHealth: text("portfolio_health"), // "excellent", "good", "moderate", "poor"
  diversificationScore: real("diversification_score"),
  volatilityMetrics: jsonb("volatility_metrics"),
  scenarioAnalysis: jsonb("scenario_analysis"),
});

export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  reportDate: date("report_date").notNull().defaultNow(),
  reportType: text("report_type").notNull(), // "monthly", "quarterly", "annual"
  reportData: jsonb("report_data"),
  insights: jsonb("insights"),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  totalBudget: real("total_budget"),
  categories: jsonb("categories"),
  status: text("status"), // "active", "completed", "draft"
});

export const forecasts = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  forecastDate: date("forecast_date").notNull().defaultNow(),
  horizon: text("horizon").notNull(), // "short_term", "medium_term", "long_term"
  scenarios: jsonb("scenarios"), // best, worst, most likely
  assumptions: jsonb("assumptions"),
  projections: jsonb("projections"),
});

export const financialProfileSchema = z.object({
  annualIncome: z.number().min(0),
  monthlyExpenses: z.number().min(0),
  employmentStatus: z.enum(['full-time', 'part-time', 'self-employed', 'unemployed', 'retired']),
  savingsGoal: z.number().optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
});

export const portfolioAllocationSchema = z.object({
  stocks: z.number().min(0),
  bonds: z.number().min(0),
  realEstate: z.number().min(0),
  cash: z.number().min(0),
  alternatives: z.number().min(0),
});

export const budgetCategorySchema = z.object({
  name: z.string(),
  allocated: z.number().min(0),
  spent: z.number().min(0),
});

export const monthlyBudgetSchema = z.array(budgetCategorySchema);

export const billSchema = z.object({
  name: z.string(),
  amount: z.number().min(0),
  dueInDays: z.number().min(0),
});

export const upcomingBillsSchema = z.array(billSchema);

export const expenseCategorySchema = z.object({
  name: z.string(),
  amount: z.number().min(0),
});

export const expenseBreakdownSchema = z.array(expenseCategorySchema);

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  avatarUrl: true,
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertFinancialDataSchema = createInsertSchema(financialData).omit({
  id: true,
  lastUpdated: true,
});

export const chatQuerySchema = z.object({
  message: z.string().min(1),
});

// New schemas for documents
export const documentUploadSchema = z.object({
  documentType: z.enum(["investment", "tax", "bank", "insurance", "other"]),
  filename: z.string(),
  fileContent: z.string(), // Base64 encoded content
});

// Investment schemas
export const investmentSchema = z.object({
  name: z.string(),
  type: z.enum(["stock", "bond", "mutual_fund", "etf", "real_estate", "crypto", "other"]),
  value: z.number().min(0),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  currentPrice: z.number().min(0).optional(),
  quantity: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const investmentsListSchema = z.array(investmentSchema);

// Budget schemas
export const budgetSchema = z.object({
  name: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.number().min(0),
  categories: z.array(z.object({
    name: z.string(),
    amount: z.number().min(0),
    spent: z.number().min(0).optional(),
  })),
  status: z.enum(["active", "completed", "draft"]).default("draft"),
});

export const budgetsListSchema = z.array(budgetSchema);

// Risk analysis schema
export const riskAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  portfolioHealth: z.enum(["excellent", "good", "moderate", "poor"]),
  diversificationScore: z.number().min(0).max(100),
  volatilityMetrics: z.record(z.string(), z.any()),
  recommendations: z.array(z.string()),
  scenarioAnalysis: z.record(z.string(), z.any()),
});

// Forecast schema
export const forecastSchema = z.object({
  horizon: z.enum(["short_term", "medium_term", "long_term"]),
  scenarios: z.object({
    best: z.record(z.string(), z.any()),
    worst: z.record(z.string(), z.any()),
    mostLikely: z.record(z.string(), z.any()),
  }),
  assumptions: z.record(z.string(), z.any()),
  projections: z.record(z.string(), z.any()),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  financialProfile: z.object({
    annualIncome: z.number().min(0).optional(),
    monthlyExpenses: z.number().min(0).optional(),
    employmentStatus: z.enum(['full-time', 'part-time', 'self-employed', 'unemployed', 'retired']).optional(),
    savingsGoal: z.number().optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

// Types 
export type FinancialProfile = z.infer<typeof financialProfileSchema>;
export type PortfolioAllocation = z.infer<typeof portfolioAllocationSchema>;
export type BudgetCategory = z.infer<typeof budgetCategorySchema>;
export type MonthlyBudget = z.infer<typeof monthlyBudgetSchema>;
export type Bill = z.infer<typeof billSchema>;
export type UpcomingBills = z.infer<typeof upcomingBillsSchema>;
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type ExpenseBreakdown = z.infer<typeof expenseBreakdownSchema>;
export type DocumentUpload = z.infer<typeof documentUploadSchema>;
export type Investment = z.infer<typeof investmentSchema>;
export type InvestmentsList = z.infer<typeof investmentsListSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type BudgetsList = z.infer<typeof budgetsListSchema>;
export type RiskAnalysis = z.infer<typeof riskAnalysisSchema>;
export type Forecast = z.infer<typeof forecastSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertFinancialData = z.infer<typeof insertFinancialDataSchema>;
export type ChatQuery = z.infer<typeof chatQuerySchema>;

export type User = typeof users.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type FinancialData = typeof financialData.$inferSelect;
export type UserDocument = typeof userDocuments.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type RiskAnalysisRecord = typeof riskAnalysis.$inferSelect;
export type FinancialReport = typeof financialReports.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Forecast = typeof forecasts.$inferSelect;
