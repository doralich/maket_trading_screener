from tvscreener import CryptoScreener
import pandas as pd

def explore_tvscreener():
    cs = CryptoScreener()
    # The get() method usually returns a dataframe of results.
    # By default it might be limited or based on certain criteria.
    df = cs.get()
    print(f"Total tickers returned by default: {len(df)}")
    print(f"Columns: {df.columns.tolist()[:10]}")
    
    # Check if there are methods to get all symbols or filter by exchange
    # Looking at the library documentation or common patterns:
    # We might need to handle pagination or specific filters if the library supports it.
    
    # Try to see if we can get a larger set
    # Some libraries use a 'limit' or 'all' flag.
    # tvscreener usually fetches what's available in the screener view.
    
if __name__ == "__main__":
    explore_tvscreener()
