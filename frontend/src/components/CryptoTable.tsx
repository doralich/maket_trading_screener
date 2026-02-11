import React, { useState, useMemo } from 'react'

export type MarketUpdate = {
  Symbol: string;
  symbol?: string; // Handle both cases
  Price?: number;
  'Change %'?: number;
  Volume?: number | string;
  Exchange?: string;
  exchange?: string;
  Description?: string;
  // Technical Indicators
  'Relative Strength Index (14)'?: number;
  'MACD Level (12, 26)'?: number;
  'MACD Signal (12, 26)'?: number;
  'Simple Moving Average (20)'?: number;
  'Simple Moving Average (50)'?: number;
  'Simple Moving Average (200)'?: number;
  [key: string]: any;
}

interface CryptoTableProps {
  data: MarketUpdate[];
  interval?: string;
  onIntervalChange?: (interval: string) => void;
  onRemove?: (symbol: string) => void;
  title?: string;
  defaultSortDir?: 'asc' | 'desc';
}

type SortConfig = {
  key: string | null;
  direction: 'asc' | 'desc';
}

const CryptoTable: React.FC<CryptoTableProps> = ({ data, interval, onIntervalChange, onRemove, title, defaultSortDir = 'desc' }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'Change %', direction: defaultSortDir });
  const [textFilter, setTextFilter] = useState('');

  // Sync sort direction when tab changes
  React.useEffect(() => {
    setSortConfig({ key: 'Change %', direction: defaultSortDir });
  }, [defaultSortDir]);
  const [activeExchange, setActiveExchange] = useState<string | null>(null);
  
  // Technical Filters State
  const [rsiFilter, setRsiFilter] = useState<'all' | 'overbought' | 'oversold'>('all');
  const [smaFilter, setSmaFilter] = useState<'all' | 'aboveSMA50' | 'aboveSMA200'>('all');
  const [macdFilter, setMacdFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [helpDialog, setHelpDialog] = useState<{ title: string, content: string, x: number, y: number } | null>(null);

  const intervals = [
    { label: "1M", value: "1" },
    { label: "5M", value: "5" },
    { label: "15M", value: "15" },
    { label: "1H", value: "60" },
    { label: "4H", value: "240" },
    { label: "1D", value: "1D" },
    { label: "1W", value: "1W" },
    { label: "1MO", value: "1M" }
  ];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const exchanges = useMemo(() => {
    const set = new Set<string>(['BINANCE', 'BYBIT', 'BITGET', 'OKX']);
    data.forEach(item => {
      const ex = item.Exchange || item.exchange;
      if (ex) set.add(ex);
    });
    return Array.from(set).sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let items = [...data];
    
    // 1. Text Filter
    if (textFilter) {
      const searchLower = textFilter.toLowerCase();
      items = items.filter(item => {
        const symbol = (item.Symbol || item.symbol || '').toLowerCase();
        const exchange = (item.Exchange || item.exchange || '').toLowerCase();
        const name = (item.Name || item.name || '').toLowerCase();
        const desc = (item.Description || item.description || '').toLowerCase();
        
        return symbol.includes(searchLower) || 
               exchange.includes(searchLower) || 
               name.includes(searchLower) ||
               desc.includes(searchLower);
      });
    }

    // 2. Exchange Filter
    if (activeExchange) {
      items = items.filter(item => (item.Exchange || item.exchange) === activeExchange);
    }

    // 3. RSI Filter
    if (rsiFilter === 'overbought') {
      items = items.filter(item => (item['Relative Strength Index (14)'] ?? 0) >= 70);
    } else if (rsiFilter === 'oversold') {
      items = items.filter(item => (item['Relative Strength Index (14)'] ?? 0) <= 30 && (item['Relative Strength Index (14)'] ?? 0) > 0);
    }

    // 4. SMA Filter
    if (smaFilter === 'aboveSMA50') {
      items = items.filter(item => (item.Price ?? 0) > (item['Simple Moving Average (50)'] ?? 0));
    } else if (smaFilter === 'aboveSMA200') {
      items = items.filter(item => (item.Price ?? 0) > (item['Simple Moving Average (200)'] ?? 0));
    }

    // 5. MACD Filter
    if (macdFilter === 'bullish') {
      items = items.filter(item => (item['MACD Level (12, 26)'] ?? 0) > (item['MACD Signal (12, 26)'] ?? 0));
    } else if (macdFilter === 'bearish') {
      items = items.filter(item => (item['MACD Level (12, 26)'] ?? 0) < (item['MACD Signal (12, 26)'] ?? 0));
    }

    // 6. Sort
    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [data, sortConfig, textFilter, activeExchange, rsiFilter, smaFilter, macdFilter]);

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <span className="opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  const formatVolume = (val: any) => {
    if (val === undefined || val === null) return '--';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '--';
    
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const resetFilters = () => {
    setTextFilter('');
    setActiveExchange(null);
    setRsiFilter('all');
    setSmaFilter('all');
    setMacdFilter('all');
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* Help Note Popup */}
      {helpDialog && (
        <>
          {/* Invisible click-away layer */}
          <div className="fixed inset-0 z-[100]" onClick={() => setHelpDialog(null)}></div>
          
          <div 
            className="fixed z-[101] pointer-events-auto bg-[#1a1a1a]/90 backdrop-blur-md text-[#00ff41] p-3 w-64 shadow-[0_0_30px_rgba(0,255,65,0.4)] border-2 border-[#00ff41] transform transition-all animate-in fade-in zoom-in duration-200"
            style={{ 
              top: `${Math.min(window.innerHeight - 200, helpDialog.y + 25)}px`, 
              left: `${Math.max(20, Math.min(window.innerWidth - 280, helpDialog.x - 120))}px` 
            }}
          >
            <div className="flex justify-between items-center mb-2 border-b border-[#00ff41]/30 pb-1">
              <h3 className="text-[9px] font-bold uppercase tracking-widest leading-none">/ SYSTEM_DOCS_{helpDialog.title}</h3>
              <button 
                onClick={() => setHelpDialog(null)} 
                className="text-[#00ff41] hover:bg-[#00ff41] hover:text-black px-1.5 py-0.5 text-[10px] border border-[#00ff41]/30 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-[10px] leading-relaxed font-mono opacity-90">
              {helpDialog.content}
            </p>
            <div className="mt-3 pt-2 border-t border-[#00ff41]/10 flex justify-between items-center">
              <span className="text-[7px] opacity-30 font-bold uppercase tracking-[0.2em]">ACCESS_LEVEL: UNRESTRICTED</span>
              <span className="text-[7px] opacity-30 font-mono">ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
            </div>
          </div>
        </>
      )}

      <div className="mb-2 shrink-0 flex justify-between items-end px-1">
        <h2 className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">/ {title}</h2>
        <div className="text-[8px] opacity-40">ACTIVE_RECORDS: {data.length}</div>
      </div>
      
      <div className="mb-4 space-y-3 shrink-0 bg-[#1a1a1a] p-2 border border-[#00ff41]/30">
        <div className="flex space-x-2">
          <div className="flex-grow relative">
            <span className="absolute left-2 top-1.5 opacity-50 text-[10px] tracking-widest pointer-events-none">FILTER_&gt;</span>
            <input 
              type="text" 
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="FILTER CURRENT VIEW (TICKER, EXCHANGE)..." 
              className="bg-black border border-[#00ff41]/50 text-[#00ff41] pl-16 pr-2 py-1 text-xs w-full focus:outline-none focus:border-[#00ff41] placeholder:opacity-20"
            />
          </div>
          <button 
            onClick={resetFilters}
            className="border border-red-500 text-red-500 px-3 py-1 text-[10px] font-bold hover:bg-red-500 hover:text-black transition-colors"
          >
            RESET_ALL
          </button>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[10px]">
          <div className="flex items-center space-x-2">
            <span className="opacity-50">RSI(14):</span>
            <select 
              value={rsiFilter} 
              onChange={(e) => setRsiFilter(e.target.value as any)}
              className="bg-black border border-[#00ff41]/30 text-[#00ff41] px-1 focus:outline-none"
            >
              <option value="all">ALL</option>
              <option value="overbought">OVERBOUGHT (&gt;=70)</option>
              <option value="oversold">OVERSOLD (&lt;=30)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="opacity-50">TREND:</span>
            <select 
              value={smaFilter} 
              onChange={(e) => setSmaFilter(e.target.value as any)}
              className="bg-black border border-[#00ff41]/30 text-[#00ff41] px-1 focus:outline-none"
            >
              <option value="all">ALL</option>
              <option value="aboveSMA50">PRICE &gt; SMA50</option>
              <option value="aboveSMA200">PRICE &gt; SMA200</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pr-4">
            <span className="opacity-50">MACD:</span>
            <select 
              value={macdFilter} 
              onChange={(e) => setMacdFilter(e.target.value as any)}
              className="bg-black border border-[#00ff41]/30 text-[#00ff41] px-1 focus:outline-none"
            >
              <option value="all">ALL</option>
              <option value="bullish">BULLISH (LEVEL &gt; SIGNAL)</option>
              <option value="bearish">BEARISH (LEVEL &lt; SIGNAL)</option>
            </select>
          </div>

          {onIntervalChange && (
            <div className="flex items-center space-x-2 border-l border-[#00ff41]/30 pl-4">
              <span className="opacity-50 font-bold text-[#00ff41]">INTERVAL:</span>
              <select 
                value={interval} 
                onChange={(e) => onIntervalChange(e.target.value)}
                className="bg-[#00ff41] text-black font-bold px-1 focus:outline-none border-none cursor-pointer"
              >
                {intervals.map(int => (
                  <option key={int.value} value={int.value}>{int.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] opacity-50">EXCHANGES:</span>
          {exchanges.slice(0, 8).map(ex => (
            <button 
              key={ex}
              onClick={() => setActiveExchange(activeExchange === ex ? null : ex)}
              className={`px-2 py-0.5 text-[10px] border transition-colors ${activeExchange === ex ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-[#00ff41]/20 hover:border-[#00ff41]'}`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow overflow-auto border border-[#00ff41] bg-black min-h-0">
        <table className="w-full text-left text-[10px] border-collapse relative">
          <thead className="sticky top-0 bg-[#1a1a1a] z-10 shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
            <tr className="border-b border-[#00ff41]">
              <th className="p-2 cursor-pointer hover:bg-[#00ff41] hover:text-black" onClick={() => handleSort('Symbol')}>TICKER {renderSortIcon('Symbol')}</th>
              <th className="p-2 cursor-pointer hover:bg-[#00ff41] hover:text-black" onClick={() => handleSort('Exchange')}>EXCHANGE {renderSortIcon('Exchange')}</th>
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black" onClick={() => handleSort('Price')}>PRICE {renderSortIcon('Price')}</th>
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black" onClick={() => handleSort('Volume')}>VOLUME {renderSortIcon('Volume')}</th>
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black" onClick={() => handleSort('Change %')}>CHG% {renderSortIcon('Change %')}</th>
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black" onClick={() => handleSort('Relative Strength Index (14)')}>RSI {renderSortIcon('Relative Strength Index (14)')}</th>
              <th className="p-2 text-right">
                MACD (L/S)
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHelpDialog({ 
                      title: 'MACD_LEVEL_SIGNAL', 
                      content: 'Moving Average Convergence Divergence. Level (L) is the distance between 12 and 26-period EMAs. Signal (S) is a 9-period EMA of the Level. BULLISH (Green) when L > S.',
                      x: rect.left,
                      y: rect.top
                    });
                  }}
                  className="ml-1 opacity-40 hover:opacity-100 hover:text-white"
                >
                  (?)
                </button>
              </th>
              <th className="p-2 text-right">
                SMA 20/50/200
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHelpDialog({ 
                      title: 'SIMPLE_MOVING_AVERAGES', 
                      content: 'Price proximity to Short (20), Medium (50), and Long-term (200) trend lines. Y (Green) indicates price is currently ABOVE that average, N (Red) indicates it is BELOW.',
                      x: rect.left,
                      y: rect.top
                    });
                  }}
                  className="ml-1 opacity-40 hover:opacity-100 hover:text-white"
                >
                  (?)
                </button>
              </th>
              {onRemove && <th className="p-2 text-right">ACTION</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00ff41]/10">
            {filteredAndSortedData.length > 0 ? filteredAndSortedData.map((asset, i) => {
              const symbol = asset.Symbol || asset.symbol || '--';
              const exchange = asset.Exchange || asset.exchange || '--';
              const chg = asset['Change %'] ?? 0;
              const rsi = asset['Relative Strength Index (14)'];
              const macdL = asset['MACD Level (12, 26)'];
              const macdS = asset['MACD Signal (12, 26)'];
              const sma20 = asset['Simple Moving Average (20)'];
              const sma50 = asset['Simple Moving Average (50)'];
              const sma200 = asset['Simple Moving Average (200)'];
              const price = asset.Price ?? asset.close ?? 0;
              
              return (
                <tr key={symbol + i} className="hover:bg-[#00ff41]/5 transition-colors">
                  <td className="p-2 font-bold">{symbol}</td>
                  <td className="p-2 opacity-60 uppercase">{exchange.split(':')[0]}</td>
                  <td className="p-2 text-right font-mono">{(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                  <td className="p-2 text-right font-mono opacity-80">{formatVolume(asset.Volume)}</td>
                  <td className={`p-2 text-right font-bold ${chg >= 0 ? 'text-[#00ff41]' : 'text-red-500'}`}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </td>
                  <td className={`p-2 text-right ${rsi && rsi >= 70 ? 'text-red-500 font-bold' : rsi && rsi <= 30 ? 'text-[#00ff41] font-bold' : ''}`}>
                    {rsi?.toFixed(1) ?? '--'}
                  </td>
                  <td className="p-2 text-right text-[9px] opacity-70">
                    <span className={macdL && macdS && macdL > macdS ? 'text-[#00ff41]' : 'text-red-400'}>
                      {macdL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) ?? '--'}
                    </span>
                    /
                    {macdS?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) ?? '--'}
                  </td>
                  <td className="p-2 text-right text-[9px] opacity-70">
                    {sma20 ? (
                      <span className={price > sma20 ? 'text-[#00ff41]' : 'text-red-400'}>
                        {price > sma20 ? 'Y' : 'N'}
                      </span>
                    ) : '--'}/
                    {sma50 ? (
                      <span className={price > sma50 ? 'text-[#00ff41]' : 'text-red-400'}>
                        {price > sma50 ? 'Y' : 'N'}
                      </span>
                    ) : '--'}/
                    {sma200 ? (
                      <span className={price > sma200 ? 'text-[#00ff41]' : 'text-red-400'}>
                        {price > sma200 ? 'Y' : 'N'}
                      </span>
                    ) : '--'}
                  </td>
                  {onRemove && (
                    <td className="p-2 text-right">
                      <button 
                        onClick={() => onRemove(symbol)}
                        className="text-[8px] border border-red-500/50 text-red-500 px-1 hover:bg-red-500 hover:text-black transition-colors"
                      >
                        REMOVE
                      </button>
                    </td>
                  )}
                </tr>
              )
            }) : (
              <tr><td colSpan={onRemove ? 8 : 7} className="p-8 text-center opacity-30 italic">NO_MATCHING_DATA_FOUND</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CryptoTable
