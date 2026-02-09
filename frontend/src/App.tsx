import React, { useState, useEffect, useRef } from 'react'
import CryptoTable from './components/CryptoTable'
import type { MarketUpdate } from './components/CryptoTable'
import SystemConsole from './components/SystemConsole'
import type { SystemConsoleHandle } from './components/SystemConsole'

interface WSMessage {
  type: string;
  data?: MarketUpdate[];
  message?: string;
}

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [marketData, setMarketData] = useState<MarketUpdate[]>([])
  const [readyState, setReadyState] = useState<number>(3) // 3 = CLOSED
  const consoleRef = useRef<SystemConsoleHandle>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const WS_URL = 'ws://localhost:8000/ws'

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
        {/* Top Section: Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-2 border-[#00ff41] pb-4 shrink-0">
          <div className="border border-[#00ff41] p-2 bg-[#1a1a1a]">
            <h2 className="text-[10px] font-bold border-b border-[#00ff41]/30 mb-2 opacity-70">/ ASSETS_TRACKED</h2>
            <div className="text-xl font-bold terminal-glow">{marketData.length}</div>
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
        <section className="flex-grow min-h-0 overflow-hidden flex flex-col">
          <CryptoTable data={marketData} />
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
