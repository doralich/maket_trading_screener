import React, { useState, useEffect, useRef } from 'react';

interface TickerResult {
  symbol: string;
  name: string;
  exchange: string;
  description: string;
}

interface UniversalSearchProps {
  onFavoriteAdded: () => void;
  favorites: string[];
}

const UniversalSearch: React.FC<UniversalSearchProps> = ({ onFavoriteAdded, favorites }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TickerResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTickers = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/api/v1/screener/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchTickers, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleFavorite = async (symbol: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await fetch(`http://localhost:8000/api/v1/favorites/${encodeURIComponent(symbol)}`, {
          method: 'DELETE',
        });
      } else {
        await fetch('http://localhost:8000/api/v1/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol }),
        });
      }
      onFavoriteAdded();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <span className="absolute left-2 top-1.5 opacity-50 text-[10px] tracking-widest pointer-events-none">SYNC_INDEX_&gt;</span>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="SEARCH ALL EXCHANGE TICKERS (BTC, ETH, etc)..." 
          className="bg-black border border-[#00ff41]/50 text-[#00ff41] pl-20 pr-2 py-1 text-xs w-full focus:outline-none focus:border-[#00ff41] placeholder:opacity-20"
        />
        {isLoading && <div className="absolute right-2 top-1.5 animate-spin">/</div>}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-[#1a1a1a] border border-[#00ff41] max-h-60 overflow-y-auto shadow-2xl">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-black sticky top-0 border-b border-[#00ff41]/30">
              <tr>
                <th className="p-2">SYMBOL</th>
                <th className="p-2">EXCHANGE</th>
                <th className="p-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00ff41]/10">
              {results.map((r) => {
                const isFavorite = favorites.includes(r.symbol);
                return (
                  <tr key={r.symbol} className="hover:bg-[#00ff41]/5">
                    <td className="p-2 font-bold">{r.symbol}</td>
                    <td className="p-2 opacity-60">{r.exchange}</td>
                    <td className="p-2 text-right">
                      <button 
                        onClick={() => toggleFavorite(r.symbol, isFavorite)}
                        className={`px-2 py-0.5 border ${isFavorite ? 'bg-[#00ff41] text-black border-[#00ff41]' : 'border-[#00ff41]/30 text-[#00ff41] hover:border-[#00ff41]'}`}
                      >
                        {isFavorite ? 'TRACKED' : 'TRACK'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UniversalSearch;
