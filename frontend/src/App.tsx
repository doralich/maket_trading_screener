import React, { useState, useEffect, useRef } from 'react'
import CryptoTable from './components/CryptoTable'
import type { MarketUpdate } from './components/CryptoTable'
import SystemConsole from './components/SystemConsole'
import type { SystemConsoleHandle } from './components/SystemConsole'
import UniversalSearch from './components/UniversalSearch'

interface WSMessage {
  type: string;
  data?: MarketUpdate[];
  message?: string;
}

interface Favorite {
  id: number;
  symbol: string;
  added_at: string;
}

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [marketData, setMarketData] = useState<MarketUpdate[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [activeInterval, setActiveInterval] = useState('5')
  const [trackedData, setTrackedData] = useState<MarketUpdate[]>([])
  const [readyState, setReadyState] = useState<number>(3) // 3 = CLOSED
  const consoleRef = useRef<SystemConsoleHandle>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const WS_URL = 'ws://localhost:8000/ws'
  const intervals = ["5", "10", "15", "60", "120", "240", "360", "720", "1D", "1W", "1M"];

  const fetchFavorites = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/favorites');
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchTrackedData = async () => {
    if (favorites.length === 0) {
      setTrackedData([]);
      return;
    }

    try {
      const results = await Promise.all(favorites.map(async (fav) => {
        try {
          const response = await fetch(`http://localhost:8000/api/v1/favorites/history?symbol=${encodeURIComponent(fav.symbol)}&interval=${activeInterval}&limit=1`);
          const history = await response.json();
          if (history.length > 0) {
            const latest = history[0];
            const wsUpdate = marketData.find(d => d.Symbol === latest.symbol);
            
            // Map indicator keys from DB to what CryptoTable expects
            const indicators = latest.indicators || {};
            const mappedIndicators: any = {
              'Relative Strength Index (14)': indicators.RSI,
              'MACD Level (12, 26)': indicators.MACD,
              'MACD Signal (12, 26)': indicators.MACD_Signal,
              'Simple Moving Average (20)': indicators.SMA20,
              'Simple Moving Average (50)': indicators.SMA50,
              'Simple Moving Average (200)': indicators.SMA200,
            };

            // Calculate change % if not provided by WS
            const calculatedChange = latest.open && latest.close 
              ? ((latest.close - latest.open) / latest.open) * 100 
              : 0;
            
            return {
              Symbol: latest.symbol,
              Price: wsUpdate?.Price ?? latest.close,
              'Change %': wsUpdate?.['Change %'] ?? calculatedChange,
              Exchange: fav.symbol.split(':')[0],
              Description: '',
              ...mappedIndicators,
              ...(activeInterval === '5' ? wsUpdate : {})
            };
          }
        } catch (e) {
          console.error(`Error fetching data for ${fav.symbol}:`, e);
        }
        return null;
      }));
      
      setTrackedData(results.filter((d): d is MarketUpdate => d !== null));
    } catch (error) {
      console.error('Error in batch fetch:', error);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Update tracked data when favorites, interval, or new market data arrives
  useEffect(() => {
    fetchTrackedData();
  }, [favorites, activeInterval, marketData]);

  useEffect(() => {
    const connect = () => {
      console.log('Connecting to WebSocket...');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setReadyState(0); // CONNECTING

      ws.onopen = () => {
        setReadyState(1); // OPEN
        consoleRef.current?.writeLog('WEBSOCKET_CONNECTION_ESTABLISHED', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          if (msg.type === 'market_update' && msg.data) {
            setMarketData(msg.data);
            consoleRef.current?.writeLog(`RECEIVED_MARKET_UPDATE: ${msg.data.length}_ASSETS`, 'info');
          } else if (msg.type === 'welcome') {
            consoleRef.current?.writeLog(`SERVER_MESSAGE: ${msg.message}`, 'info');
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      ws.onerror = () => {
        consoleRef.current?.writeLog('WEBSOCKET_ERROR_DETECTED', 'error');
      };

      ws.onclose = () => {
        setReadyState(3); // CLOSED
        consoleRef.current?.writeLog('WEBSOCKET_CONNECTION_CLOSED. RECONNECTING...', 'error');
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const connectionStatus = {
    0: 'CONNECTING',
    1: 'ONLINE',
    2: 'CLOSING',
    3: 'OFFLINE',
  }[readyState] || 'UNKNOWN'

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#00ff41] font-mono flex flex-col border-4 border-[#00ff41] m-2 p-2 relative overflow-hidden box-border">
      {/* Scanline overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-10"></div>

      {/* Header */}
      <header className="border-b-2 border-[#00ff41] pb-2 mb-4 flex justify-between items-center bg-[#1a1a1a] p-2 shrink-0">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold terminal-glow">[ TV_SCREENER_V1.0 ]</span>
          <span className={`text-xs ${readyState === 1 ? 'text-[#00ff41]' : 'text-red-500'} font-bold animate-pulse`}>
            STATUS: {connectionStatus}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70">DATE: {new Date().toISOString().split('T')[0]}</div>
          <div className="text-xs opacity-70">TIME: {currentTime}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col space-y-4 min-h-0 overflow-hidden">
        {/* Search & Indexing Section */}
        <section className="shrink-0">
          <UniversalSearch 
            onFavoriteAdded={fetchFavorites} 
            favorites={favorites.map(f => f.symbol)} 
          />
        </section>

        {/* Top Section: Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-2 border-[#00ff41] pb-4 shrink-0">
          <div className="border border-[#00ff41] p-2 bg-[#1a1a1a]">
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 mb-2">
              <h2 className="text-[10px] font-bold opacity-70">/ ASSETS_TRACKED</h2>
              <select 
                value={activeInterval} 
                onChange={(e) => setActiveInterval(e.target.value)}
                className="bg-black text-[9px] border border-[#00ff41]/20 focus:outline-none px-1"
              >
                {intervals.map(int => <option key={int} value={int}>{int === '1D' ? 'DAILY' : int === '1W' ? 'WEEKLY' : int === '1M' ? 'MONTHLY' : int + 'M'}</option>)}
              </select>
            </div>
            <div className="flex items-baseline space-x-2">
              <div className="text-xl font-bold terminal-glow">{favorites.length}</div>
              <div className="text-[8px] opacity-50 uppercase">TOTAL_PERSISTED</div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2 max-h-[40px] overflow-y-auto">
              {favorites.map(f => {
                const data = trackedData.find(d => d.Symbol === f.symbol);
                const chg = data?.['Change %'] ?? 0;
                return (
                  <span key={f.symbol} className={`text-[8px] border ${data ? (chg >= 0 ? 'border-[#00ff41]/40 text-[#00ff41]' : 'border-red-500/40 text-red-500') : 'border-white/10 text-white/30'} px-1 bg-black/50`}>
                    {f.symbol.split(':')[1]}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="border border-[#00ff41] p-2 bg-[#1a1a1a]">
            <h2 className="text-[10px] font-bold border-b border-[#00ff41]/30 mb-2 opacity-70">/ TOP_GAINER</h2>
            <div className="text-sm font-bold text-[#00ff41]">
              {marketData.length > 0 ? [...marketData].sort((a,b) => (b['Change %']||0) - (a['Change %']||0))[0]?.Symbol || '--' : '--'}
            </div>
          </div>
          <div className="border border-[#00ff41] p-2 bg-[#1a1a1a]">
            <h2 className="text-[10px] font-bold border-b border-[#00ff41]/30 mb-2 opacity-70">/ TOP_LOSER</h2>
            <div className="text-sm font-bold text-red-500">
              {marketData.length > 0 ? [...marketData].sort((a,b) => (a['Change %']||0) - (b['Change %']||0))[0]?.Symbol || '--' : '--'}
            </div>
          </div>
          <div className="border border-[#00ff41] p-2 bg-[#1a1a1a]">
            <h2 className="text-[10px] font-bold border-b border-[#00ff41]/30 mb-2 opacity-70">/ SYSTEM_LOAD</h2>
            <div className="text-sm font-bold opacity-50">STABLE</div>
          </div>
        </section>

        {/* Data Table Area */}
        <section className="flex-grow min-h-0 overflow-hidden flex flex-col space-y-2">
          {favorites.length > 0 && (
            <div className="flex flex-col h-[380px] shrink-0 border border-[#00ff41]/20 p-1 bg-[#1a1a1a]/30">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-[10px] font-bold opacity-70">/ PERSISTED_ASSETS_DETAIL (INTERVAL: {activeInterval === '1D' ? 'DAILY' : activeInterval === '1W' ? 'WEEKLY' : activeInterval === '1M' ? 'MONTHLY' : activeInterval + 'M'})</h2>
                <div className="text-[8px] opacity-40">SHOWING_{trackedData.length}_OF_{favorites.length}_ASSETS</div>
              </div>
              <div className="flex-grow overflow-auto">
                <CryptoTable data={trackedData} />
              </div>
            </div>
          )}
          <div className="flex flex-col flex-grow min-h-0 border-t border-[#00ff41]/30 pt-2 overflow-hidden">
            <h2 className="text-[10px] font-bold mb-1 opacity-70">/ MARKET_TOP_MOVERS (LIVE_WS)</h2>
            <div className="flex-grow overflow-auto">
              <CryptoTable data={marketData} />
            </div>
          </div>
        </section>
      </main>

      {/* Footer / Console Area */}
      <footer className="mt-4 border-t-2 border-[#00ff41] pt-2 h-[150px] shrink-0">
        <h2 className="text-xs font-bold mb-1 opacity-70">&gt; SYSTEM_CONSOLE</h2>
        <SystemConsole ref={consoleRef} />
      </footer>
    </div>
  )
}

export default App
