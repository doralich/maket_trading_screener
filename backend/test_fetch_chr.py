from tvscreener import CryptoScreener, CryptoField

def test_fetch_specific():
    cs = CryptoScreener()
    # Attempt to filter by symbol
    # Some screeners use 'symbol' as a field
    try:
        cs.where(CryptoField.SYMBOL == "BINANCE:CHRUSDT")
        df = cs.get()
        print(f"Fetched {len(df)} records for CHRUSDT")
        if not df.empty:
            print(df[['Symbol', 'Name']])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_fetch_specific()
