import React from 'react';

export default function SavedStocks({ savedStocks = [], onSelectStock }) {
  const list = Array.isArray(savedStocks) ? savedStocks : [];

  return (
    <section className="dashboard-section">
      <div className="section-head">
        <h2>Saved Stocks</h2>
        <p>Only your saved stocks are shown here.</p>
      </div>
      {list.length > 0 ? (
        <div className="saved-grid saved-grid-full">
          {list.map((stock, index) => (
            <div
              key={stock?.symbol ?? stock?.id ?? index}
              className="saved-card saved-card-large"
              onClick={() => onSelectStock(stock?.symbol ?? '', stock?.name ?? '')}
              style={{ cursor: 'pointer' }}
            >
              <strong>{stock?.symbol || 'Unknown'}</strong>
              <span>{stock?.name || 'No name'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="saved-empty">
          <p>No saved stocks yet.</p>
          <span>Search and save a company from the details page.</span>
        </div>
      )}
    </section>
  );
}
