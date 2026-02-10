from tvscreener import CryptoScreener, CryptoField
from tvscreener.field import FieldWithInterval, FieldWithHistory

# Monkeypatch
def has_recommendation(self):
    return getattr(self, 'format', None) == 'recommendation'
FieldWithInterval.has_recommendation = has_recommendation
FieldWithHistory.has_recommendation = has_recommendation

def test_10m_rsi():
    cs = CryptoScreener()
    cs.set_range(0, 1)
    rsi = CryptoField.RELATIVE_STRENGTH_INDEX_14
    
    # Try just RSI|10
    cs.select(CryptoField.NAME, rsi.with_interval("10"))
    try:
        df = cs.get()
        print("RSI|10 Success! Columns:", df.columns.tolist())
    except Exception as e:
        print(f"RSI|10 Failed: {e}")

    # Try RSI|10[1]
    cs = CryptoScreener()
    cs.set_range(0, 1)
    cs.select(CryptoField.NAME, rsi.with_interval("10").with_history(1))
    try:
        df = cs.get()
        print("RSI|10[1] Success! Columns:", df.columns.tolist())
    except Exception as e:
        print(f"RSI|10[1] Failed: {e}")

if __name__ == "__main__":
    test_10m_rsi()
