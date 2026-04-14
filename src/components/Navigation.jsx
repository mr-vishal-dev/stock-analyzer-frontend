import React from 'react';
import '../styles/Navigation.css';
import logo from "../assets/tauruslogo.png";

export default function Navigation({ onNavigateSearch, onNavigateSaved, onNavigateProfile }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={logo} alt="TAURUS" className="navbar-logo-img" />
          <div className="navbar-text">
            <span className="logo-text">TAURUS</span>
            <span className="navbar-tagline">Stock Analyzer</span>
          </div>
        </div>

        <button className="navbar-search-btn" onClick={onNavigateSearch} title="Search Stocks">
          <span className="navbar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
        </button>

        <div className="navbar-actions">
          <button className="navbar-icon-btn" onClick={onNavigateSaved} title="Saved Stocks">
            <span className="navbar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-5-8 5V5a2 2 0 0 1 2-2z" />
              </svg>
            </span>
          </button>
          <button className="navbar-icon-btn" onClick={onNavigateProfile} title="Profile">
            <span className="navbar-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
