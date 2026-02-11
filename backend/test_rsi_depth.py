from tvscreener import CryptoScreener
from types import SimpleNamespace

def test_rsi_depth():
    cs = CryptoScreener()
    cs.set_range(0, 1)
    
    # Testing different ways to ask for history
    fields = []
    for i in range(1, 11):
        # Pattern 1: RSI[i]|60
        fields.append(SimpleNamespace(field_name=f"RSI[{i}]|60", label=f"R_A_{i}", has_recommendation=lambda: False, historical=False))
        # Pattern 2: RSI|60[i]
        fields.append(SimpleNamespace(field_name=f"RSI|60[{i}]", label=f"R_B_{i}", has_recommendation=lambda: False, historical=False))
    
    cs.select(*fields)
    try:
        df = cs.get()
        print("RSI History Results (1H):")
        for i in range(1, 11):
            val_a = df.iloc[0].get(f"R_A_{i}")
            val_b = df.iloc[0].get(f"R_B_{i}")
            print(f"Depth {i}: Pattern A={val_a}, Pattern B={val_b}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_rsi_depth()
