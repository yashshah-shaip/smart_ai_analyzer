import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { financialProfileSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

// Extend the schema with required fields for the form
const onboardingSchema = financialProfileSchema.extend({
  annualIncome: z.number().min(1, "Income is required"),
  monthlyExpenses: z.number().min(1, "Monthly expenses are required"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      annualIncome: 0,
      monthlyExpenses: 0,
      employmentStatus: "full-time",
      savingsGoal: 0,
      riskTolerance: "medium",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: OnboardingFormValues) => {
      return apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: () => {
      toast({
        title: "Onboarding completed!",
        description: "Your financial profile has been set up.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Something went wrong",
        description: "Failed to save your financial profile. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving onboarding data:", error);
    },
  });

  const onSubmit = (data: OnboardingFormValues) => {
    if (currentStep < totalSteps) {
      // Parse string values to numbers
      data.annualIncome = parseFloat(data.annualIncome.toString());
      data.monthlyExpenses = parseFloat(data.monthlyExpenses.toString());
      if (data.savingsGoal) {
        data.savingsGoal = parseFloat(data.savingsGoal.toString());
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      mutate(data);
    }
  };

  const handleSkip = () => {
    // Set default values and submit
    const defaultData = {
      annualIncome: 75000,
      monthlyExpenses: 3500,
      employmentStatus: "full-time" as const,
      savingsGoal: 10000,
      riskTolerance: "medium" as const,
    };
    
    mutate(defaultData);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="px-8 py-6 bg-[#0A2540] text-white">
          <h2 className="text-2xl font-semibold">Welcome to FinanceAI</h2>
          <p className="mt-2 text-blue-100">Let's set up your financial profile to provide personalized insights</p>
        </div>
        
        {/* Progress Indicator */}
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</div>
            <div className="flex items-center">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i + 1 <= currentStep ? "bg-secondary" : "bg-gray-200"
                  } ${i < totalSteps - 1 ? "mr-2" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {currentStep === 1 && (
              <CardContent className="px-8 py-6">
                <h3 className="text-lg font-semibold mb-4">Basic Financial Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="annualIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Income</FormLabel>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="0.00"
                              className="pl-7 pr-12"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                            />
                          </FormControl>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">USD</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="monthlyExpenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Expenses</FormLabel>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="0.00"
                              className="pl-7 pr-12"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                            />
                          </FormControl>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">USD</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="employmentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employment status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="self-employed">Self-employed</SelectItem>
                            <SelectItem value="unemployed">Unemployed</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}

            {currentStep === 2 && (
              <CardContent className="px-8 py-6">
                <h3 className="text-lg font-semibold mb-4">Financial Goals</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="savingsGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Savings Goal</FormLabel>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="0.00"
                              className="pl-7 pr-12"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                            />
                          </FormControl>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">USD</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}

            {currentStep === 3 && (
              <CardContent className="px-8 py-6">
                <h3 className="text-lg font-semibold mb-4">Risk Profile</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="riskTolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Risk Tolerance</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk tolerance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low - Safety First</SelectItem>
                            <SelectItem value="medium">Medium - Balanced Approach</SelectItem>
                            <SelectItem value="high">High - Growth Focused</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
            
            <div className="px-8 py-4 bg-gray-50 flex justify-between">
              <Button 
                variant="ghost" 
                type="button" 
                onClick={handleSkip}
                disabled={isPending}
              >
                Skip for now
              </Button>
              
              <Button 
                type="submit" 
                className="bg-secondary hover:bg-opacity-90"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-t-transparent border-secondary-foreground rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : currentStep < totalSteps ? "Continue" : "Complete Setup"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
