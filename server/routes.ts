import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatQuerySchema, financialProfileSchema } from "@shared/schema";
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
