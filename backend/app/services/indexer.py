from tvscreener import CryptoScreener, CryptoField
from sqlmodel import Session, select
from app.models import TickerIndex
from datetime import datetime, timezone
import pandas as pd
import numpy as np

class IndexerService:
    def __init__(self, session: Session):
        self.session = session
        self.supported_exchanges = ["BINANCE", "BYBIT", "BITGET", "OKX"]

    def sync_tickers(self):
        """
        Fetches ALL tickers from BINANCE, BYBIT, and BITGET and syncs them to the local database.
        This ensures maximum robustness and that every available pair can be searched.
        """
        print(f"Indexer: Starting full sync for {self.supported_exchanges}...")
        
        all_ticker_data = []
        for exchange in self.supported_exchanges:
            print(f"Indexer: Fetching all tickers for {exchange}...")
            cs = CryptoScreener()
            cs.where(CryptoField.EXCHANGE == exchange)
            
            # Fetch in chunks to be safe, though 5000 is manageable
            chunk_size = 1000
            start = 0
            while True:
                cs.set_range(start, start + chunk_size)
                try:
                    df = cs.get()
                    if df.empty:
                        break
                    all_ticker_data.append(df)
                    if len(df) < chunk_size:
                        break
                    start += chunk_size
                except Exception as e:
                    print(f"Error fetching {exchange} chunk: {e}")
                    break

        if not all_ticker_data:
            print("Indexer: No tickers found from any exchange.")
            return 0

        df_final = pd.concat(all_ticker_data).drop_duplicates(subset=['Symbol'])
        valid_symbols = set(df_final['Symbol'].tolist())
        
        total_indexed = 0
        for _, row in df_final.iterrows():
            symbol = row.get('Symbol')
            if not symbol:
                continue
                
            # Double check exchange filter just in case
            exchange = row.get('Exchange', 'UNKNOWN')
            if exchange not in self.supported_exchanges:
                continue

            # Check if ticker already exists
            statement = select(TickerIndex).where(TickerIndex.symbol == symbol)
            ticker = self.session.exec(statement).first()
            
            if not ticker:
                ticker = TickerIndex(
                    symbol=symbol,
                    exchange=exchange,
                    name=row.get('Name'),
                    description=row.get('Description')
                )
                self.session.add(ticker)
            else:
                # Update only if changed
                changed = False
                new_name = row.get('Name')
                new_desc = row.get('Description')
                if ticker.name != new_name:
                    ticker.name = new_name
                    changed = True
                if ticker.description != new_desc:
                    ticker.description = new_desc
                    changed = True
                
                if changed:
                    ticker.updated_at = datetime.now(timezone.utc)
            
            total_indexed += 1
        
        # 5. Pruning Logic
        print("Indexer: Pruning stale tickers and favorites...")
        from app.models import Favorite, MarketDataHistory
        
        # Remove tickers not in the new valid set
        all_indexed_tickers = self.session.exec(select(TickerIndex)).all()
        for t in all_indexed_tickers:
            if t.symbol not in valid_symbols:
                self.session.delete(t)
        
        # Remove favorites that are no longer indexed (Unsupported Exchanges)
        all_favorites = self.session.exec(select(Favorite)).all()
        for f in all_favorites:
            if f.symbol not in valid_symbols:
                print(f"Indexer: Removing favorite {f.symbol} (no longer in prioritized set)")
                # Delete its history first
                history_stmt = select(MarketDataHistory).where(MarketDataHistory.symbol == f.symbol)
                history_items = self.session.exec(history_stmt).all()
                for h in history_items:
                    self.session.delete(h)
                # Delete the favorite
                self.session.delete(f)

        self.session.commit()
        print(f"Indexer: Finished! Total prioritized tickers indexed: {total_indexed}")
        return total_indexed