from tvscreener import CryptoScreener, CryptoField
from tvscreener.field import FieldWithInterval, FieldWithHistory

# Monkeypatch
def has_recommendation(self):
    return getattr(self, 'format', None) == 'recommendation'
FieldWithInterval.has_recommendation = has_recommendation
FieldWithHistory.has_recommendation = has_recommendation

def test_full_intervals():
    cs = CryptoScreener()
    cs.set_range(0, 1)
    price = CryptoField.PRICE
    
    intervals = ["5", "10", "15", "60", "120", "240", "360", "720", "1D", "1W", "1M"]
    
    fields = [CryptoField.NAME]
    for interval in intervals:
        fields.append(price.with_interval(interval))
            
    cs.select(*fields)
    try:
        df = cs.get()
        print("Success! Columns:", df.columns.tolist())
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_full_intervals()
