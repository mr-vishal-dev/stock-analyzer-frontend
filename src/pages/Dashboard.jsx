import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import SearchBar from '../components/SearchBar';
import SavedStocks from './SavedStocks';
import ProfilePage from './ProfilePage';
import '../styles/Dashboard.css';

export default function Dashboard({ onSelectStock, savedStocks = [], theme, onThemeToggle, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const savedList = Array.isArray(savedStocks) ? savedStocks.slice(0, 10) : [];

  const handleNavigateSearch = () => setActiveTab('search');
  const handleNavigateSaved = () => setActiveTab('saved');
  const handleNavigateProfile = () => setActiveTab('profile');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <Navigation
          onNavigateSearch={handleNavigateSearch}
          onNavigateSaved={handleNavigateSaved}
          onNavigateProfile={handleNavigateProfile}
        />
      </div>

      <div className="dashboard-content">
        {activeTab === 'search' && (
          <section className="dashboard-section search-page">
            <div className="search-page-header">
              <button className="search-back-button" onClick={() => setActiveTab('home')}>
                ← Back
              </button>
              <div>
                <h2>Search Stocks</h2>
                <p>Type a symbol or company name to find real-time stock details.</p>
              </div>
            </div>
            <SearchBar onSelectStock={onSelectStock} />
          </section>
        )}

        {activeTab === 'home' && (
          <>
            <div className="dashboard-hero">
              <div>
                <h1>Welcome to TAURUS</h1>
                <p>Your premium stock analysis tool</p>
              </div>
              <div className="dashboard-hero-chip">Top saved stocks: {savedList.length}</div>
            </div>
            <section className="dashboard-section">
              <div className="section-head">
                <h2>Saved Watchlist</h2>
                <p>Your top 10 saved stocks appear here for quick access.</p>
              </div>
              {savedList.length > 0 ? (
                <div className="saved-grid">
                  {savedList.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="saved-card"
                      onClick={() => onSelectStock(stock.symbol, stock.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <strong>{stock.symbol}</strong>
                      <span>{stock.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="saved-empty">
                  <p>No saved stocks yet.</p>
                  <span>Search for a stock and save it from the details page.</span>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'saved' && <SavedStocks savedStocks={savedList} onSelectStock={onSelectStock} />}
        {activeTab === 'profile' && (
          <ProfilePage
            savedCount={savedList.length}
            theme={theme}
            onThemeToggle={onThemeToggle}
            user={user}
            onLogout={onLogout}
          />
        )}
      </div>

      <div className="mobile-bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5L12 4l9 6.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-5H8.5v5H3.5A1.5 1.5 0 0 1 2 19.5v-9z" />
            </svg>
          </span>
          <small>Home</small>
        </button>
        <button
          className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-5-8 5V5a2 2 0 0 1 2-2z" />
            </svg>
          </span>
          <small>Saved</small>
        </button>
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <small>Profile</small>
        </button>
      </div>
    </div>
  );
}
