from tvscreener import CryptoScreener, CryptoField

def test_fetch_tickers():
    cs = CryptoScreener()
    # Manual tickers filter
    cs.symbols = {"tickers": ["BINANCE:BTCUSDT", "BINANCE:CHRUSDT", "BINANCE:BNBUSDT"]}
    try:
        df = cs.get()
        print(f"Fetched {len(df)} records")
        if not df.empty:
            print(df[['Symbol', 'Name']])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_fetch_tickers()
