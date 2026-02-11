from tvscreener import CryptoScreener, CryptoField
from tvscreener.field import FieldWithInterval, FieldWithHistory
from sqlmodel import Session, select
from app.models import Favorite, MarketDataHistory
from app.database import engine
from datetime import datetime, timezone, timedelta
import json
import asyncio
import pandas as pd

# Monkeypatch tvscreener bug
def has_recommendation(self):
    return getattr(self, 'format', None) == 'recommendation'
FieldWithInterval.has_recommendation = has_recommendation
FieldWithHistory.has_recommendation = has_recommendation

class CollectorService:
    def __init__(self):
        # Only use intervals that are reliably supported by the Screener API
        self.intervals = ["5", "15", "60", "240", "1D", "1W", "1M"]
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
            self.collect_symbols(symbols)

    def _sanitize_val(self, val):
        if pd.isna(val) or val is None:
            return None
        try:
            return float(val)
        except (ValueError, TypeError):
            return None

    def collect_symbols(self, symbols: list):
        """
        Collects data for a specific list of symbols across all intervals.
        """
        if not symbols:
            return

        print(f"Collector: Fetching data for {len(symbols)} symbols...")
        with Session(engine) as session:
            # We'll fetch in batches if there are many symbols, but for now just all
            cs = CryptoScreener()
            # Directly target specific tickers
            cs.symbols = {"tickers": symbols}
            
            # To get all intervals in one request for many tickers, the payload grows.
            fields = [CryptoField.NAME, CryptoField.PRICE, CryptoField.EXCHANGE]
            
            for interval in self.intervals:
                # 1D is handled as base fields in tvscreener usually, 
                # but we'll try to explicitly request it with interval if it's not the base.
                # Actually, for 1D, we can just use the base fields.
                if interval == "1D":
                    fields.append(CryptoField.OPEN)
                    fields.append(CryptoField.HIGH)
                    fields.append(CryptoField.LOW)
                    fields.append(CryptoField.VOLUME)
                    for name, ind in self.indicators.items():
                        fields.append(ind)
                    continue

                # Minutes/Weeks/Months
                f_open = CryptoField.OPEN.with_interval(interval)
                f_open.historical = False
                fields.append(f_open)
                
                f_high = CryptoField.HIGH.with_interval(interval)
                f_high.highstorical = False
                fields.append(f_high)
                
                f_low = CryptoField.LOW.with_interval(interval)
                f_low.historical = False
                fields.append(f_low)
                
                f_vol = CryptoField.VOLUME.with_interval(interval)
                f_vol.historical = False
                fields.append(f_vol)

                # For Price (Close)
                f_close = CryptoField.PRICE.with_interval(interval)
                f_close.historical = False
                fields.append(f_close)

                for name, ind in self.indicators.items():
                    f_ind = ind.with_interval(interval)
                    f_ind.historical = False
                    fields.append(f_ind)

            cs.select(*fields)
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
                        
                        # Labels are different for 1D vs others
                        indicators_data = {}
                        if interval == "1D":
                            for name, ind in self.indicators.items():
                                indicators_data[name] = self._sanitize_val(row.get(ind.label))
                            
                            o = row.get("Open")
                            h = row.get("High")
                            l = row.get("Low")
                            c = row.get("Price")
                            v = row.get("Volume")
                        else:
                            for name, ind in self.indicators.items():
                                label = f"{ind.label} ({interval})"
                                indicators_data[name] = self._sanitize_val(row.get(label))
                            
                            o = row.get(f"Open ({interval})")
                            h = row.get(f"High ({interval})")
                            l = row.get(f"Low ({interval})")
                            c = row.get(f"Price ({interval})")
                            v = row.get(f"Volume ({interval})")

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
                        record.open = self._sanitize_val(o)
                        record.high = self._sanitize_val(h)
                        record.low = self._sanitize_val(l)
                        record.close = self._sanitize_val(c)
                        record.volume = self._sanitize_val(v)
                        record.indicators_json = json.dumps(indicators_data)
                
                session.commit()
                print(f"Collector: Sync complete for {len(symbols)} symbols.")
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
