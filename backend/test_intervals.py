from tvscreener import CryptoScreener, CryptoField, FieldWithInterval

def test_intervals():
    cs = CryptoScreener()
    cs.where(CryptoField.SYMBOL == "BINANCE:BTCUSDT")
    # Try to get price for different intervals
    # tvscreener.field.FieldWithInterval(field, interval)
    cs.select(
        CryptoField.SYMBOL,
        CryptoField.PRICE,
        FieldWithInterval(CryptoField.PRICE, "5"),
        FieldWithInterval(CryptoField.PRICE, "15"),
        FieldWithInterval(CryptoField.PRICE, "60"),
        FieldWithInterval(CryptoField.PRICE, "1D")
    )
    df = cs.get()
    print(df)

if __name__ == "__main__":
    test_intervals()
