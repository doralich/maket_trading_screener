import React, { useState, useMemo } from 'react'

export interface MarketUpdate {
  ticker: string;
  price?: number;
  last?: number;
  change?: number;
  volume?: number | string;
  [key: string]: any;
}

interface CryptoTableProps {
  data: MarketUpdate[];
}

type SortConfig = {
  key: keyof MarketUpdate | null;
  direction: 'asc' | 'desc';
}

const CryptoTable: React.FC<CryptoTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'change', direction: 'desc' });
  const [filter, setFilter] = useState('');

  const handleSort = (key: keyof MarketUpdate) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const sortedData = useMemo(() => {
    let items = [...data];
    
    // Filter
    if (filter) {
      items = items.filter(item => 
        item.ticker?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Sort
    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [data, sortConfig, filter]);

  const renderSortIcon = (key: keyof MarketUpdate) => {
    if (sortConfig.key !== key) return <span className="opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex space-x-2">
        <div className="flex-grow relative">
          <span className="absolute left-2 top-1.5 opacity-50 text-[10px] tracking-widest pointer-events-none">FILTER_&gt;</span>
          <input 
            type="text" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="TYPE_TICKER..." 
            className="bg-black border border-terminal-green text-terminal-green pl-16 pr-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-terminal-green placeholder:opacity-20"
          />
        </div>
      </div>

      <div className="flex-grow overflow-auto border border-terminal-green bg-black">
        <table className="w-full text-left text-[11px] border-collapse relative">
          <thead className="sticky top-0 bg-terminal-header z-10 shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
            <tr className="border-b border-terminal-green">
              <th className="p-2 cursor-pointer hover:bg-terminal-green hover:text-black transition-colors" onClick={() => handleSort('ticker')}>
                TICKER {renderSortIcon('ticker')}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-terminal-green hover:text-black transition-colors" onClick={() => handleSort('last')}>
                PRICE {renderSortIcon('last')}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-terminal-green hover:text-black transition-colors" onClick={() => handleSort('change')}>
                CHANGE_24H {renderSortIcon('change')}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-terminal-green hover:text-black transition-colors" onClick={() => handleSort('volume')}>
                VOLUME {renderSortIcon('volume')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-green/20">
            {sortedData.length > 0 ? sortedData.map((asset, i) => {
              const changeValue = asset.change || 0;
              const isPositive = changeValue >= 0;
              const price = asset.last || asset.price || 0;
              
              return (
                <tr key={asset.ticker || i} className="hover:bg-terminal-green/10 transition-colors group">
                  <td className="p-2 font-bold group-hover:text-white">{asset.ticker}</td>
                  <td className="p-2 text-right font-mono">
                    {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </td>
                  <td className={`p-2 text-right font-bold ${isPositive ? 'text-terminal-green' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{changeValue.toFixed(2)}%
                  </td>
                  <td className="p-2 text-right opacity-70">
                    {asset.volume || asset['volume (24h)'] || '--'}
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={4} className="p-8 text-center opacity-30 italic">
                  NO_MATCHING_DATA_FOUND
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CryptoTable
