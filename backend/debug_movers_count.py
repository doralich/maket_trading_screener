from app.services.screener import ScreenerService
import json

def test_movers():
    service = ScreenerService()
    print("Testing 1D movers...")
    res_1d = service.get_top_movers(limit=10, interval="1D")
    print(f"1D Result count: {len(res_1d)}")
    
    print("\nTesting 60 (1h) movers...")
    res_1h = service.get_top_movers(limit=10, interval="60")
    print(f"1h Result count: {len(res_1h)}")
    
    if len(res_1h) > 0:
        print("Sample Symbol:", res_1h[0].get('Symbol'))
        print("Sample RSI Div:", res_1h[0].get('RSI Div'))

if __name__ == "__main__":
    test_movers()