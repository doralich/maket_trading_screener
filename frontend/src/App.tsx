import React, { useState, useEffect } from 'react'
import useWebSocket from 'react-use-websocket'
import CryptoTable, { MarketUpdate } from './components/CryptoTable'

interface WSMessage {
  type: string;
  data?: MarketUpdate[];
  message?: string;
}

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [marketData, setMarketData] = useState<MarketUpdate[]>([])
  const [logs, setLogs] = useState<{timestamp: string, message: string}[]>([
    { timestamp: new Date().toLocaleTimeString(), message: 'INITIALIZING_CORE_SYSTEMS...' }
  ])

  const WS_URL = 'ws://localhost:8000/ws'
  const { lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    shouldReconnect: () => true,
    onOpen: () => addLog('WEBSOCKET_CONNECTION_ESTABLISHED'),
    onClose: () => addLog('WEBSOCKET_CONNECTION_CLOSED'),
    onError: (event) => addLog(`WEBSOCKET_ERROR: ${event}`),
  })

  useEffect(() => {
    if (lastJsonMessage) {
      const msg = lastJsonMessage as WSMessage
      if (msg.type === 'market_update' && msg.data) {
        setMarketData(msg.data)
        addLog(`RECEIVED_MARKET_UPDATE: ${msg.data.length}_ASSETS`)
      } else if (msg.type === 'welcome') {
        addLog(`SERVER: ${msg.message}`)
      }
    }
  }, [lastJsonMessage])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-19), { 
      timestamp: new Date().toLocaleTimeString(), 
      message: message.toUpperCase() 
    }])
  }

  const connectionStatus = {
    0: 'CONNECTING',
    1: 'ONLINE',
    2: 'CLOSING',
    3: 'OFFLINE',
  }[readyState]

  return (
    <div className="min-h-screen bg-terminal-dark text-terminal-green font-mono flex flex-col border-4 border-terminal-green m-2 p-2 relative">
      {/* Scanline overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20"></div>

      {/* Header */}
      <header className="border-b-2 border-terminal-green pb-2 mb-4 flex justify-between items-center bg-terminal-header p-2">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold terminal-glow">[ TV_SCREENER_V1.0 ]</span>
          <span className={`text-xs ${readyState === 1 ? 'text-terminal-green' : 'text-red-500'} font-bold animate-pulse`}>
            STATUS: {connectionStatus}
          </span>
        </div>
        <div className="text-right">
          <div>DATE: {new Date().toISOString().split('T')[0]}</div>
          <div>TIME: {currentTime}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col space-y-4">
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
        <section className="flex-grow min-h-[400px]">
          <CryptoTable data={marketData} />
        </section>
      </main>

      {/* Footer / Console Area */}
      <footer className="mt-4 border-t-2 border-terminal-green pt-2 bg-terminal-header min-h-[150px] p-2">
        <h2 className="text-xs font-bold mb-1 opacity-70">&gt; SYSTEM_CONSOLE</h2>
        <div className="text-[10px] space-y-1 overflow-auto max-h-[120px] font-mono">
          {logs.map((log, i) => (
            <div key={i} className={i === logs.length - 1 ? 'text-white' : 'opacity-50'}>
              [{log.timestamp}] {log.message}
            </div>
          ))}
          <div className="animate-pulse">_</div>
        </div>
      </footer>
    </div>
  )
}

export default App