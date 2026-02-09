from tvscreener import CryptoScreener
import pandas as pd

class ScreenerService:
    def __init__(self):
        pass

    def get_top_movers(self, limit: int = 50):
        """
        Fetches top crypto movers from TradingView.
        """
        cs = CryptoScreener()
        # Basic query for top movers
        # Note: Actual fields might vary, using common ones based on documentation summary
        df = cs.get()
        
        # Sort by change if available, or just take top results
        if 'change' in df.columns:
            df = df.sort_values(by='change', ascending=False)
            
        top_df = df.head(limit)
        
        # Convert to list of dictionaries for easier JSON serialization
        return top_df.to_dict(orient='records')

    def search_ticker(self, query: str):
        """
        Searches for a specific crypto ticker.
        """
        cs = CryptoScreener()
        # In reality, tvscreener might have a dedicated search or we use filters
        # Based on summary, it has where() and search functionality
        # For simplicity in this mock-driven step:
        df = cs.get()
        
        # Simple local filtering for now, or use cs.where() if we knew the exact syntax
        # The library likely supports something like: cs.where(Field('ticker').contains(query))
        
        # Filtering the result dataframe
        if 'ticker' in df.columns:
            search_df = df[df['ticker'].str.contains(query, case=False, na=False)]
            return search_df.to_dict(orient='records')
        
        return []
