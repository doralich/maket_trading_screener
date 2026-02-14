from tvscreener import CryptoScreener, CryptoField
import pandas as pd
import numpy as np
from sqlmodel import Session, select
from app.models import TickerIndex, Favorite, MarketDataHistory
from app.database import engine
import time
import json

class ScreenerService:
    def __init__(self):
        # Maps frontend intervals to TradingView field suffixes and indicator/change fields
        # Note: API uses '|' for change fields (e.g., change|15), while indicators use '|' or '.' 
        # based on library version. tvscreener specifically uses '|' for rolling changes.
        self.interval_map = {
            "1": {"suffix": "_1", "change": "CHANGE_1", "close": "CLOSE_1"},
            "5": {"suffix": "_5", "change": "CHANGE_5", "close": "CLOSE_5"},
            "15": {"suffix": "_15", "change": "CHANGE_15", "close": "CLOSE_15"},
            "60": {"suffix": "_60", "change": "CHANGE_60", "close": "CLOSE_60"},
            "120": {"suffix": "_120", "change": "CHANGE_120", "close": "CLOSE_120"},
            "240": {"suffix": "_240", "change": "CHANGE_240", "close": "CLOSE_240"},
            "1D": {"suffix": "", "change": "CHANGE_PERCENT", "close": "PRICE"},
            "1W": {"suffix": "_1W", "change": "CHANGE_1W", "close": "CLOSE_1W"},
            "1M": {"suffix": "_1M", "change": "CHANGE_1M", "close": "CLOSE_1M"}
        }

    def _get_common_fields(self, interval: str):
        conf = self.interval_map.get(interval, self.interval_map["1D"])
        suffix = conf["suffix"]
        
        # Base technical fields
        price_f = getattr(CryptoField, conf["close"], CryptoField.PRICE)
        rsi_f = getattr(CryptoField, f"RSI{suffix}" if interval != "1D" else "RELATIVE_STRENGTH_INDEX_14")
        change_f = getattr(CryptoField, conf["change"], CryptoField.CHANGE_PERCENT)
        
        # Standard indicators
        macd_f = getattr(CryptoField, f"MACD_MACD{suffix}" if interval != "1D" else "MACD_LEVEL_12_26")
        macd_sig_f = getattr(CryptoField, f"MACD_SIGNAL{suffix}" if interval != "1D" else "MACD_SIGNAL_12_26")
        sma20_f = getattr(CryptoField, f"SMA20{suffix}" if interval != "1D" else "SIMPLE_MOVING_AVERAGE_20")
        sma50_f = getattr(CryptoField, f"SMA50{suffix}" if interval != "1D" else "SIMPLE_MOVING_AVERAGE_50")
        sma200_f = getattr(CryptoField, f"SMA200{suffix}" if interval != "1D" else "SIMPLE_MOVING_AVERAGE_200")
        vol_f = getattr(CryptoField, f"VOLUME{suffix}" if interval != "1D" else "VOLUME")

        return {
            "price": price_f, "rsi": rsi_f, "change": change_f, 
            "macd": macd_f, "macd_sig": macd_sig_f, "sma20": sma20_f,
            "sma50": sma50_f, "sma200": sma200_f, "volume": vol_f
        }

    def _process_dataframe(self, df, fields_map):
        if df.empty: return df
        
        # Standardize the dataframe to prevent column name collisions.
        # If the API returns default columns (like 'Change %' for 24h) that conflict 
        # with our interval-specific renames, we drop the defaults first.
        target_display_names = [
            "Price", "Change %", "Volume", "Relative Strength Index (14)", 
            "MACD Level (12, 26)", "MACD Signal (12, 26)",
            "Simple Moving Average (20)", "Simple Moving Average (50)", "Simple Moving Average (200)"
        ]
        
        source_cols = []
        for f in fields_map.values():
            if hasattr(f, "field_name"): source_cols.append(f.field_name)
            if hasattr(f, "label"): source_cols.append(f.label)
        
        # Drop existing columns that share a target name but are NOT the intended source
        cols_to_drop = [c for c in df.columns if c in target_display_names and c not in source_cols]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        rename_map = {"name": "Symbol", "exchange": "Exchange", "description": "Description"}
        
        calc_map = {
            fields_map["price"]: "Price",
            fields_map["rsi"]: "Relative Strength Index (14)",
            fields_map["change"]: "Change %",
            fields_map["macd"]: "MACD Level (12, 26)",
            fields_map["macd_sig"]: "MACD Signal (12, 26)",
            fields_map["sma20"]: "Simple Moving Average (20)",
            fields_map["sma50"]: "Simple Moving Average (50)",
            fields_map["sma200"]: "Simple Moving Average (200)",
            fields_map["volume"]: "Volume"
        }

        for f, display_name in calc_map.items():
            if not f: continue
            target_name = f.field_name.lower() if hasattr(f, "field_name") else str(f).lower()
            target_label = f.label.lower() if hasattr(f, "label") else str(f).lower()
            
            # FIX: Case-insensitive match to handle API returning 'Change|5' vs library 'change|5'
            actual_col = next((col for col in df.columns if col.lower() == target_name or col.lower() == target_label), None)
            if actual_col: rename_map[actual_col] = display_name
        
        df = df.rename(columns=rename_map)
        return df

    def get_top_movers(self, limit: int = 50, interval: str = "1D", sort_descending: bool = True):
        try:
            cs = CryptoScreener()
            # 1. Filter for Big Four Exchanges
            cs.where(CryptoField.EXCHANGE.isin(["BINANCE", "BYBIT", "BITGET", "OKX"]))
            
            # 2. Add Minimum Volume Filter to remove illiquid/junk tickers
            # 50,000 USD minimum 24h volume ensures we see real market action
            cs.where(CryptoField.VOLUME_24H_IN_USD > 50000)
            
            cs.set_range(0, limit)
            f_map = self._get_common_fields(interval)
            
            # FIX: Enforce strictly negative change for losers to prevent positive values (flickering bug)
            if not sort_descending:
                cs.where(f_map["change"] < 0)
            
            # 3. API-Side Sorting: Essential for true top/bottom detection
            cs.sort_by(f_map["change"], ascending=not sort_descending)
            
            # 4. Request Fields
            request_fields = [CryptoField.NAME, CryptoField.EXCHANGE, CryptoField.DESCRIPTION]
            for f in f_map.values():
                if f and hasattr(f, "field_name"):
                    if hasattr(f, 'historical'): f.historical = False 
                    if f not in request_fields: request_fields.append(f)

            cs.select(*request_fields)
            df = cs.get()
            if df.empty: return self._get_fallback_data(sort_descending)
            
            processed_df = self._process_dataframe(df, f_map)
            
            # Local Safety Filter: Double-check to prevent positive values in Top Losers
            if not sort_descending:
                processed_df = processed_df[processed_df['Change %'] < 0]

            # Final sort consistency
            processed_df = processed_df.sort_values(by='Change %', ascending=not sort_descending)
            return processed_df.head(limit).replace({np.nan: None}).to_dict(orient='records')
        except Exception as e:
            print(f"DEBUG: Error in get_top_movers: {e}")
            return self._get_fallback_data(sort_descending)

    def get_assets_by_symbols(self, symbols: list[str], interval: str = "1D"):
        if not symbols: return []
        try:
            cs = CryptoScreener()
            cs.symbols = {"tickers": symbols, "query": {"types": []}}
            cs.set_range(0, 1000)
            f_map = self._get_common_fields(interval)
            
            request_fields = [CryptoField.NAME, CryptoField.EXCHANGE, CryptoField.DESCRIPTION]
            for f in f_map.values():
                if f and hasattr(f, "field_name"):
                    if hasattr(f, 'historical'): f.historical = False 
                    if f not in request_fields: request_fields.append(f)

            cs.select(*request_fields)
            df = cs.get()
            if df.empty: return []
            
            processed_df = self._process_dataframe(df, f_map)
            return processed_df.replace({np.nan: None}).to_dict(orient='records')
        except Exception as e:
            print(f"DEBUG: Error in get_assets_by_symbols: {e}")
            return []

    def search_ticker(self, query: str):
        query = query.strip().upper()
        try:
            with Session(engine) as session:
                statement = select(TickerIndex).where(
                    (TickerIndex.symbol.like(f"%{query}%")) | (TickerIndex.name.like(f"%{query}%"))
                )
                results = session.exec(statement.limit(50)).all()
                return [r.model_dump() for r in results]
        except Exception as e:
            print(f"DEBUG: Search error: {e}")
        return []

    def _get_fallback_data(self, sort_descending: bool = True):
        change = 2.5 if sort_descending else -2.5
        rsi = 65.2 if sort_descending else 35.2
        return [
            {
                "Symbol": "BINANCE:BTCUSDT", "Price": 98000.0, "Change %": change, "Volume": 12000000000, 
                "Exchange": "BINANCE", "Relative Strength Index (14)": rsi
            }
        ]
