import React, { useEffect, useState } from 'react';
import Chart from '../components/Chart';
import '../styles/DetailsPage.css';

// Request cache to prevent duplicate API calls
const requestCache = new Map();

export default function DetailsPage({ symbol, name, onBack, onSaveStock }) {
  const [stock, setStock] = useState(null);
  const [chartData, setChartData] = useState({ categories: [], values: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    if (!symbol) {
      setLoading(false);
      setError('No stock symbol provided.');
      return () => {
        controller.abort();
        isActive = false;
      };
    }

    setSavedMessage('');

    const fetchWithRetry = async (url, retries = 2, delay = 1000) => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (response.status === 429) {
          // Too many requests - wait and retry
          if (retries > 0) {
            console.warn(`Rate limited. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRetry(url, retries - 1, delay * 2);
          }
          throw new Error('HTTP 429: Rate limited. Please try again in a moment.');
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        if (retries > 0 && err.message.includes('429')) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, retries - 1, delay * 2);
        }
        throw err;
      }
    };

    async function loadStock() {
      setLoading(true);
      setError('');
      try {
        // Check cache first
        const cacheKey = `stock_${symbol}`;
        if (requestCache.has(cacheKey)) {
          const cachedData = requestCache.get(cacheKey);
          if (isActive) {
            setStock(cachedData.stock);
            setChartData(cachedData.chartData);
            setLoading(false);
          }
          return;
        }

        const searchUrl = `/yahoo/v1/finance/search?q=${encodeURIComponent(symbol)}`;
        console.log('Fetching stock data from:', searchUrl);
        const searchJson = await fetchWithRetry(searchUrl);
        if (!searchJson) return;

        const quote =
          searchJson.quotes?.find((q) => q.symbol?.toUpperCase() === symbol.toUpperCase()) ||
          searchJson.quotes?.[0];

        if (!quote) {
          throw new Error('No matching stock found. Please try a different symbol or select from the suggestions.');
        }

        const stockData = {
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || name || quote.symbol,
          exchange: quote.exchange || quote.exchangeDisplayName || 'N/A',
          currency: quote.currency || 'USD',
          price:
            quote.regularMarketPrice ??
            quote.regularMarketPreviousClose ??
            quote.regularMarketOpen ??
            quote.bid ??
            quote.ask ??
            null,
          change:
            quote.regularMarketChange ??
            quote.regularMarketChangePercent != null
              ? quote.regularMarketChangePercent * (quote.regularMarketPrice ?? quote.regularMarketPreviousClose ?? 0) / 100
              : null,
          changePercent:
            quote.regularMarketChangePercent ??
            (quote.regularMarketChange != null && quote.regularMarketPrice != null
              ? (quote.regularMarketChange / quote.regularMarketPrice) * 100
              : null),
          quoteType: quote.quoteType || 'Equity',
        };

        if (isActive) {
          setStock(stockData);
        }

        // Add delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));

        const chartUrl = `/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
        console.log('Fetching chart data from:', chartUrl);
        const chartJson = await fetchWithRetry(chartUrl);
        if (!chartJson) return;

        const result = chartJson.chart?.result?.[0];

        if (result && stockData.price == null && result.meta?.regularMarketPrice != null) {
          stockData.price = result.meta.regularMarketPrice;
        }

        let chartDataResult = { categories: [], values: [] };
        if (result) {
          const timestamps = result.timestamp || [];
          const closeValues = result.indicators?.quote?.[0]?.close || [];
          const categories = timestamps.map((timestamp) =>
            new Date(timestamp * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          );
          const values = closeValues.map((value) => (value != null ? Number(value.toFixed(2)) : null));
          chartDataResult = { categories, values };
        }

        if (isActive) {
          setChartData(chartDataResult);
          // Cache the data
          requestCache.set(cacheKey, { stock: stockData, chartData: chartDataResult });
        }
      } catch (fetchError) {
        if (fetchError?.name === 'AbortError') {
          return;
        }
        console.error('Stock data error:', fetchError);
        if (isActive) {
          setError(fetchError?.message || 'Unable to load stock data. Please try again.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadStock();

    return () => {
      controller.abort();
      isActive = false;
    };
  }, [symbol, name]);

  const handleSave = () => {
    if (stock) {
      onSaveStock?.(stock);
      setSavedMessage('Saved to watchlist');
      setTimeout(() => setSavedMessage(''), 2000);
    }
  };

  return (
    <div className="details-page">
      <div className="details-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="details-title-group">
          <div className="details-title">{name || symbol}</div>
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>

      {savedMessage && <div className="saved-message">{savedMessage}</div>}

      {loading ? (
        <div className="details-loading">Loading stock details...</div>
      ) : error ? (
        <div className="details-error">{error}</div>
      ) : (
        stock && (
          <div className="details-grid">
            <div className="details-card">
              <div className="stock-card-header">Stock Overview</div>
              <div className="stock-item">
                <span>Symbol</span>
                <strong>{stock.symbol}</strong>
              </div>
              <div className="stock-item">
                <span>Name</span>
                <strong>{stock.name}</strong>
              </div>
              <div className="stock-item">
                <span>Exchange</span>
                <strong>{stock.exchange}</strong>
              </div>
              <div className="stock-item">
                <span>Quote type</span>
                <strong>{stock.quoteType}</strong>
              </div>
              <div className="stock-item">
                <span>Currency</span>
                <strong>{stock.currency}</strong>
              </div>
            </div>

            <div className="details-card price-card">
              <div className="stock-card-header">Market Price</div>
              <div className="price-value">
                {stock.price != null ? `${stock.price} ${stock.currency}` : 'N/A'}
              </div>
              <div className={`price-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                {stock.change != null ? stock.change.toFixed(2) : '0.00'} ({stock.changePercent != null ? stock.changePercent.toFixed(2) : '0.00'}%)
              </div>
            </div>

            <div className="chart-section">
              {chartData.categories.length > 0 ? (
                <Chart categories={chartData.categories} values={chartData.values} title={`${stock.symbol} - 1 Month`} />
              ) : (
                <div className="chart-empty">Chart data unavailable for this symbol.</div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
