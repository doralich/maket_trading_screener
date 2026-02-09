from tvscreener import CryptoScreener
import inspect

def doc_tvscreener():
    cs = CryptoScreener()
    print("Methods in CryptoScreener:")
    for name, method in inspect.getmembers(cs, predicate=inspect.ismethod):
        print(f"- {name}")
    
    # print("\nDocumentation for get():")
    # print(cs.get.__doc__)

if __name__ == "__main__":
    doc_tvscreener()