from tvscreener import CryptoScreener, CryptoField
from tvscreener.field import FieldWithInterval, FieldWithHistory

# Monkeypatch
def has_recommendation(self):
    return getattr(self, 'format', None) == 'recommendation'
FieldWithInterval.has_recommendation = has_recommendation
FieldWithHistory.has_recommendation = has_recommendation

def test_timestamps():
    cs = CryptoScreener()
    cs.set_range(0, 1)
    time_field = CryptoField.TIME
    
    intervals = ["5", "60", "1D"]
    fields = [CryptoField.NAME]
    for interval in intervals:
        fields.append(time_field.with_interval(interval))
            
    cs.select(*fields)
    try:
        df = cs.get()
        print(df)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_timestamps()
