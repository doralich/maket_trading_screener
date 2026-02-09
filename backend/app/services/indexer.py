from tvscreener import CryptoScreener
from sqlmodel import Session, select
from app.models import TickerIndex
from datetime import datetime, timezone
import pandas as pd
import numpy as np

class IndexerService:
    def __init__(self, session: Session):
        self.session = session

    def sync_tickers(self):
        """
        Fetches all tickers from TradingView and syncs them to the local database.
        """
        print("Indexer: Starting full ticker sync...")
        cs = CryptoScreener()
        
        # We'll fetch in chunks of 1000
        chunk_size = 1000
        start = 0
        total_indexed = 0
        
        while True:
            cs.set_range(start, start + chunk_size)
            df = cs.get()
            
            if df.empty:
                break
                
            for _, row in df.iterrows():
                symbol = row.get('Symbol')
                if not symbol:
                    continue
                    
                # Check if ticker already exists
                statement = select(TickerIndex).where(TickerIndex.symbol == symbol)
                ticker = self.session.exec(statement).first()
                
                if not ticker:
                    ticker = TickerIndex(
                        symbol=symbol,
                        exchange=row.get('Exchange', 'UNKNOWN'),
                        name=row.get('Name'),
                        description=row.get('Description')
                    )
                    self.session.add(ticker)
                else:
                    # Update existing
                    ticker.name = row.get('Name')
                    ticker.description = row.get('Description')
                    ticker.updated_at = datetime.now(timezone.utc)
                
                total_indexed += 1
            
            self.session.commit()
            print(f"Indexer: Indexed {total_indexed} tickers...")
            
            if len(df) < chunk_size:
                # Reached the end
                break
                
            start += chunk_size
            
        print(f"Indexer: Finished! Total tickers indexed: {total_indexed}")
        return total_indexed
