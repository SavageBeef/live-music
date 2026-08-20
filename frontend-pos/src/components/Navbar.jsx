import React from 'react';

function Navbar({ activeView, setActiveView, systemStatus }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 mb-4 shadow-sm">
      <div className="container-fluid px-4">
        <span className="navbar-brand fw-black tracking-wider">
          <span className="text-warning me-2">⚡</span> LIVE MUSIC <span className="text-white-50 fw-normal ms-2 fs-4">| Back-Office POS</span>
        </span>
        <div className="navbar-nav ms-auto font-monospace">
          <button 
            onClick={() => setActiveView('inventory')} 
            className={`nav-link btn btn-link text-decoration-none px-3 mb-0 border-0 ${activeView === 'inventory' ? 'text-warning fw-bold' : 'text-white-50'}`}
          >
            📦 Inventory & Intake
          </button>
          <button
            onClick={() => setActiveView('sales')}
            className={`nav-link btn btn-link text-decoration-none px-3 mb-0 border-0 ${activeView === 'sales' ? 'text-warning fw-bold' : 'text-white-50'}`}
          >
            📊 Sales History
          </button>
          <span className="d-flex align-items-center gap-2">
            <span className="text-white-50 small">| System Status:</span>
            {systemStatus === 'ONLINE' && (
              <span className="badge bg-success bg-opacity-25 text-success border border-success px-2.5 py-1.5" style={{ fontSize: '0.80rem' }}>
                ● ONLINE
              </span>
            )}
            {systemStatus === 'OFFLINE' && (
              <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-2.5 py-1.5 d-inline-flex align-items-center gap-2" style={{ fontSize: '0.80rem' }}>
                <span className="spinner-border spinner-border-sm" role="status" style={{ width: '0.65rem', height: '0.65rem' }}></span>
                OFFLINE
              </span>
            )}
          </span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;