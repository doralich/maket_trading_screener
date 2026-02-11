from tvscreener import CryptoScreener, CryptoField
import pandas as pd
import numpy as np

def debug_divergence_4h():
    cs = CryptoScreener()
    cs.where(CryptoField.EXCHANGE == "BINANCE")
    cs.set_range(0, 10)
    try:
        df = cs.get()
        print("Columns found in base fetch:", df.columns.tolist())
        
        # Now try selecting the historical fields
        cs.select("close|240", "RSI|240", "close|240[1]", "RSI|240[1]")
        df_hist = cs.get()
        print("\nColumns found in historical fetch:", df_hist.columns.tolist())
        
        if not df_hist.empty:
            print("\nRow 0 values:")
            print(df_hist.iloc[0].to_dict())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_divergence_4h()