import React, { useState, useMemo } from 'react'

export type MarketUpdate = {
  Symbol: string;
  Price?: number;
  'Change %'?: number;
  Volume?: number | string;
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
  const [filter, setFilter] = useState('');

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const sortedData = useMemo(() => {
    let items = [...data];
    
    // Filter by Symbol
    if (filter) {
      items = items.filter(item => 
        item.Symbol?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Sort
    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

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

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <span className="opacity-20">↕</span>;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4 flex space-x-2 shrink-0">
        <div className="flex-grow relative">
          <span className="absolute left-2 top-1.5 opacity-50 text-[10px] tracking-widest pointer-events-none">FILTER_&gt;</span>
          <input 
            type="text" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="TYPE_TICKER..." 
            className="bg-black border border-[#00ff41] text-[#00ff41] pl-16 pr-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#00ff41] placeholder:opacity-20"
          />
        </div>
      </div>

      <div className="flex-grow overflow-auto border border-[#00ff41] bg-black min-h-0">
        <table className="w-full text-left text-[11px] border-collapse relative">
          <thead className="sticky top-0 bg-[#1a1a1a] z-10 shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
            <tr className="border-b border-[#00ff41]">
              <th className="p-2 cursor-pointer hover:bg-[#00ff41] hover:text-black transition-colors" onClick={() => handleSort('Symbol')}>
                TICKER {renderSortIcon('Symbol')}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black transition-colors" onClick={() => handleSort('Price')}>
                PRICE {renderSortIcon('Price')}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black transition-colors" onClick={() => handleSort('Change %')}>
                CHANGE_24H {renderSortIcon('Change %')}
              </th>
              <th className="p-2 text-right cursor-pointer hover:bg-[#00ff41] hover:text-black transition-colors" onClick={() => handleSort('Volume')}>
                VOLUME {renderSortIcon('Volume')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00ff41]/20">
            {sortedData.length > 0 ? sortedData.map((asset, i) => {
              const changeValue = asset['Change %'] ?? 0;
              const isPositive = changeValue >= 0;
              const price = asset.Price ?? asset.last ?? 0;
              const volume = asset.Volume ?? '--';
              
              return (
                <tr key={asset.Symbol || i} className="hover:bg-[#00ff41]/10 transition-colors group">
                  <td className="p-2 font-bold group-hover:text-white">{asset.Symbol}</td>
                  <td className="p-2 text-right font-mono">
                    {typeof price === 'number' ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : price}
                  </td>
                  <td className={`p-2 text-right font-bold ${isPositive ? 'text-terminal-green' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{typeof changeValue === 'number' ? changeValue.toFixed(2) : changeValue}%
                  </td>
                  <td className="p-2 text-right opacity-70">
                    {typeof volume === 'number' ? volume.toLocaleString(undefined, { maximumFractionDigits: 0 }) : volume}
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
