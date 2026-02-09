import React, { useState, useEffect } from 'react'

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-terminal-dark text-terminal-green font-mono flex flex-col border-4 border-terminal-green m-2 p-2 relative">
      {/* Scanline overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50 opacity-20"></div>

      {/* Header */}
      <header className="border-b-2 border-terminal-green pb-2 mb-4 flex justify-between items-center bg-terminal-header p-2">
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold terminal-glow">[ TV_SCREENER_V1.0 ]</span>
          <span className="text-xs opacity-70">STATUS: ONLINE</span>
        </div>
        <div className="text-right">
          <div>DATE: {new Date().toISOString().split('T')[0]}</div>
          <div>TIME: {currentTime}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col space-y-4">
        {/* Top Section: Statistics or Filters */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b-2 border-terminal-green pb-4">
          <div className="border border-terminal-green p-2 bg-terminal-header">
            <h2 className="text-sm font-bold border-b border-terminal-green mb-2">/ MARKET_SUMMARY</h2>
            <div className="text-xs space-y-1">
              <div>TOTAL_ASSETS: 1420</div>
              <div>VOL_24H: $24.5B</div>
              <div>DOMINANCE: BTC 52.1%</div>
            </div>
          </div>
          <div className="border border-terminal-green p-2 bg-terminal-header col-span-2">
            <h2 className="text-sm font-bold border-b border-terminal-green mb-2">/ SEARCH_AND_FILTER</h2>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="ENTER_TICKER..." 
                className="bg-black border border-terminal-green text-terminal-green px-2 py-1 text-xs w-full focus:outline-none focus:terminal-glow"
              />
              <button className="bg-terminal-green text-black px-4 py-1 text-xs font-bold hover:bg-white transition-colors">
                EXECUTE
              </button>
            </div>
          </div>
        </section>

        {/* Data Table Area */}
        <section className="flex-grow border border-terminal-green bg-black p-2 overflow-auto relative min-h-[400px]">
          <h2 className="text-sm font-bold border-b border-terminal-green mb-2">/ CRYPTO_TOP_MOVERS</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-terminal-green opacity-70">
                <th className="p-2">TICKER</th>
                <th className="p-2 text-right">PRICE</th>
                <th className="p-2 text-right">CHANGE_24H</th>
                <th className="p-2 text-right">VOL_24H</th>
                <th className="p-2">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder Row */}
              <tr className="hover:bg-terminal-green hover:text-black cursor-pointer">
                <td className="p-2 font-bold">BTCUSD</td>
                <td className="p-2 text-right">98,245.10</td>
                <td className="p-2 text-right text-terminal-green">+2.45%</td>
                <td className="p-2 text-right">$12.4B</td>
                <td className="p-2"><span className="border border-current px-1">[VIEW]</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>

      {/* Footer / Console Area */}
      <footer className="mt-4 border-t-2 border-terminal-green pt-2 bg-terminal-header min-h-[150px] p-2">
        <h2 className="text-xs font-bold mb-1 opacity-70">&gt; SYSTEM_CONSOLE</h2>
        <div className="text-[10px] space-y-1 overflow-auto max-h-[120px] font-mono">
          <div className="opacity-50">[09:00:01] INITIALIZING_CORE_SYSTEMS...</div>
          <div className="opacity-50">[09:00:02] ESTABLISHING_WEBSOCKET_CONNECTION...</div>
          <div className="opacity-50">[09:00:03] AUTHENTICATION_SUCCESSFUL</div>
          <div className="text-white">&gt; READY</div>
        </div>
      </footer>
    </div>
  )
}

export default App