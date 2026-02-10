from tvscreener import CryptoScreener, CryptoField
from sqlmodel import Session, select
from app.models import TickerIndex
from datetime import datetime, timezone
import pandas as pd
import numpy as np

class IndexerService:
    def __init__(self, session: Session):
        self.session = session
        self.supported_exchanges = ["BINANCE", "BYBIT", "BITGET"]

    def sync_tickers(self):
        """
        Fetches prioritized tickers from TradingView and syncs them to the local database.
        Includes Top 1500 assets by Market Cap and their USDT/Perpetual counterparts.
        """
        print(f"Indexer: Starting targeted sync for {self.supported_exchanges}...")
        
        # 1. Fetch Top 1500 Assets by Market Cap (which often uses USD/USDC pairs)
        cs = CryptoScreener()
        cs.where(CryptoField.EXCHANGE.isin(self.supported_exchanges))
        cs.sort_by(CryptoField.MARKET_CAPITALIZATION, ascending=False)
        cs.set_range(0, 1500)
        
        df_top = cs.get()
        if df_top.empty:
            print("Indexer: No tickers found matching criteria.")
            return 0

        # 2. Extract Base Assets and construct candidates (USDT and USDT.P)
        # We identify the base by stripping known quotes
        quotes = ["USDT", "USDC", "USD", "BTC", "ETH", "BNB", "EUR", "TRY", "JPY", "GBP"]
        base_assets = set()
        for _, row in df_top.iterrows():
            name = row.get('Name', '')
            # Clean name (remove .P if present)
            clean_name = name.replace(".P", "")
            base = clean_name
            for quote in quotes:
                if clean_name.endswith(quote) and len(clean_name) > len(quote):
                    base = clean_name[:-len(quote)]
                    break
            base_assets.add((row['Exchange'], base))

        # 3. Build a list of all candidates we want to ensure are in the index
        candidates = []
        for exchange, base in base_assets:
            candidates.append(f"{exchange}:{base}USDT")
            candidates.append(f"{exchange}:{base}USDT.P")
        
        # 4. Fetch all those candidates explicitly to validate and get metadata
        # We do this in chunks because 'tickers' filter has limits
        all_candidate_data = []
        chunk_size = 100
        candidate_list = list(set(candidates))
        
        for i in range(0, len(candidate_list), chunk_size):
            chunk = candidate_list[i:i + chunk_size]
            cs_cand = CryptoScreener()
            cs_cand.symbols = {"tickers": chunk}
            try:
                df_cand = cs_cand.get()
                all_candidate_data.append(df_cand)
            except Exception:
                pass

        # 5. Combine and Sync
        df_cand_combined = pd.concat(all_candidate_data) if all_candidate_data else pd.DataFrame()
        df_final = pd.concat([df_top, df_cand_combined]).drop_duplicates(subset=['Symbol'])
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
        
        # Remove favorites that are no longer indexed
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
