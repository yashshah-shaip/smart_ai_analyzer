import os
from typing import Dict, List, Any, Optional
from tavily import TavilyClient
from datetime import datetime

class FinanceScraper:
    def __init__(self):
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.client = TavilyClient(api_key=self.tavily_api_key)
    
    async def search_financial_news(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search for financial news using Tavily"""
        if not self.tavily_api_key:
            raise ValueError("TAVILY_API_KEY environment variable not set")
        
        try:
            # Add financial context to the query
            enhanced_query = f"financial news about {query}"
            
            # Perform search
            response = self.client.search(
                query=enhanced_query,
                search_depth="advanced",
                max_results=max_results,
                include_domains=["marketwatch.com", "bloomberg.com", "reuters.com", "cnbc.com", 
                                 "moneycontrol.com", "economictimes.indiatimes.com", "financialexpress.com"]
            )
            
            # Process results
            results = []
            for result in response.get("results", []):
                results.append({
                    "title": result.get("title"),
                    "url": result.get("url"),
                    "content": result.get("content"),
                    "score": result.get("score"),
                    "source": result.get("source"),
                    "published_date": result.get("published_date")
                })
            
            return results
        
        except Exception as e:
            print(f"Error searching financial news: {str(e)}")
            return []
    
    async def get_stock_information(self, ticker: str) -> Dict[str, Any]:
        """Get information about a specific stock"""
        if not self.tavily_api_key:
            raise ValueError("TAVILY_API_KEY environment variable not set")
        
        try:
            # Prepare query for stock information
            query = f"latest financial information and analysis for {ticker} stock"
            
            # Perform search
            response = self.client.search(
                query=query,
                search_depth="advanced",
                max_results=3
            )
            
            # Process and summarize results
            content = ""
            for result in response.get("results", []):
                content += result.get("content", "") + "\n\n"
            
            # Return structured information
            return {
                "ticker": ticker,
                "date": datetime.now().isoformat(),
                "information": content,
                "sources": [r.get("url") for r in response.get("results", [])]
            }
        
        except Exception as e:
            print(f"Error getting stock information: {str(e)}")
            return {
                "ticker": ticker,
                "date": datetime.now().isoformat(),
                "information": f"Error retrieving information: {str(e)}",
                "sources": []
            }
    
    async def get_market_summary(self) -> Dict[str, Any]:
        """Get a summary of current market conditions"""
        if not self.tavily_api_key:
            raise ValueError("TAVILY_API_KEY environment variable not set")
        
        try:
            # Prepare query for market summary
            query = "latest Indian stock market summary Sensex Nifty today"
            
            # Perform search
            response = self.client.search(
                query=query,
                search_depth="advanced",
                max_results=5,
                include_domains=["moneycontrol.com", "economictimes.indiatimes.com", "financialexpress.com", 
                                "livemint.com", "ndtv.com/business"]
            )
            
            # Process results
            content = ""
            for result in response.get("results", []):
                content += result.get("content", "") + "\n\n"
            
            return {
                "date": datetime.now().isoformat(),
                "summary": content,
                "sources": [r.get("url") for r in response.get("results", [])]
            }
        
        except Exception as e:
            print(f"Error getting market summary: {str(e)}")
            return {
                "date": datetime.now().isoformat(),
                "summary": f"Error retrieving market summary: {str(e)}",
                "sources": []
            }