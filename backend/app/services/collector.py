from tvscreener import CryptoScreener, CryptoField
from tvscreener.field import FieldWithInterval, FieldWithHistory
from sqlmodel import Session, select
from app.models import Favorite, MarketDataHistory
from app.database import engine
from datetime import datetime, timezone, timedelta
import json
import asyncio

# Monkeypatch tvscreener bug
def has_recommendation(self):
    return getattr(self, 'format', None) == 'recommendation'
FieldWithInterval.has_recommendation = has_recommendation
FieldWithHistory.has_recommendation = has_recommendation

class CollectorService:
    def __init__(self):
        self.intervals = ["5", "10", "15", "60", "120", "240", "360", "720", "1D", "1W", "1M"]
        self.indicators = {
            "RSI": CryptoField.RELATIVE_STRENGTH_INDEX_14,
            "MACD": CryptoField.MACD_LEVEL_12_26,
            "MACD_Signal": CryptoField.MACD_SIGNAL_12_26,
            "SMA20": CryptoField.SIMPLE_MOVING_AVERAGE_20,
            "SMA50": CryptoField.SIMPLE_MOVING_AVERAGE_50,
            "SMA200": CryptoField.SIMPLE_MOVING_AVERAGE_200
        }

    def _round_timestamp(self, dt: datetime, interval: str) -> datetime:
        """
        Rounds a timestamp down to the nearest interval start.
        """
        if interval == "1D":
            return dt.replace(hour=0, minute=0, second=0, microsecond=0)
        if interval == "1W":
            # Monday
            return (dt - timedelta(days=dt.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        if interval == "1M":
            return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Minutes intervals
        try:
            minutes = int(interval)
            # Find the start of the day and add multiples of 'minutes'
            day_start = dt.replace(hour=0, minute=0, second=0, microsecond=0)
            elapsed_minutes = int((dt - day_start).total_seconds() / 60)
            rounded_minutes = (elapsed_minutes // minutes) * minutes
            return day_start + timedelta(minutes=rounded_minutes)
        except ValueError:
            return dt # Fallback

    def collect_all(self):
        """
        Collects data for all favorite tickers across all intervals.
        """
        with Session(engine) as session:
            favorites = session.exec(select(Favorite)).all()
            if not favorites:
                return

            symbols = [f.symbol for f in favorites]
            print(f"Collector: Fetching data for {len(symbols)} symbols...")

            # We'll fetch in batches if there are many symbols, but for now just all
            cs = CryptoScreener()
            # Directly target favorite tickers
            cs.symbols = {"tickers": symbols}
            
            # To get all intervals in one request for many tickers, the payload grows.
            fields = [CryptoField.NAME]
            
            # This will create a LOT of columns. 11 intervals * (5 OHLCV + 4 Indicators) = 99 columns!
            # Plus the base columns.
            for interval in self.intervals:
                # We create copies and set historical=False to avoid tvscreener automatically
                # requesting [1] fields which fail for many custom intervals (like 10m).
                f_open = CryptoField.OPEN.with_interval(interval)
                f_open.historical = False
                fields.append(f_open)
                
                f_high = CryptoField.HIGH.with_interval(interval)
                f_high.historical = False
                fields.append(f_high)
                
                f_low = CryptoField.LOW.with_interval(interval)
                f_low.historical = False
                fields.append(f_low)
                
                f_close = CryptoField.PRICE.with_interval(interval)
                f_close.historical = False
                fields.append(f_close)
                
                f_vol = CryptoField.VOLUME.with_interval(interval)
                f_vol.historical = False
                fields.append(f_vol)

                for name, ind in self.indicators.items():
                    f_ind = ind.with_interval(interval)
                    f_ind.historical = False
                    fields.append(f_ind)

            cs.select(*fields)
            
            # We only want to fetch symbols that are favorites
            # cs.where(CryptoField.NAME.isin([s.split(":")[1] for s in symbols]))
            # Note: symbols are usually 'EXCHANGE:TICKER'
            # Let's just fetch first 1000 and filter
            cs.set_range(0, 1000)
            
            try:
                df = cs.get()
                now = datetime.now(timezone.utc)
                
                for _, row in df.iterrows():
                    symbol = row.get('Symbol')
                    if symbol not in symbols:
                        continue
                    
                    for interval in self.intervals:
                        rounded_ts = self._round_timestamp(now, interval)
                        
                        # Get data for this interval
                        # Labels are like 'Open (5)', 'High (5)', etc.
                        # Note: tvscreener adds (interval) to the label
                        
                        # Indicators labels
                        indicators_data = {}
                        for name, ind in self.indicators.items():
                            # Reconstruct the label tvscreener uses: f"{field.label} ({interval})"
                            label = f"{ind.label} ({interval})"
                            indicators_data[name] = row.get(label)

                        # Check if record exists
                        statement = select(MarketDataHistory).where(
                            MarketDataHistory.symbol == symbol,
                            MarketDataHistory.interval == interval,
                            MarketDataHistory.timestamp == rounded_ts
                        )
                        record = session.exec(statement).first()
                        
                        if not record:
                            record = MarketDataHistory(
                                symbol=symbol,
                                interval=interval,
                                timestamp=rounded_ts
                            )
                            session.add(record)
                        
                        # Update OHLCV
                        record.open = row.get(f"Open ({interval})")
                        record.high = row.get(f"High ({interval})")
                        record.low = row.get(f"Low ({interval})")
                        record.close = row.get(f"Price ({interval})")
                        record.volume = row.get(f"Volume ({interval})")
                        record.indicators_json = json.dumps(indicators_data)
                
                session.commit()
                print("Collector: Sync complete.")
            except Exception as e:
                print(f"Collector Error: {e}")

    def purge_old_data(self):
        """
        Deletes data older than 6 months + 1 day.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=181) # 6 months (approx) + 1 day
        print(f"Collector: Purging data older than {cutoff}")
        with Session(engine) as session:
            statement = select(MarketDataHistory).where(MarketDataHistory.timestamp < cutoff)
            results = session.exec(statement).all()
            for r in results:
                session.delete(r)
            session.commit()
            print(f"Collector: Purged {len(results)} records.")
