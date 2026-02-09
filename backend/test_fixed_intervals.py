from tvscreener import CryptoScreener, CryptoField
from tvscreener.field import FieldWithInterval, FieldWithHistory

# Monkeypatch to fix tvscreener bug
def has_recommendation(self):
    return getattr(self, 'format', None) == 'recommendation'

FieldWithInterval.has_recommendation = has_recommendation
FieldWithHistory.has_recommendation = has_recommendation

def test_fixed_intervals():
    cs = CryptoScreener()
    cs.where(CryptoField.SYMBOL == "BINANCE:BTCUSDT")
    rsi = CryptoField.RELATIVE_STRENGTH_INDEX_14
    cs.select(
        CryptoField.SYMBOL,
        rsi,
        rsi.with_interval("60"),
        rsi.with_interval("1D")
    )
    df = cs.get()
    print("Columns in result:", df.columns.tolist())
    print(df)

if __name__ == "__main__":
    test_fixed_intervals()
