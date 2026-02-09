from tvscreener import CryptoScreener

def test_pagination():
    cs = CryptoScreener()
    cs.set_range(0, 1000)
    df = cs.get()
    print(f"Tickers with range(0, 1000): {len(df)}")

if __name__ == "__main__":
    test_pagination()
