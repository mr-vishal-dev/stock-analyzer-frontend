import React from 'react';
import '../styles/ProfilePage.css';

export default function ProfilePage({ savedCount, theme, onThemeToggle, user, onLogout }) {
  return (
    <section className="dashboard-section profile-section">
      <div className="section-head">
        <h2>Profile</h2>
        <p>Manage your TAURUS profile and theme preferences.</p>
      </div>

      <div className="profile-grid">
        <div className="profile-avatar-card">
          <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase() || 'T'}</div>
          <div>
            <strong>{user?.name || 'TAURUS Investor'}</strong>
            <span>{user?.email || 'hello@taurus.io'}</span>
          </div>
        </div>

        <div className="profile-details-card">
          <div className="profile-item">
            <span>Name</span>
            <strong>{user?.name || 'TAURUS Investor'}</strong>
          </div>
          <div className="profile-item">
            <span>Email</span>
            <strong>{user?.email || 'hello@taurus.io'}</strong>
          </div>
          <div className="profile-item">
            <span>Date of birth</span>
            <strong>{user?.date_of_birth || 'Not set'}</strong>
          </div>
          <div className="profile-item">
            <span>Saved stocks</span>
            <strong>{savedCount}</strong>
          </div>
        </div>

        <div className="profile-theme-card">
          <div className="theme-header">
            <strong>Theme</strong>
            <span>Change the dashboard appearance.</span>
          </div>
          <button className="theme-button" onClick={onThemeToggle}>
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </section>
  );
}
