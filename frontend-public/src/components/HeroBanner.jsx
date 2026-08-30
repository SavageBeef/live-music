import React from 'react';
import heroBgImage from '../assets/katarina-bubenikova-nUd7uq3i0qs-unsplash.jpg';

function HeroBanner() {
  const heroStyle = {
    backgroundImage: `linear-gradient(135deg, rgba(30, 34, 41, 0.95) 40%, rgba(255, 193, 7, 0.4) 100%), url(${heroBgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative'
  };

  return (
    <header className="text-light py-5 mb-5 shadow" style={heroStyle}>
      <div className="container text-md-start text-center py-5 position-relative z-1">
        <div className="row py-3">
          <div className="col-lg-7">
            <span className="badge bg-warning text-dark font-monospace px-3 py-2 mb-3 text-uppercase tracking-wider fw-bold shadow-sm">
              Summer Collection 2026
            </span>
            <h1 className="display-2 fw-black tracking-tight mb-3">FIND YOUR SOUND</h1>
            <p className="lead text-white-50 mb-4 fs-4">
              Browse our hand-curated selection of premium instruments, historic guitars, and studio accessories.
            </p>
            <div className="d-flex flex-wrap gap-3 justify-content-md-start justify-content-center">
              <a href="#showroom" className="btn btn-warning text-dark fw-bold px-4 py-2 rounded-pill shadow">
                Explore Catalog
              </a>
              <a href="#" className="btn btn-outline-light fw-bold px-4 py-2 rounded-pill">
                View Specs
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeroBanner;