from tvscreener import CryptoScreener, CryptoField

def test_rsi_intervals():
    cs = CryptoScreener()
    cs.where(CryptoField.SYMBOL == "BINANCE:BTCUSDT")
    # RELATIVE_STRENGTH_INDEX_14
    rsi = CryptoField.RELATIVE_STRENGTH_INDEX_14
    cs.select(
        CryptoField.SYMBOL,
        rsi,
        rsi.with_interval("60"),
        rsi.with_interval("1D")
    )
    df = cs.get()
    print(df)

if __name__ == "__main__":
    test_rsi_intervals()
