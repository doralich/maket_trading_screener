import React, { useState, useEffect, useRef } from 'react'
import useWebSocket from 'react-use-websocket'
import CryptoTable, { MarketUpdate } from './components/CryptoTable'
import SystemConsole, { SystemConsoleHandle } from './components/SystemConsole'

interface WSMessage {
  type: string;
  data?: MarketUpdate[];
  message?: string;
}

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [marketData, setMarketData] = useState<MarketUpdate[]>([])
  const consoleRef = useRef<SystemConsoleHandle>(null)

  const WS_URL = 'ws://localhost:8000/ws'
  const { lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    shouldReconnect: () => true,
    onOpen: () => consoleRef.current?.writeLog('WEBSOCKET_CONNECTION_ESTABLISHED', 'success'),
    onClose: () => consoleRef.current?.writeLog('WEBSOCKET_CONNECTION_CLOSED', 'error'),
    onError: () => consoleRef.current?.writeLog('WEBSOCKET_ERROR_DETECTED', 'error'),
  })

  useEffect(() => {
    if (lastJsonMessage) {
      const msg = lastJsonMessage as WSMessage
      if (msg.type === 'market_update' && msg.data) {
        setMarketData(msg.data)
        consoleRef.current?.writeLog(`RECEIVED_MARKET_UPDATE: ${msg.data.length}_ASSETS`, 'info')
      } else if (msg.type === 'welcome') {
        consoleRef.current?.writeLog(`SERVER_MESSAGE: ${msg.message}`, 'info')
      }
    }
  }, [lastJsonMessage])

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
  }[readyState]

  return (
    <div className="min-h-screen bg-terminal-dark text-terminal-green font-mono flex flex-col border-4 border-terminal-green m-2 p-2 relative overflow-hidden">
      {/* Scanline overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-10"></div>

      {/* Header */}
      <header className="border-b-2 border-terminal-green pb-2 mb-4 flex justify-between items-center bg-terminal-header p-2">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold terminal-glow">[ TV_SCREENER_V1.0 ]</span>
          <span className={`text-xs ${readyState === 1 ? 'text-terminal-green' : 'text-red-500'} font-bold animate-pulse`}>
            STATUS: {connectionStatus}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70">DATE: {new Date().toISOString().split('T')[0]}</div>
          <div className="text-xs opacity-70">TIME: {currentTime}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col space-y-4 min-h-0">
        {/* Top Section: Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b-2 border-terminal-green pb-4">
          <div className="border border-terminal-green p-2 bg-terminal-header">
            <h2 className="text-[10px] font-bold border-b border-terminal-green/30 mb-2 opacity-70">/ ASSETS_TRACKED</h2>
            <div className="text-xl font-bold terminal-glow">{marketData.length}</div>
          </div>
          <div className="border border-terminal-green p-2 bg-terminal-header">
            <h2 className="text-[10px] font-bold border-b border-terminal-green/30 mb-2 opacity-70">/ TOP_GAINER</h2>
            <div className="text-sm font-bold text-terminal-green">
              {marketData.length > 0 ? [...marketData].sort((a,b) => (b.change||0) - (a.change||0))[0].ticker : '--'}
            </div>
          </div>
          <div className="border border-terminal-green p-2 bg-terminal-header">
            <h2 className="text-[10px] font-bold border-b border-terminal-green/30 mb-2 opacity-70">/ TOP_LOSER</h2>
            <div className="text-sm font-bold text-red-500">
              {marketData.length > 0 ? [...marketData].sort((a,b) => (a.change||0) - (b.change||0))[0].ticker : '--'}
            </div>
          </div>
          <div className="border border-terminal-green p-2 bg-terminal-header">
            <h2 className="text-[10px] font-bold border-b border-terminal-green/30 mb-2 opacity-70">/ SYSTEM_LOAD</h2>
            <div className="text-sm font-bold opacity-50">STABLE</div>
          </div>
        </section>

        {/* Data Table Area */}
        <section className="flex-grow min-h-0 overflow-hidden flex flex-col">
          <CryptoTable data={marketData} />
        </section>
      </main>

      {/* Footer / Console Area */}
      <footer className="mt-4 border-t-2 border-terminal-green pt-2 h-[150px] shrink-0">
        <h2 className="text-xs font-bold mb-1 opacity-70">&gt; SYSTEM_CONSOLE</h2>
        <SystemConsole ref={consoleRef} />
      </footer>
    </div>
  )
}

export default App
