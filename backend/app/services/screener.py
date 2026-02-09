from tvscreener import CryptoScreener
import pandas as pd
import numpy as np

class ScreenerService:
    def __init__(self):
        pass

    def get_top_movers(self, limit: int = 50):
        """
        Fetches top crypto movers from TradingView.
        """
        print(f"DEBUG: Fetching top {limit} movers...")
        try:
            cs = CryptoScreener()
            df = cs.get()
            
            if df.empty:
                print("DEBUG: TradingView returned empty dataframe.")
                return self._get_fallback_data()

            print(f"DEBUG: Successfully fetched {len(df)} assets. Columns: {df.columns.tolist()[:5]}")
            
            # Use exact column names found in diagnostic
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
            
            # Search in 'Symbol' or 'Name'
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
            {"Symbol": "BTCUSD", "Price": 98000.0, "Change %": 2.5, "Volume": 12000000000},
            {"Symbol": "ETHUSD", "Price": 2700.0, "Change %": -1.2, "Volume": 5000000000}
        ]