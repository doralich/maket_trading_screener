from tvscreener import CryptoScreener
import inspect

def explore_intervals():
    cs = CryptoScreener()
    # Looking for a way to set intervals
    print("Methods in CryptoScreener:")
    for name, method in inspect.getmembers(cs, predicate=inspect.ismethod):
        print(f"- {name}")

    # Check the CryptoScreener class itself or its base class
    # Usually, TradingView Screener API takes a 'range' or 'timeframe'
    # In tvscreener, this might be handled via a method or a parameter in get()
    
if __name__ == "__main__":
    explore_intervals()
