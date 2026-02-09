from tvscreener import CryptoScreener, CryptoField, FieldWithHistory

def test_history():
    cs = CryptoScreener()
    cs.where(CryptoField.SYMBOL == "BINANCE:BTCUSDT")
    # Try to get current price and previous price
    cs.select(
        CryptoField.SYMBOL,
        CryptoField.CLOSE,
        FieldWithHistory(CryptoField.CLOSE, 1),
        FieldWithHistory(CryptoField.CLOSE, 2)
    )
    df = cs.get()
    print(df)

if __name__ == "__main__":
    test_history()
