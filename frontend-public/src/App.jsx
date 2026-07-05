import React, { useState, useEffect } from 'react';
import ProductCard from './components/ProductCard';

// Import your local asset safely via Vite
import heroBgImage from './assets/katarina-bubenikova-nUd7uq3i0qs-unsplash.jpg';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Create a state to store the network error message/status
  const [errorStatus, setErrorStatus] = useState("Connecting...");

  useEffect(() => {
    let isMounted = true;

    // Recursive fetching function that handles failures elegantly
    const connectToBackend = () => {
      fetch('http://localhost:5000/api/products')
        .then(res => {
          if (!res.ok) throw new Error("Server responded with an error status: ${res.status}");
          return res.json();
        })
        .then(data => {
          if (isMounted) {
            setProducts(data);
            setLoading(false); // Connection successful, turn off loader!
            setErrorStatus(null);
          }
        })
        .catch(err => {
          console.warn("Backend server not found yet. Retrying in 3 seconds...");
          if (isMounted) {
            setErrorStatus(err.message === "Failed to fetch" 
              ? "ERR_CONNECTION_REFUSED (Backend server is offline)" 
              : err.message
            );
            // Wait 3 seconds, then try to connect again
            setTimeout(connectToBackend, 3000);
          }
        });
    };

    connectToBackend();

    // Clean up to prevent memory leaks if component unmounts mid-handshake
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-vh-100 bg-dark d-flex flex-column justify-content-center align-items-center text-light">
        <div className="spinner-border text-warning mb-4" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <h5 className="font-monospace text-warning tracking-wider">TUNING THE INSTRUMENTS...</h5>
        <p className="text-white-50 small font-monospace mt-1">Waiting for server synchronization</p>

        <div className="text-center p-4 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 shadow-lg" style={{ maxWidth: '440px' }}>
          <span className="badge bg-danger bg-opacity-25 text-danger font-monospace border border-danger border-opacity-25 px-3 py-2 rounded-pill mb-3 small">
            {errorStatus.includes("CONNECTION_REFUSED") ? "OFFLINE" : "SERVER_ERR"}
          </span>

          <p className="text-white small font-monospace mb-0 lh-base">
            {errorStatus.includes("CONNECTION_REFUSED") 
              ? "The backend storage system isn't responding right now. Make sure your server is running."
              : errorStatus}
          </p>

          <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
            <span className="text-white-50 small font-monospace d-flex align-items-center justify-content-center gap-2" style={{ fontSize: '0.8rem' }}>
              <span className="spinner-grow spinner-grow-sm text-warning" role="status"></span>
              Retrying connection automatically every 3s...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Define the layered gradient over the background image
  const heroStyle = {
    backgroundImage: `linear-gradient(135deg, rgba(30, 34, 41, 0.95) 40%, rgba(255, 193, 7, 0.4) 100%), url(${heroBgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative'
  };

  return (
    <div className="min-vh-100 w-100 pb-5" style={{ backgroundColor: '#faf6ee' }}>
      {/* Premium Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 border-bottom border-secondary border-opacity-25 shadow-sm">
        <div className="container-fluid px-4">
          <a className="navbar-brand fw-black tracking-wider d-flex align-items-center" href="#">
            <span className="text-warning me-2">⚡</span> LIVE MUSIC
          </a>
          <div className="navbar-nav ms-auto font-monospace small">
            <a className="nav-link active px-3 text-warning" href="#">Showroom</a>
            <a className="nav-link px-3" href="#">POS Backend</a>
          </div>
        </div>
      </nav>

      {/* Hero Section Banner with Brand Gradient Overlay */}
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

      {/* Main Catalog Grid */}
      <main className="container">
        <div className="row justify-content-center">
          {products.length > 0 ? (
            products.map(item => (
              <ProductCard key={item.id} product={item} />
            ))
          ) : (
            <div className="text-center py-5">
              <h4 className="text-muted">The showroom floor is empty.</h4>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;