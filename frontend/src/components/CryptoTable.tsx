import React, { useState, useMemo } from 'react'

export type MarketUpdate = {
  Symbol: string;
  Price?: number;
  'Change %'?: number;
  Volume?: number | string;
  Exchange?: string;
  Description?: string;
  // Technical Indicators
  'Relative Strength Index (14)'?: number;
  'MACD Level (12, 26)'?: number;
  'MACD Signal (12, 26)'?: number;
  'Simple Moving Average (50)'?: number;
  'Simple Moving Average (200)'?: number;
  [key: string]: any;
}

interface CryptoTableProps {
  data: MarketUpdate[];
}

type SortConfig = {
  key: string | null;
  direction: 'asc' | 'desc';
}

const CryptoTable: React.FC<CryptoTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'Change %', direction: 'desc' });
  const [textFilter, setTextFilter] = useState('');
  const [activeExchange, setActiveExchange] = useState<string | null>(null);
  
  // Technical Filters State
  const [rsiFilter, setRsiFilter] = useState<'all' | 'overbought' | 'oversold'>('all');
  const [smaFilter, setSmaFilter] = useState<'all' | 'aboveSMA50' | 'aboveSMA200'>('all');
  const [macdFilter, setMacdFilter] = useState<'all' | 'bullish' | 'bearish'>('all');

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const exchanges = useMemo(() => {
    const set = new Set<string>();
    data.forEach(item => {
      if (item.Exchange) set.add(item.Exchange);
    });
    return Array.from(set).sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let items = [...data];
    
    // 1. Text Filter
    if (textFilter) {
      const searchLower = textFilter.toLowerCase();
      items = items.filter(item => 
        item.Symbol?.toLowerCase().includes(searchLower) ||
        item.Exchange?.toLowerCase().includes(searchLower) ||
        item.Description?.toLowerCase().includes(searchLower)
      );
    }

    // 2. Exchange Filter
    if (activeExchange) {
      items = items.filter(item => item.Exchange === activeExchange);
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

  const resetFilters = () => {
    setTextFilter('');
    setActiveExchange(null);
    setRsiFilter('all');
    setSmaFilter('all');
    setMacdFilter('all');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 space-y-3 shrink-0 bg-[#1a1a1a] p-2 border border-[#00ff41]/30">
        <div className="flex space-x-2">
          <div className="flex-grow relative">
            <span className="absolute left-2 top-1.5 opacity-50 text-[10px] tracking-widest pointer-events-none">SEARCH_&gt;</span>
            <input 
              type="text" 
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="TICKER, EXCHANGE, OR DESCRIPTION..." 
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

        <div className="flex flex-wrap gap-4 items-center text-[10px]">
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

          <div className="flex items-center space-x-2">
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
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black" onClick={() => handleSort('Change %')}>CHG% {renderSortIcon('Change %')}</th>
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black" onClick={() => handleSort('Relative Strength Index (14)')}>RSI {renderSortIcon('Relative Strength Index (14)')}</th>
              <th className="p-2 text-right">MACD (L/S)</th>
              <th className="p-2 text-right">SMA 50/200</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00ff41]/10">
            {filteredAndSortedData.length > 0 ? filteredAndSortedData.map((asset, i) => {
              const chg = asset['Change %'] ?? 0;
              const rsi = asset['Relative Strength Index (14)'];
              const macdL = asset['MACD Level (12, 26)'];
              const macdS = asset['MACD Signal (12, 26)'];
              const sma50 = asset['Simple Moving Average (50)'];
              const sma200 = asset['Simple Moving Average (200)'];
              const price = asset.Price ?? 0;
              
              return (
                <tr key={asset.Symbol || i} className="hover:bg-[#00ff41]/5 transition-colors">
                  <td className="p-2 font-bold">{asset.Symbol}</td>
                  <td className="p-2 opacity-60 uppercase">{asset.Exchange?.split(':')[0]}</td>
                  <td className="p-2 text-right font-mono">{(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                  <td className={`p-2 text-right font-bold ${chg >= 0 ? 'text-terminal-green' : 'text-red-500'}`}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </td>
                  <td className={`p-2 text-right ${rsi && rsi >= 70 ? 'text-red-500 font-bold' : rsi && rsi <= 30 ? 'text-terminal-green font-bold' : ''}`}>
                    {rsi?.toFixed(1) ?? '--'}
                  </td>
                  <td className="p-2 text-right text-[9px] opacity-70">
                    <span className={macdL && macdS && macdL > macdS ? 'text-terminal-green' : 'text-red-400'}>
                      {macdL?.toFixed(2) ?? '--'}
                    </span>
                    /
                    {macdS?.toFixed(2) ?? '--'}
                  </td>
                  <td className="p-2 text-right text-[9px] opacity-70">
                    <span className={price > (sma50 ?? 0) ? 'text-terminal-green' : 'text-red-400'}>
                      {sma50 ? 'Y' : 'N'}
                    </span>
                    /
                    <span className={price > (sma200 ?? 0) ? 'text-terminal-green' : 'text-red-400'}>
                      {sma200 ? 'Y' : 'N'}
                    </span>
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={7} className="p-8 text-center opacity-30 italic">NO_MATCHING_DATA_FOUND</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CryptoTable
