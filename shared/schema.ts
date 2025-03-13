import { pgTable, text, serial, integer, boolean, jsonb, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
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
  portfolioAllocation: jsonb("portfolio_allocation"),
  monthlyBudget: jsonb("monthly_budget"),
  upcomingBills: jsonb("upcoming_bills"),
  expenseBreakdown: jsonb("expense_breakdown"),
  lastUpdated: date("last_updated").notNull().defaultNow(),
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

export type FinancialProfile = z.infer<typeof financialProfileSchema>;
export type PortfolioAllocation = z.infer<typeof portfolioAllocationSchema>;
export type BudgetCategory = z.infer<typeof budgetCategorySchema>;
export type MonthlyBudget = z.infer<typeof monthlyBudgetSchema>;
export type Bill = z.infer<typeof billSchema>;
export type UpcomingBills = z.infer<typeof upcomingBillsSchema>;
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type ExpenseBreakdown = z.infer<typeof expenseBreakdownSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertFinancialData = z.infer<typeof insertFinancialDataSchema>;
export type ChatQuery = z.infer<typeof chatQuerySchema>;

export type User = typeof users.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type FinancialData = typeof financialData.$inferSelect;
