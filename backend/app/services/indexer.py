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
        Includes Top 1500 Spot tickers by Market Cap and their Perpetual counterparts.
        """
        print(f"Indexer: Starting targeted sync for {self.supported_exchanges}...")
        
        # 1. Fetch Top 1500 Spot Assets by Market Cap
        cs = CryptoScreener()
        cs.where(CryptoField.EXCHANGE.isin(self.supported_exchanges))
        cs.sort_by(CryptoField.MARKET_CAPITALIZATION, ascending=False)
        cs.set_range(0, 1500)
        
        df_top = cs.get()
        if df_top.empty:
            print("Indexer: No tickers found matching criteria.")
            return 0

        # 2. Identify the symbols and their potential Perp counterparts
        top_symbols = set(df_top['Symbol'].tolist())
        perp_candidates = []
        for symbol in top_symbols:
            if not symbol.endswith(".P"):
                # If it's a spot (e.g. BINANCE:BTCUSDT), suggest its perp (e.g. BINANCE:BTCUSDT.P)
                perp_candidates.append(f"{symbol}.P")

        # 3. Fetch the Perp counterparts specifically
        cs_perp = CryptoScreener()
        # Directly target the candidates
        cs_perp.symbols = {"tickers": perp_candidates}
        try:
            df_perps = cs_perp.get()
        except Exception:
            df_perps = pd.DataFrame()

        # 4. Combine and Sync
        df_final = pd.concat([df_top, df_perps]).drop_duplicates(subset=['Symbol'])
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
