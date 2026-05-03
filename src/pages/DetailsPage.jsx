import React, { useEffect, useState } from 'react';
import Chart from '../components/Chart';
import { getRecommendation } from '../api';
import '../styles/DetailsPage.css';

const YAHOO_API_HOST = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const YAHOO_API_BASE = YAHOO_API_HOST ? `${YAHOO_API_HOST}/yahoo` : '/yahoo';

// Request cache to prevent duplicate API calls
const requestCache = new Map();

export default function DetailsPage({ symbol, name, onBack, onSaveStock }) {
  const [stock, setStock] = useState(null);
  const [chartData, setChartData] = useState({ categories: [], values: [] });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
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
            // Load recommendation
            if (cachedData.stock.symbol) {
              loadRecommendation(cachedData.stock.symbol);
            }
          }
          return;
        }

        const searchUrl = `${YAHOO_API_BASE}/v1/finance/search?q=${encodeURIComponent(symbol)}`;
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
          dayHigh: quote.regularMarketDayHigh ?? null,
          dayLow: quote.regularMarketDayLow ?? null,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
          volume: quote.regularMarketVolume ?? null,
          averageVolume: quote.averageVolume ?? null,
        };

        if (isActive) {
          setStock(stockData);
        }

        // Add delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));

        const chartUrl = `${YAHOO_API_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
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
          
          // Load recommendation
          loadRecommendation(stockData.symbol);
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

    const loadRecommendation = async (currentSymbol) => {
      if (!currentSymbol) return;
      setLoadingRecommendation(true);
      try {
        console.log('Loading recommendation for:', currentSymbol);
        const rec = await getRecommendation(currentSymbol);
        console.log('Recommendation received:', rec);
        console.log('News sentiment value:', rec?.analysis?.news_sentiment);
        if (isActive) {
          setRecommendation(rec);
        }
      } catch (err) {
        console.error('Recommendation error:', err);
        if (isActive) {
          setError('Stock loaded but recommendation service unavailable');
        }
      } finally {
        if (isActive) {
          setLoadingRecommendation(false);
        }
      }
    };

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
          <span className="back-icon">←</span> Back
        </button>
        <div className="details-title-group">
          <div className="details-title">
            <span className="stock-symbol">{symbol}</span>
            <span className="stock-name">{name}</span>
          </div>
          <button className="save-button" onClick={handleSave}>
            <span className="save-icon">★</span> Save
          </button>
        </div>
      </div>

      {savedMessage && <div className="saved-message">✓ {savedMessage}</div>}

      {loading ? (
        <div className="details-loading">
          <div className="loading-spinner"></div>
          <p>Loading stock details...</p>
        </div>
      ) : error ? (
        <div className="details-error">
          <span className="error-icon">⚠</span> {error}
        </div>
      ) : (
        stock && (
          <div className="details-content">
            {/* Price Hero Section */}
            <div className="price-hero">
              <div className="price-main">
                <span className="price-label">Current Price</span>
                <div className="price-value">
                  {stock.price != null ? `$${stock.price.toFixed(2)}` : 'N/A'}
                </div>
                <div className={`price-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  <span className="change-icon">{stock.change >= 0 ? '▲' : '▼'}</span>
                  {stock.change != null ? `$${stock.change.toFixed(2)}` : '$0.00'} 
                  ({stock.changePercent != null ? `${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%` : '0.00%'})
                </div>
              </div>
              <div className="price-meta">
                <div className="meta-item">
                  <span className="meta-label">Currency</span>
                  <span className="meta-value">{stock.currency}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Exchange</span>
                  <span className="meta-value">{stock.exchange}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Type</span>
                  <span className="meta-value">{stock.quoteType}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-icon">📈</span>
                  Day Range
                </div>
                <div className="stat-values">
                  <span className="stat-low">L: {stock.dayLow != null ? `$${stock.dayLow.toFixed(2)}` : 'N/A'}</span>
                  <span className="stat-high">H: {stock.dayHigh != null ? `$${stock.dayHigh.toFixed(2)}` : 'N/A'}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-icon">📊</span>
                  52 Week Range
                </div>
                <div className="stat-values">
                  <span className="stat-low">L: {stock.fiftyTwoWeekLow != null ? `$${stock.fiftyTwoWeekLow.toFixed(2)}` : 'N/A'}</span>
                  <span className="stat-high">H: {stock.fiftyTwoWeekHigh != null ? `$${stock.fiftyTwoWeekHigh.toFixed(2)}` : 'N/A'}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-icon">📉</span>
                  Volume
                </div>
                <div className="stat-value-large">
                  {stock.volume != null ? stock.volume.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-icon">⚖</span>
                  Avg Volume
                </div>
                <div className="stat-value-large">
                  {stock.averageVolume != null ? stock.averageVolume.toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="chart-section">
              <div className="chart-header">
                <h3>📈 Price History - 1 Month</h3>
              </div>
              {chartData.categories.length > 0 ? (
                <Chart categories={chartData.categories} values={chartData.values} title={`${stock.symbol} - 1 Month`} />
              ) : (
                <div className="chart-empty">
                  <span className="empty-icon">📊</span>
                  <p>Chart data unavailable for this symbol.</p>
                </div>
              )}
            </div>

            {/* AI Recommendation Card */}
            <div className="recommendation-section">
              {recommendation && (
                <div className="recommendation-card">
                  <div className="recommendation-header">
                    <span className="rec-icon">🤖</span>
                    <span className="rec-title">AI Recommendation</span>
                  </div>
                  <div className="recommendation-body">
                    <div className={`rec-badge ${recommendation.recommendation.toLowerCase()}`}>
                      {recommendation.recommendation.toUpperCase()}
                      <span className="rec-confidence">{(recommendation.confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                    <div className="rec-reason">
                      {recommendation.reason}
                    </div>
                    <div className="analysis-grid">
                      <div className="analysis-item">
                        <span>Momentum</span>
                        <strong>{recommendation.analysis.momentum}</strong>
                      </div>
                      <div className="analysis-item">
                        <span>RSI</span>
                        <strong>{recommendation.analysis.rsi}</strong>
                      </div>
                      <div className="analysis-item">
                        <span>Sentiment</span>
                        <strong>{recommendation.analysis.news_sentiment}</strong>
                      </div>
                      <div className="analysis-item">
                        <span>Trend</span>
                        <strong>{recommendation.analysis.price_trend}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="recommendation-footer">
                    ⚠️ AI analysis based on technical indicators and news sentiment. Not financial advice.
                  </div>
                </div>
              )}

              {loadingRecommendation && (
                <div className="recommendation-loading">
                  <div className="loading-spinner"></div>
                  <p>Analyzing market data and news sentiment...</p>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

