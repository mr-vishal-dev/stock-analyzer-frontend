import React, { useState, useEffect, useRef } from 'react';
import '../styles/SearchBar.css';

const SEARCH_API_HOST = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const API_BASE = SEARCH_API_HOST ? `${SEARCH_API_HOST}/yahoo` : '/yahoo';

export default function SearchBar({ onSelectStock }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const debounceTimerRef = useRef(null);

  const popularStocks = [
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
    { symbol: 'INFY.NS', name: 'Infosys Limited' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
    { symbol: 'HDFC.NS', name: 'HDFC Bank' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
    { symbol: 'ITC.NS', name: 'ITC Limited' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro' },
    { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
    { symbol: 'WIPRO.NS', name: 'Wipro Limited' },
  ];

  useEffect(() => {
    // Clear previous timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm.trim().length > 0) {
      // Debounce the search to avoid too many API calls
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions();
      }, 600);
    } else {
      setSuggestions([]);
      setFetchError('');
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setFetchError('');

    try {
      const url = `${API_BASE}/v1/finance/search?q=${encodeURIComponent(searchTerm)}`;
      console.log('Fetching from:', url);
      const response = await fetch(url);
      
      // Handle rate limiting gracefully
      if (response.status === 429) {
        console.warn('API rate limited, showing popular stocks');
        setSuggestions(popularStocks);
        setFetchError('');
        setShowSuggestions(true);
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.quotes && data.quotes.length > 0) {
        const results = data.quotes.slice(0, 10).map((quote) => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
        }));
        setSuggestions(results);
      } else {
        setSuggestions(popularStocks);
        setFetchError('No results found. Showing popular picks.');
      }
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Show popular stocks without error message for rate limiting
      if (error.message && error.message.includes('429')) {
        setFetchError('');
      } else {
        setFetchError('Could not load suggestions. Showing popular picks.');
      }
      setSuggestions(popularStocks);
      setShowSuggestions(true);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    let selected = { symbol: trimmed, name: trimmed };
    if (suggestions.length > 0) {
      const exactMatch = suggestions.find(
        (suggestion) =>
          suggestion.symbol?.toUpperCase() === trimmed.toUpperCase() ||
          suggestion.name?.toLowerCase() === trimmed.toLowerCase()
      );
      if (exactMatch) {
        selected = exactMatch;
      }
    }

    setSearchTerm(selected.symbol);
    setShowSuggestions(false);
    onSelectStock?.(selected.symbol, selected.name || selected.symbol);
  };

  const handleSuggestionClick = (symbol, name) => {
    setSearchTerm(symbol);
    setShowSuggestions(false);
    onSelectStock?.(symbol, name);
  };

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim().length > 0) {
      setShowSuggestions(true);
      return;
    }
    setSuggestions(popularStocks);
    setFetchError('');
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="search-bar-container">
      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search stocks, symbols, or companies..."
            value={searchTerm}
            onChange={handleChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="search-input"
          />
          {loading && <div className="search-loader"></div>}

          {showSuggestions && (
            <div className="suggestions-dropdown">
              {fetchError && <div className="suggestion-error">{fetchError}</div>}
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion.symbol, suggestion.name);
                  }}
                  onClick={() => handleSuggestionClick(suggestion.symbol, suggestion.name)}
                >
                  <span className="suggestion-symbol">{suggestion.symbol}</span>
                  <span className="suggestion-name">{suggestion.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="search-button">
          <span className="search-icon">🔍</span>
        </button>
      </form>
    </div>
  );
}

