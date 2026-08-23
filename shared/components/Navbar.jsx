import React from 'react';

function Navbar({ 
  activeApp = 'public', 
  activeView, 
  setActiveView, 
  systemStatus, 
  cartCount = 0, 
  onOpenCart 
}) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 border-bottom border-secondary border-opacity-25 shadow-sm">
      <div className="container-fluid px-4">
        
        {/* Unified Brand Logo */}
        <a className="navbar-brand fw-black tracking-wider d-flex align-items-center mb-0" href="#">
          <span className="text-warning me-2">⚡</span> LIVE MUSIC
          {activeApp === 'pos' && (
            <span className="text-white-50 fw-normal ms-2 fs-6">| Back-Office POS</span>
          )}
        </a>

        {/* Mobile Toggle Button */}
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-3 mt-3 mt-lg-0 font-monospace small">
            
            {activeApp === 'public' ? (
              /* Public Navigation Links */
              <div className="d-flex align-items-center gap-2">
                <a className="nav-link active text-warning px-3" href="#">Showroom</a>
                <a className="nav-link text-white-50 px-3" href="#">POS Backend</a>
                <button 
                  onClick={onOpenCart}
                  className="btn btn-warning text-dark font-monospace px-3 py-1.5 rounded-pill fw-bold shadow-sm border-0 ms-lg-2"
                >
                  🛒 Cart <span className="badge bg-dark text-warning ms-1.5 rounded-pill">{cartCount}</span>
                </button>
              </div>
            ) : (
              /* POS Navigation Buttons */
              <div className="d-flex align-items-center gap-2">
                <button 
                  onClick={() => setActiveView('inventory')} 
                  className={`nav-link bg-transparent px-3 border-0 ${
                    activeView === 'inventory' ? 'text-warning' : 'text-white-50'
                  }`}
                >
                  📦 Inventory & Intake
                </button>
                <button
                  onClick={() => setActiveView('sales')}
                  className={`nav-link bg-transparent px-3 border-0 ${
                    activeView === 'sales' ? 'text-warning' : 'text-white-50'
                  }`}
                >
                  📊 Sales History
                </button>
                
                {systemStatus && (
                  <span className="ms-lg-2">
                    {systemStatus === 'ONLINE' ? (
                      <span className="badge bg-success bg-opacity-25 text-success border border-success px-2.5 py-1.5" style={{ fontSize: '0.80rem' }}>
                        ● ONLINE
                      </span>
                    ) : (
                      <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.80rem' }}>
                        <span className="spinner-border spinner-border-sm" role="status" style={{ width: '0.65rem', height: '0.65rem' }}></span>
                        OFFLINE
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;