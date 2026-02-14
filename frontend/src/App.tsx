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
  const [liveInterval, setLiveInterval] = useState('1D')
  const [activeSort, setActiveSort] = useState<'desc' | 'asc'>('desc')
  const [trackedData, setTrackedData] = useState<MarketUpdate[]>([])
  const [readyState, setReadyState] = useState<number>(3) // 3 = CLOSED
  const consoleRef = useRef<SystemConsoleHandle>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const terminalId = useRef(Math.random().toString(36).substring(7).toUpperCase());

  const WS_URL = 'ws://localhost:8000/ws'

  const fetchFavorites = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/favorites');
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleRemoveFavorite = async (symbol: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/favorites/${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
      });
      fetchFavorites();
      consoleRef.current?.writeLog(`REMOVED_TRACKED_ASSET: ${symbol}`, 'info');
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const fetchLiveMovers = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/screener/top-movers?interval=${liveInterval}&limit=50&sort=${activeSort}`);
      const data = await response.json();
      setMarketData(data);
      consoleRef.current?.writeLog(`FETCHED_LIVE_${activeSort === 'desc' ? 'MOVERS' : 'LOSERS'}: ${liveInterval}_TIMEFRAME`, 'info');
    } catch (error) {
      console.error('Error fetching live movers:', error);
    }
  };

  const fetchTrackedData = async () => {
    if (favorites.length === 0) {
      setTrackedData([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/favorites/live?interval=${activeInterval}`);
      const data = await response.json();
      
      const updatedData = data.map((item: any) => {
        const wsUpdate = marketData.find(d => d.Symbol === item.Symbol);
        // CRITICAL FIX: Only merge if the intervals match.
        // liveInterval is for REST poll, while WebSocket pushes (top-movers) are always 1D.
        // We only merge if the activeInterval matches the source of marketData.
        
        const isRestMatch = activeInterval === liveInterval;
        const isWsMatch = activeInterval === '1D' && activeSort === 'desc';
        
        if (wsUpdate && (isRestMatch || isWsMatch)) {
          return {
            ...item,
            Price: wsUpdate.Price ?? item.Price,
            'Change %': wsUpdate['Change %'] ?? item['Change %'],
            Volume: wsUpdate.Volume ?? item.Volume
          };
        }
        return item;
      });

      setTrackedData(updatedData);
    } catch (error) {
      console.error('Error fetching tracked data:', error);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Update live data when interval or sort changes
  useEffect(() => {
    fetchLiveMovers();
  }, [liveInterval, activeSort]);

  // Update tracked data when favorites, interval, or new market data arrives
  useEffect(() => {
    fetchTrackedData();
  }, [favorites, activeInterval, marketData]);

  // Dedicated poll for tracked assets to ensure freshness without relying on movers/losers feed
  useEffect(() => {
    const poll = setInterval(fetchTrackedData, 10000);
    return () => clearInterval(poll);
  }, [favorites, activeInterval]);

  useEffect(() => {
    const connect = () => {
      console.log('Connecting to WebSocket...');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setReadyState(0); // CONNECTING

      ws.onopen = () => {
        setReadyState(1); // OPEN
        consoleRef.current?.writeLog('WS_CONNECTION_ESTABLISHED', 'info');
      };

      ws.onmessage = (event) => {
        const message: WSMessage = JSON.parse(event.data);
        if (message.type === 'market_update' && message.data) {
          // Note: WebSocket broadcast from backend is currently top-movers only
          // We only update if the current sort is 'desc' to prevent overwrite of 'asc' data
          if (activeSort === 'desc') {
            setMarketData(message.data);
          }
        }
      };

      ws.onclose = () => {
        setReadyState(3); // CLOSED
        consoleRef.current?.writeLog('WS_CONNECTION_LOST. RECONNECTING...', 'warn');
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setReadyState(3);
        ws.close();
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, [activeSort]); // Re-connect logic or handle sort change impact on WS

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-polling for both Movers and Losers to ensure perfect consistency
  useEffect(() => {
    const poll = setInterval(fetchLiveMovers, 5000);
    return () => clearInterval(poll);
  }, [activeSort, liveInterval]);

  const connectionStatus = readyState === 1 ? 'ONLINE' : readyState === 0 ? 'CONNECTING' : 'OFFLINE';

  return (
    <div className="flex flex-col h-screen bg-black text-[#00ff41] p-4 font-mono overflow-hidden">
      {/* Header: System Status */}
      <div className="flex justify-between items-center px-4 py-2 border-b-2 border-[#00ff41] bg-black/50 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px] ${
              readyState === 1 ? 'bg-[#00ff41] shadow-[#00ff41]' : 
              readyState === 0 ? 'bg-yellow-500 shadow-yellow-500' : 
              'bg-red-600 shadow-red-600'
            }`}></div>
            <span className="text-[10px] font-bold tracking-widest uppercase">
              Status: <span className={
                readyState === 1 ? 'text-[#00ff41]' : 
                readyState === 0 ? 'text-yellow-500' : 
                'text-red-600'
              }>{connectionStatus}</span>
            </span>
          </div>
          <div className="text-[10px] opacity-50 font-mono tracking-tighter uppercase">Terminal_ID: {terminalId.current}</div>
        </div>
        <div className="text-[10px] font-mono text-[#00ff41]/80">{currentTime}</div>
      </div>

      <header className="flex justify-between items-center border-b-2 border-[#00ff41] py-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase terminal-glow">
            Market Trading Screener
          </h1>
          <span className="text-[10px] opacity-50 tracking-[0.3em] font-bold">
            v2.5.0 // SYSTEM_CORE_READY
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70">DATE: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}</div>
          <div className="text-[8px] opacity-40 uppercase tracking-widest mt-1">LOC_ID: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
        </div>
      </header>

      <main className="flex-grow flex flex-col space-y-4 min-h-0 overflow-hidden">
        <section className="shrink-0">
          <UniversalSearch 
            onFavoriteAdded={fetchFavorites} 
            favorites={favorites.map(f => f.symbol)} 
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-2 border-[#00ff41] pb-4 shrink-0">
          <div className="border border-[#00ff41] p-2 bg-[#1a1a1a]">
            <div className="flex justify-between items-center border-b border-[#00ff41]/30 mb-2">
              <h2 className="text-[10px] font-bold opacity-70">/ ASSETS_TRACKED</h2>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline space-x-2">
                <div className="text-xl font-bold terminal-glow">{favorites.length}</div>
                <div className="text-[8px] opacity-50 uppercase">TOTAL_PERSISTED</div>
              </div>
              <div className="flex gap-1">
                {['BINANCE', 'BYBIT', 'BITGET', 'OKX'].map(ex => {
                  const isActive = favorites.some(f => f.symbol.startsWith(ex));
                  return (
                    <span 
                      key={ex} 
                      className={`text-[7px] px-1 border ${isActive ? 'border-[#00ff41] text-[#00ff41] animate-breathing' : 'border-white/10 text-white/20'}`}
                      title={ex}
                    >
                      {ex.substring(0, 3)}
                    </span>
                  );
                })}
              </div>
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
            {marketData.length > 0 ? (
              (() => {
                const gainer = [...marketData].sort((a, b) => (b['Change %'] || 0) - (a['Change %'] || 0))[0];
                const price = gainer?.Price ?? 0;
                const chg = gainer?.['Change %'] ?? 0;
                return (
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#00ff41] truncate">{gainer?.Symbol || '--'}</div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-mono opacity-80">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                      <span className="text-[10px] font-bold text-[#00ff41]">+{chg.toFixed(2)}%</span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-sm font-bold text-[#00ff41]">--</div>
            )}
          </div>
          <div className="border border-[#00ff41] p-2 bg-[#1a1a1a]">
            <h2 className="text-[10px] font-bold border-b border-[#00ff41]/30 mb-2 opacity-70">/ TOP_LOSER</h2>
            {marketData.length > 0 ? (
              (() => {
                const loser = [...marketData].sort((a, b) => (a['Change %'] || 0) - (b['Change %'] || 0))[0];
                const price = loser?.Price ?? 0;
                const chg = loser?.['Change %'] || 0;
                return (
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-red-500 truncate">{loser?.Symbol || '--'}</div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-mono opacity-80">{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                      <span className="text-[10px] font-bold text-red-500">{chg.toFixed(2)}%</span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-sm font-bold text-red-500">--</div>
            )}
          </div>
          <div className="border border-[#00ff41] p-2 bg-[#1a1a1a]">
            <h2 className="text-[10px] font-bold border-b border-[#00ff41]/30 mb-2 opacity-70">/ SYSTEM_LOAD</h2>
            <div className={`text-sm font-bold animate-breathing ${readyState === 1 ? 'text-[#00ff41]' : 'text-red-600'}`}>
              {readyState === 1 ? 'STABLE' : 'DISCONNECTED'}
            </div>
          </div>
        </section>

        <section className="flex-grow min-h-0 overflow-hidden flex flex-col space-y-4">
          {favorites.length > 0 && (
            <div className="flex flex-col h-[380px] shrink-0 border border-[#00ff41]/20 p-1 bg-[#1a1a1a]/30">
              <CryptoTable 
                data={trackedData} 
                interval={activeInterval} 
                onIntervalChange={setActiveInterval}
                onRemove={handleRemoveFavorite}
                title="PERSISTED_ASSETS_DETAIL"
              />
            </div>
          )}
          <div className="flex flex-col flex-grow min-h-0 border-t border-[#00ff41]/30 pt-2 overflow-hidden">
            <div className="flex space-x-1 mb-2 px-1">
              <button 
                onClick={() => setActiveSort('desc')}
                className={`text-[10px] px-4 py-1 font-black transition-all ${activeSort === 'desc' ? 'bg-[#00ff41] text-black shadow-[0_0_10px_#00ff41]' : 'border border-[#00ff41]/30 text-[#00ff41]/50 hover:border-[#00ff41]'}`}
              >
                [ TOP_MOVERS ]
              </button>
              <button 
                onClick={() => setActiveSort('asc')}
                className={`text-[10px] px-4 py-1 font-black transition-all ${activeSort === 'asc' ? 'bg-red-600 text-white shadow-[0_0_10px_#dc2626]' : 'border border-[#00ff41]/30 text-[#00ff41]/50 hover:border-[#00ff41]'}`}
              >
                [ TOP_LOSERS ]
              </button>
            </div>
            <CryptoTable 
              data={marketData} 
              interval={liveInterval}
              onIntervalChange={setLiveInterval}
              title={activeSort === 'desc' ? "MARKET_TOP_MOVERS (LIVE_WS)" : "MARKET_TOP_LOSERS (POLLING)"}
              defaultSortDir={activeSort}
            />
          </div>
        </section>
      </main>

      <footer className="mt-4 border-t-2 border-[#00ff41] pt-2 h-[150px] shrink-0">
        <h2 className="text-xs font-bold mb-1 opacity-70">&gt; SYSTEM_CONSOLE</h2>
        <SystemConsole ref={consoleRef} />
      </footer>
    </div>
  )
}

export default App
