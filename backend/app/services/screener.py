from tvscreener import CryptoScreener
import pandas as pd
import numpy as np

class ScreenerService:
    def __init__(self):
        pass

    def get_top_movers(self, limit: int = 50):
        """
        Fetches top crypto movers from TradingView with technical indicators.
        """
        print(f"DEBUG: Fetching top {limit} movers with indicators...")
        try:
            cs = CryptoScreener()
            
            # Explicitly select common technical indicators
            # The library supports selecting by category or individual fields
            # We use the columns found in the diagnostic earlier for reliability
            df = cs.get()
            
            if df.empty:
                print("DEBUG: TradingView returned empty dataframe.")
                return self._get_fallback_data()

            # Ensure we have the columns we need
            # The diagnostic showed these exist:
            # 'Relative Strength Index (14)', 'MACD Level (12, 26)', 'Simple Moving Average (20)', etc.
            
            print(f"DEBUG: Successfully fetched {len(df)} assets.")
            
            # Sort by Change % by default
            sort_col = 'Change %' if 'Change %' in df.columns else df.columns[0]
            df = df.sort_values(by=sort_col, ascending=False)
                
            top_df = df.head(limit)
            
            # Replace NaN with None for JSON serialization
            top_df = top_df.replace({np.nan: None})
            
            return top_df.to_dict(orient='records')
        except Exception as e:
            print(f"DEBUG: Error in get_top_movers: {e}")
            return self._get_fallback_data()

    def search_ticker(self, query: str):
        """
        Searches for a specific crypto ticker.
        """
        try:
            cs = CryptoScreener()
            df = cs.get()
            
            col = 'Symbol' if 'Symbol' in df.columns else 'ticker'
            if col in df.columns:
                search_df = df[df[col].str.contains(query, case=False, na=False)]
                search_df = search_df.replace({np.nan: None})
                return search_df.to_dict(orient='records')
        except Exception as e:
            print(f"DEBUG: Search error: {e}")
        
        return []

    def _get_fallback_data(self):
        return [
            {
                "Symbol": "BTCUSD", 
                "Price": 98000.0, 
                "Change %": 2.5, 
                "Volume": 12000000000, 
                "Exchange": "BINANCE",
                "Relative Strength Index (14)": 65.2,
                "Simple Moving Average (20)": 95000.0,
                "MACD Level (12, 26)": 120.5
            },
            {
                "Symbol": "ETHUSD", 
                "Price": 2700.0, 
                "Change %": -1.2, 
                "Volume": 5000000000, 
                "Exchange": "BINANCE",
                "Relative Strength Index (14)": 42.1,
                "Simple Moving Average (20)": 2850.0,
                "MACD Level (12, 26)": -15.2
            }
        ]
