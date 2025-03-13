import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  chatQuerySchema, 
  financialProfileSchema, 
  documentUploadSchema,
  investmentSchema,
  budgetSchema,
  profileUpdateSchema,
  riskAnalysisSchema,
  forecastSchema
} from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { randomUUID } from "crypto";
import axios from "axios";
import { startPythonServer, pythonApiProxy } from "./python-bridge";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the Python FastAPI server
  try {
    await startPythonServer();
    console.log("Python FastAPI server started successfully");
  } catch (error) {
    console.error("Failed to start Python FastAPI server:", error);
  }
  
  // Add proxy for Python API routes
  app.use("/api/python", pythonApiProxy);
  // Set up session middleware
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "finance-ai-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  });

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (user.password !== password) {
          // In a real app, use proper password hashing!
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userInput = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userInput.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userInput);
      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json({ id: user.id, username: user.username });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Check authentication status
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ 
        authenticated: true, 
        user: req.user,
        onboardingCompleted: (req.user as any)?.onboardingCompleted || false
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Ensure user is authenticated for protected routes
  const ensureAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Onboarding routes
  app.post("/api/onboarding", ensureAuth, async (req, res) => {
    try {
      const financialProfile = financialProfileSchema.parse(req.body);
      const userId = (req.user as any).id;
      
      await storage.updateUserFinancialProfile(userId, financialProfile);
      await storage.completeUserOnboarding(userId);
      
      // Initialize financial data with defaults
      const initialData = {
        userId,
        netWorth: 124500,
        assets: 189300,
        liabilities: 64800,
        portfolioAllocation: {
          stocks: 45,
          bonds: 25,
          realEstate: 15,
          cash: 10,
          alternatives: 5
        },
        monthlyBudget: [
          { name: "Housing", allocated: 2000, spent: 1800 },
          { name: "Transportation", allocated: 500, spent: 450 },
          { name: "Food & Dining", allocated: 600, spent: 620 },
          { name: "Entertainment", allocated: 300, spent: 180 }
        ],
        upcomingBills: [
          { name: "Mortgage", amount: 1450, dueInDays: 5 },
          { name: "Auto Loan", amount: 350, dueInDays: 12 },
          { name: "Credit Card", amount: 680, dueInDays: 18 }
        ],
        expenseBreakdown: [
          { name: "Housing", amount: 1800 },
          { name: "Food", amount: 620 },
          { name: "Transport", amount: 450 },
          { name: "Utilities", amount: 280 },
          { name: "Entertainment", amount: 180 },
          { name: "Subscriptions", amount: 87 }
        ]
      };
      
      await storage.createFinancialData(initialData);
      
      res.status(200).json({ message: "Onboarding completed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Financial data routes
  app.get("/api/financial-data", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const financialData = await storage.getFinancialData(userId);
      
      if (!financialData) {
        return res.status(404).json({ message: "Financial data not found" });
      }
      
      res.json(financialData);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chat message routes
  app.get("/api/chat/history", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/chat/query", ensureAuth, async (req, res) => {
    try {
      const { message } = chatQuerySchema.parse(req.body);
      const userId = (req.user as any).id;
      
      // Save user message
      await storage.createChatMessage({
        userId,
        content: message,
        isUserMessage: true,
        metadata: {}
      });

      // Call the Python backend for AI response
      try {
        // Make API call to Python backend
        const response = await axios.post(`http://localhost:5000/chat/query`, {
          message: message
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer temp-token-${userId}` // Simplified for demo
          }
        });
        
        const aiResponse = response.data.response;
        
        // Save AI response
        await storage.createChatMessage({
          userId,
          content: aiResponse,
          isUserMessage: false,
          metadata: {}
        });
        
        res.json({ response: aiResponse });
      } catch (error) {
        console.error("AI query error:", error);
        res.status(500).json({ message: "Failed to get AI response" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document routes
  app.get("/api/documents", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const documents = await storage.getDocuments(userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents/:id", ensureAuth, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/documents", ensureAuth, async (req, res) => {
    try {
      const documentData = documentUploadSchema.parse(req.body);
      const userId = (req.user as any).id;
      
      // Create document in local storage
      const document = await storage.createDocument(userId, documentData);
      
      // Call Python API to process document and get insights
      try {
        const response = await axios.post(`http://localhost:5000/documents/upload`, documentData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer temp-token-${userId}`
          }
        });
        
        // Return document with insights from Python backend
        res.status(201).json({
          ...document,
          insights: response.data.insights
        });
      } catch (error) {
        console.error("Document processing error:", error);
        res.status(201).json(document); // Return document even if processing failed
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Investment routes
  app.get("/api/investments", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const investments = await storage.getInvestments(userId);
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/investments/:id", ensureAuth, async (req, res) => {
    try {
      const investmentId = parseInt(req.params.id);
      const investment = await storage.getInvestment(investmentId);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      if (investment.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(investment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/investments", ensureAuth, async (req, res) => {
    try {
      const investmentData = investmentSchema.parse(req.body);
      const userId = (req.user as any).id;
      const investment = await storage.createInvestment(userId, investmentData);
      res.status(201).json(investment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/investments/:id", ensureAuth, async (req, res) => {
    try {
      const investmentId = parseInt(req.params.id);
      const investmentData = investmentSchema.parse(req.body);
      const existingInvestment = await storage.getInvestment(investmentId);
      
      if (!existingInvestment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      if (existingInvestment.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedInvestment = await storage.updateInvestment(investmentId, investmentData);
      res.json(updatedInvestment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/investments/:id", ensureAuth, async (req, res) => {
    try {
      const investmentId = parseInt(req.params.id);
      const investment = await storage.getInvestment(investmentId);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      if (investment.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteInvestment(investmentId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete investment" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Budget routes
  app.get("/api/budgets", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/budgets/:id", ensureAuth, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const budget = await storage.getBudget(budgetId);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(budget);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/budgets", ensureAuth, async (req, res) => {
    try {
      const budgetData = budgetSchema.parse(req.body);
      const userId = (req.user as any).id;
      const budget = await storage.createBudget(userId, budgetData);
      res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/budgets/:id", ensureAuth, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const budgetData = budgetSchema.parse(req.body);
      const existingBudget = await storage.getBudget(budgetId);
      
      if (!existingBudget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (existingBudget.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedBudget = await storage.updateBudget(budgetId, budgetData);
      res.json(updatedBudget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/budgets/:id", ensureAuth, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const budget = await storage.getBudget(budgetId);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      if (budget.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteBudget(budgetId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete budget" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Risk Analysis routes
  app.get("/api/risk-analysis", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const analyses = await storage.getRiskAnalyses(userId);
      
      if (analyses.length > 0) {
        res.json(analyses[analyses.length - 1]); // Return most recent analysis
      } else {
        // If no analysis exists, create one by calling Python API
        try {
          const response = await axios.get(`http://localhost:5000/risk-analysis`, {
            headers: {
              'Authorization': `Bearer temp-token-${userId}`
            }
          });
          
          // Create risk analysis in storage
          const analysisData = riskAnalysisSchema.parse(response.data);
          const analysis = await storage.createRiskAnalysis(userId, analysisData);
          res.json(analysis);
        } catch (error) {
          console.error("Risk analysis error:", error);
          res.status(500).json({ message: "Failed to generate risk analysis" });
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/risk-analysis", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const documentId = req.body.documentId; // Optional document ID to analyze
      
      try {
        // Call Python API to generate risk analysis
        const response = await axios.post(`http://localhost:5000/risk-analysis/analyze-portfolio`, 
          documentId ? { document_id: documentId } : {}, 
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer temp-token-${userId}`
            }
          }
        );
        
        // Create risk analysis in storage
        const analysisData = riskAnalysisSchema.parse(response.data);
        const analysis = await storage.createRiskAnalysis(userId, analysisData);
        res.json(analysis);
      } catch (error) {
        console.error("Risk analysis error:", error);
        res.status(500).json({ message: "Failed to generate risk analysis" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Forecast routes
  app.get("/api/forecasts", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const forecasts = await storage.getForecasts(userId);
      
      if (forecasts.length > 0) {
        res.json(forecasts); // Return all forecasts
      } else {
        // If no forecast exists, create one by calling Python API
        try {
          const response = await axios.get(`http://localhost:5000/forecasts`, {
            headers: {
              'Authorization': `Bearer temp-token-${userId}`
            }
          });
          
          // Create forecast in storage (assuming response is an array)
          if (Array.isArray(response.data) && response.data.length > 0) {
            const forecastData = forecastSchema.parse(response.data[0]);
            const forecast = await storage.createForecast(userId, forecastData);
            res.json([forecast]);
          } else {
            res.json([]);
          }
        } catch (error) {
          console.error("Forecast generation error:", error);
          res.status(500).json({ message: "Failed to generate forecast" });
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/forecasts", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { horizon, documentId } = req.body;
      
      try {
        // Call Python API to generate forecast
        const response = await axios.post(`http://localhost:5000/forecasts`, 
          { 
            horizon: horizon || "medium_term",
            document_id: documentId || null
          }, 
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer temp-token-${userId}`
            }
          }
        );
        
        // Create forecast in storage
        const forecastData = forecastSchema.parse(response.data);
        const forecast = await storage.createForecast(userId, forecastData);
        res.json(forecast);
      } catch (error) {
        console.error("Forecast generation error:", error);
        res.status(500).json({ message: "Failed to generate forecast" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User profile routes
  app.get("/api/profile", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user profile data (exclude sensitive data like password)
      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        financialProfile: user.financialProfile,
        onboardingCompleted: user.onboardingCompleted
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/profile", ensureAuth, async (req, res) => {
    try {
      const profileData = profileUpdateSchema.parse(req.body);
      const userId = (req.user as any).id;
      
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      
      // Return updated profile (exclude sensitive data)
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        financialProfile: updatedUser.financialProfile,
        onboardingCompleted: updatedUser.onboardingCompleted
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI advisor insights
  app.get("/api/ai-advisor/insights", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      try {
        // Call Python API to get AI insights
        const response = await axios.get(`http://localhost:5000/ai-advisor/insights`, {
          headers: {
            'Authorization': `Bearer temp-token-${userId}`
          }
        });
        
        res.json(response.data);
      } catch (error) {
        console.error("AI advisor error:", error);
        res.status(500).json({ message: "Failed to get AI insights" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Financial news
  app.get("/api/financial-news", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const query = req.query.query as string || "Indian stock market";
      
      try {
        // Call Python API to get financial news
        const response = await axios.get(`http://localhost:5000/finance/news`, {
          params: { query },
          headers: {
            'Authorization': `Bearer temp-token-${userId}`
          }
        });
        
        res.json(response.data);
      } catch (error) {
        console.error("Financial news error:", error);
        res.status(500).json({ message: "Failed to get financial news" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Market summary
  app.get("/api/market-summary", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      try {
        // Call Python API to get market summary
        const response = await axios.get(`http://localhost:5000/finance/market-summary`, {
          headers: {
            'Authorization': `Bearer temp-token-${userId}`
          }
        });
        
        res.json(response.data);
      } catch (error) {
        console.error("Market summary error:", error);
        res.status(500).json({ message: "Failed to get market summary" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to simulate AI response
// In production, this would be replaced with a real API call to the Python backend
async function simulateAIResponse(message: string, userId: number): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple pattern matching for demo - in production this would call your Python backend
  if (message.toLowerCase().includes("savings")) {
    return "Based on your current spending patterns, I've identified several opportunities to increase your savings rate. Your food and dining expenses are currently $620, which is $20 over your budget. Consider meal planning to reduce dining out expenses. You're also spending $87 monthly on subscriptions that could be reviewed. Making these changes could increase your monthly savings by approximately $180-$250.";
  } else if (message.toLowerCase().includes("investment")) {
    return "Looking at your risk profile and financial goals, I recommend a diversified portfolio with 60% stocks, 25% bonds, and 15% alternative investments. For the additional savings we discussed, consider allocating them to a tax-advantaged retirement account first, then to a low-cost index fund that tracks the broader market.";
  } else if (message.toLowerCase().includes("debt")) {
    return "Your current debt consists of a $1,450 mortgage payment, $350 auto loan, and $680 in credit card debt. I recommend prioritizing paying off the credit card debt first as it likely has the highest interest rate. Once that's eliminated, you could potentially save up to $75 monthly in interest payments.";
  } else {
    return "I'm here to help with your financial questions. You can ask me about your spending patterns, investment options, debt management strategies, or any other financial concerns you have.";
  }
}

import { insertUserSchema } from "@shared/schema";
