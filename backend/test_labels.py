from tvscreener import CryptoScreener, CryptoField
from tvscreener.field import FieldWithInterval, FieldWithHistory

# Monkeypatch
def has_recommendation(self):
    return getattr(self, 'format', None) == 'recommendation'
FieldWithInterval.has_recommendation = has_recommendation
FieldWithHistory.has_recommendation = has_recommendation

def test_labels():
    cs = CryptoScreener()
    cs.set_range(0, 1)
    
    cs.select(
        CryptoField.NAME,
        CryptoField.OPEN.with_interval("5"),
        CryptoField.HIGH.with_interval("5"),
        CryptoField.LOW.with_interval("5"),
        CryptoField.VOLUME.with_interval("5"),
        CryptoField.PRICE.with_interval("5")
    )
    df = cs.get()
    print("Labels:", df.columns.tolist())

if __name__ == "__main__":
    test_labels()
