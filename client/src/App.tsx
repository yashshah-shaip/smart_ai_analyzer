import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";

function Router() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/status", undefined);
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
        setOnboardingCompleted(data.onboardingCompleted);
      } catch (error) {
        console.error("Failed to fetch auth status:", error);
        setIsAuthenticated(false);
        setOnboardingCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [location]);

  // Redirect logic based on authentication and onboarding status
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && location !== "/login") {
      setLocation("/login");
    } else if (isAuthenticated && !onboardingCompleted && location !== "/onboarding") {
      setLocation("/onboarding");
    } else if (isAuthenticated && onboardingCompleted && location === "/onboarding") {
      setLocation("/");
    }
  }, [isAuthenticated, onboardingCompleted, location, setLocation, isLoading]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/login" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
