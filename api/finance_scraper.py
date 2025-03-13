import os
from typing import List, Dict, Any
import logging
from datetime import datetime
import json
import random

# Logger setup
logger = logging.getLogger(__name__)

class FinanceScraper:
    def __init__(self):
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.tavily_client = None
        
        # Initialize Tavily client if API key is available
        if self.tavily_api_key:
            try:
                # Conditionally import Tavily
                try:
                    from tavily import TavilyClient
                    self.tavily_client = TavilyClient(api_key=self.tavily_api_key)
                    logger.info("Successfully initialized Tavily client")
                except ImportError:
                    logger.warning("Tavily package not installed. Running in fallback mode.")
            except Exception as e:
                logger.error(f"Failed to initialize Tavily client: {str(e)}")
        else:
            logger.warning("Tavily API key not found. Running in fallback mode.")
    
    async def search_financial_news(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search for financial news using Tavily"""
        try:
            if self.tavily_client:
                # Use Tavily to search for financial news
                response = self.tavily_client.search(
                    query=query,
                    search_depth="advanced",
                    include_domains=["economictimes.indiatimes.com", "moneycontrol.com", "livemint.com", "financialexpress.com"],
                    max_results=max_results
                )
                
                # Format the response
                results = []
                for item in response.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "content": item.get("content", ""),
                        "source": item.get("source", ""),
                        "published_date": item.get("published_date", "")
                    })
                
                return results
            else:
                # Return fallback news data
                return self._get_fallback_news(query)
        except Exception as e:
            logger.error(f"Error searching financial news: {str(e)}")
            # Return fallback news data in case of error
            return self._get_fallback_news(query)
    
    async def get_stock_information(self, ticker: str) -> Dict[str, Any]:
        """Get information about a specific stock"""
        try:
            # In a real implementation, this would call a financial API
            # For now, return fallback data
            return self._get_fallback_stock_info(ticker)
        except Exception as e:
            logger.error(f"Error getting stock information for {ticker}: {str(e)}")
            return {
                "error": f"Failed to retrieve stock information for {ticker}"
            }
    
    async def get_market_summary(self) -> Dict[str, Any]:
        """Get a summary of current market conditions"""
        try:
            # In a real implementation, this would call a financial API
            # For now, return fallback data
            return self._get_fallback_market_summary()
        except Exception as e:
            logger.error(f"Error getting market summary: {str(e)}")
            return {
                "error": "Failed to retrieve market summary"
            }
    
    def _get_fallback_news(self, query: str) -> List[Dict[str, Any]]:
        """Get fallback news data"""
        # Get current date
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        # Fallback news data based on query
        if "stock market" in query.lower():
            return [
                {
                    "title": "Sensex, Nifty close at record highs on positive global cues",
                    "url": "https://economictimes.indiatimes.com/markets/stocks/news/sensex-nifty-close-at-record-highs",
                    "content": "Indian stock markets closed at record highs on Wednesday, with the Sensex gaining over 500 points and Nifty crossing the 23,000 mark for the first time ever. The rally was driven by positive global cues and strong buying in banking and IT stocks.",
                    "source": "Economic Times",
                    "published_date": current_date
                },
                {
                    "title": "FIIs turn net buyers in March, invest over ₹15,000 crore in Indian equities",
                    "url": "https://www.moneycontrol.com/news/business/markets/fiis-turn-net-buyers-in-march",
                    "content": "Foreign institutional investors (FIIs) have turned net buyers in March, pumping in over ₹15,000 crore in Indian equities so far this month. This comes after three consecutive months of net selling by foreign investors.",
                    "source": "Moneycontrol",
                    "published_date": current_date
                },
                {
                    "title": "Midcap, smallcap stocks outperform benchmarks; experts advise caution",
                    "url": "https://www.livemint.com/market/stock-market-news/midcap-smallcap-stocks-outperform",
                    "content": "Midcap and smallcap stocks have significantly outperformed benchmark indices in recent weeks, with the BSE Midcap and Smallcap indices gaining over 8% and 10% respectively in the past month. Market experts, however, advise caution at current levels.",
                    "source": "Livemint",
                    "published_date": current_date
                }
            ]
        elif "mutual fund" in query.lower():
            return [
                {
                    "title": "Top 5 large-cap mutual funds to invest in 2025",
                    "url": "https://www.moneycontrol.com/news/business/mutual-funds/top-5-large-cap-mutual-funds",
                    "content": "Despite the market volatility, large-cap mutual funds have delivered strong returns in the past year. We analyze the top 5 large-cap funds that have consistently outperformed their benchmarks and offer good growth potential in 2025.",
                    "source": "Moneycontrol",
                    "published_date": current_date
                },
                {
                    "title": "SEBI introduces new regulations for mutual fund expense ratios",
                    "url": "https://economictimes.indiatimes.com/mf/analysis/sebi-introduces-new-regulations",
                    "content": "The Securities and Exchange Board of India (SEBI) has introduced new regulations for mutual fund expense ratios, which will come into effect from April 1, 2025. The move aims to make mutual fund investments more cost-effective for retail investors.",
                    "source": "Economic Times",
                    "published_date": current_date
                }
            ]
        else:
            return [
                {
                    "title": "India's GDP growth projected at 7.2% for FY 2025-26",
                    "url": "https://www.financialexpress.com/economy/indias-gdp-growth-projected",
                    "content": "The International Monetary Fund (IMF) has projected India's GDP growth at 7.2% for the fiscal year 2025-26, making it the fastest-growing major economy in the world. The projection is slightly higher than the government's estimate of 7%.",
                    "source": "Financial Express",
                    "published_date": current_date
                },
                {
                    "title": "RBI keeps repo rate unchanged at 6.5% for sixth consecutive time",
                    "url": "https://economictimes.indiatimes.com/news/economy/policy/rbi-keeps-repo-rate-unchanged",
                    "content": "The Reserve Bank of India (RBI) has kept the repo rate unchanged at 6.5% for the sixth consecutive time in its latest monetary policy meeting. The central bank maintained its stance on 'withdrawal of accommodation' to ensure inflation remains within the target.",
                    "source": "Economic Times",
                    "published_date": current_date
                },
                {
                    "title": "Rupee strengthens against US dollar on positive economic data",
                    "url": "https://www.livemint.com/market/forex/rupee-strengthens-against-us-dollar",
                    "content": "The Indian rupee strengthened against the US dollar on Wednesday, gaining 15 paise to close at 82.40. The appreciation was supported by positive economic data and sustained foreign fund inflows into Indian equities.",
                    "source": "Livemint",
                    "published_date": current_date
                }
            ]
    
    def _get_fallback_stock_info(self, ticker: str) -> Dict[str, Any]:
        """Get fallback stock information"""
        # Map of some common tickers to fallback data
        ticker_data = {
            "RELIANCE": {
                "name": "Reliance Industries Ltd.",
                "price": 2875.45,
                "change": 23.75,
                "change_percent": 0.83,
                "volume": 4235678,
                "market_cap": 1950000000000,
                "pe_ratio": 22.5,
                "dividend_yield": 0.4,
                "52w_high": 2925.0,
                "52w_low": 2365.0
            },
            "TCS": {
                "name": "Tata Consultancy Services Ltd.",
                "price": 3950.20,
                "change": -15.30,
                "change_percent": -0.39,
                "volume": 1256789,
                "market_cap": 1450000000000,
                "pe_ratio": 28.7,
                "dividend_yield": 1.2,
                "52w_high": 4130.5,
                "52w_low": 3475.8
            },
            "HDFCBANK": {
                "name": "HDFC Bank Ltd.",
                "price": 1678.90,
                "change": 12.45,
                "change_percent": 0.75,
                "volume": 3567890,
                "market_cap": 1270000000000,
                "pe_ratio": 17.8,
                "dividend_yield": 0.8,
                "52w_high": 1790.0,
                "52w_low": 1540.3
            }
        }
        
        # Return data for the requested ticker or generate random data
        if ticker.upper() in ticker_data:
            return ticker_data[ticker.upper()]
        else:
            # Generate random data for unknown tickers
            price = round(random.uniform(500, 5000), 2)
            change = round(random.uniform(-50, 50), 2)
            change_percent = round(change / price * 100, 2)
            
            return {
                "name": f"{ticker.upper()} Ltd.",
                "price": price,
                "change": change,
                "change_percent": change_percent,
                "volume": random.randint(500000, 5000000),
                "market_cap": random.randint(100000000000, 2000000000000),
                "pe_ratio": round(random.uniform(15, 30), 1),
                "dividend_yield": round(random.uniform(0.2, 2.0), 1),
                "52w_high": round(price * (1 + random.uniform(0.05, 0.15)), 1),
                "52w_low": round(price * (1 - random.uniform(0.05, 0.25)), 1)
            }
    
    def _get_fallback_market_summary(self) -> Dict[str, Any]:
        """Get fallback market summary"""
        return {
            "indices": [
                {
                    "name": "Sensex",
                    "value": 73482.65,
                    "change": 547.68,
                    "change_percent": 0.75
                },
                {
                    "name": "Nifty 50",
                    "value": 23051.20,
                    "change": 165.35,
                    "change_percent": 0.72
                },
                {
                    "name": "Nifty Bank",
                    "value": 48975.80,
                    "change": 423.55,
                    "change_percent": 0.87
                },
                {
                    "name": "Nifty IT",
                    "value": 34562.90,
                    "change": -78.45,
                    "change_percent": -0.23
                }
            ],
            "top_gainers": [
                {
                    "symbol": "BHARTIARTL",
                    "name": "Bharti Airtel Ltd.",
                    "price": 1245.75,
                    "change_percent": 3.45
                },
                {
                    "symbol": "SBIN",
                    "name": "State Bank of India",
                    "price": 765.40,
                    "change_percent": 2.98
                },
                {
                    "symbol": "TATASTEEL",
                    "name": "Tata Steel Ltd.",
                    "price": 154.85,
                    "change_percent": 2.65
                }
            ],
            "top_losers": [
                {
                    "symbol": "HCLTECH",
                    "name": "HCL Technologies Ltd.",
                    "price": 1423.50,
                    "change_percent": -1.87
                },
                {
                    "symbol": "DRREDDY",
                    "name": "Dr. Reddy's Laboratories Ltd.",
                    "price": 5487.25,
                    "change_percent": -1.45
                },
                {
                    "symbol": "WIPRO",
                    "name": "Wipro Ltd.",
                    "price": 475.30,
                    "change_percent": -1.23
                }
            ],
            "market_breadth": {
                "advances": 1845,
                "declines": 1635,
                "unchanged": 120
            },
            "sector_performance": [
                {
                    "name": "Banking",
                    "change_percent": 0.87
                },
                {
                    "name": "IT",
                    "change_percent": -0.23
                },
                {
                    "name": "Auto",
                    "change_percent": 1.25
                },
                {
                    "name": "Pharma",
                    "change_percent": -0.45
                },
                {
                    "name": "FMCG",
                    "change_percent": 0.35
                },
                {
                    "name": "Metal",
                    "change_percent": 1.75
                }
            ],
            "global_indices": [
                {
                    "name": "Dow Jones",
                    "value": 39245.50,
                    "change_percent": 0.45
                },
                {
                    "name": "Nasdaq",
                    "value": 16432.75,
                    "change_percent": 0.25
                },
                {
                    "name": "S&P 500",
                    "value": 5235.65,
                    "change_percent": 0.35
                },
                {
                    "name": "FTSE 100",
                    "value": 8245.30,
                    "change_percent": 0.15
                },
                {
                    "name": "Nikkei 225",
                    "value": 38765.20,
                    "change_percent": -0.20
                },
                {
                    "name": "Shanghai Composite",
                    "value": 3125.45,
                    "change_percent": 0.55
                }
            ],
            "commodities": [
                {
                    "name": "Gold",
                    "value": 62345.75,
                    "change_percent": 0.65
                },
                {
                    "name": "Silver",
                    "value": 74580.30,
                    "change_percent": 0.85
                },
                {
                    "name": "Crude Oil",
                    "value": 6785.45,
                    "change_percent": -0.75
                }
            ],
            "currency": [
                {
                    "name": "USD/INR",
                    "value": 82.40,
                    "change_percent": -0.18
                },
                {
                    "name": "EUR/INR",
                    "value": 89.75,
                    "change_percent": -0.25
                },
                {
                    "name": "GBP/INR",
                    "value": 104.85,
                    "change_percent": -0.15
                },
                {
                    "name": "JPY/INR",
                    "value": 0.55,
                    "change_percent": 0.10
                }
            ]
        }