import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './components/ProductCard';
import heroBgImage from './assets/katarina-bubenikova-nUd7uq3i0qs-unsplash.jpg'; // Import your local asset safely via Vite

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // Client-side shopping basket
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState("Connecting..."); // Create a state to store the network error message/status
  const [isOffline, setIsOffline] = useState(false); // Track if the backend is offline

  const isMounted = useRef(true); // Tracks the component lifespan across re-renders to prevent background thread state memory leaks

  // Recursive fetching function that handles failures elegantly
  const fetchProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => {
        if (!res.ok) throw new Error("Server responded with an error status: ${res.status}");
        return res.json();
      })
      .then(data => {
        if (isMounted.current) {
          setProducts(data);
          setLoading(false);    // Turn off initial screen loader
          setIsOffline(false); // Connection is active!
          setErrorStatus(null);
        }
      })
      .catch(err => {
        console.warn("Backend server not found yet. Retrying...");
        if (isMounted.current) {
          setErrorStatus(err.message === "Failed to fetch" 
            ? "ERR_CONNECTION_REFUSED (Backend server is offline)" 
            : err.message
          );
          setIsOffline(true); // Mark the backend as offline
        }
      });
  };

  // Initial mount listener fires the connection once and establishes an auto-sync heartbeat
  useEffect(() => {
    isMounted.current = true;
    fetchProducts();
    
    // HEARTBEAT SYNC: Re-query database every 10 seconds
    const heartbeat = setInterval(() => {
      if (isMounted.current) {
        console.log("🔄 Background Sync: Refreshing showroom inventory tables...");
        fetchProducts();
      }
    }, 10000); // 10,000 milliseconds = 10 seconds

    // Clean up hook flags and intervals when client disconnects to prevent background processing memory leaks
    return () => {
      isMounted.current = false;
      clearInterval(heartbeat); // Safely clear the timer loop!
    };
  }, []);

  // Simulates adding items to a local checkout batch session
  const handleAddToCart = (selectedProduct) => {
    // 1. Prevent adding if frontend reflects no temporary stock remaining
    if (selectedProduct.stock <= 0) return;

    // 2. Append item or update count in local state
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === selectedProduct.id);
      if (existing) {
        return prevCart.map(item => item.id === selectedProduct.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { ...selectedProduct, quantity: 1 }];
    });

    // 3. Subtract 1 item from display stock placeholder locally
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === selectedProduct.id ? { ...p, stock: p.stock - 1 } : p)
    );
  };

  // Removes/decrements an item from cart and returns stock back to the display grid
  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === productId);
      if (!existing) return prevCart;

      if (existing.quantity > 1) {
        return prevCart.map(item => 
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prevCart.filter(item => item.id !== productId);
    });

    // Return 1 unit back to the display stock
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === productId ? { ...p, stock: p.stock + 1 } : p)
    );
  };

  // Finalizes transaction with the backend server database
  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Send transaction processing payloads sequentially or batched
    const promises = cart.map(item => 
      fetch('http://localhost:5000/api/pos/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, quantity: item.quantity })
      }).then(res => {
        if (!res.ok) throw new Error(`Failed checkout for item: ${item.name}`);
        return res.json();
      })
    );

    Promise.all(promises)
      .then(() => {
        alert("🎉 Order processed successfully! Backend database inventory decremented.");
        setCart([]); // Clear cart basket
        fetchProducts(); // Force refresh ground truth stock metrics from DB
      })
      .catch(err => {
        alert(err.message);
        fetchProducts(); // Reset system values safely
      });
  };

  if (loading && isOffline) {
    return (
      <div className="min-vh-100 bg-dark d-flex flex-column justify-content-center align-items-center text-light">
        <div className="spinner-border text-warning mb-4" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <h5 className="font-monospace text-warning tracking-wider">TUNING THE INSTRUMENTS...</h5>
        <p className="text-white-50 small font-monospace mt-1">Waiting for initial backend synchronization</p>

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
              Retrying connection automatically...
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
      {/* Top Banner for Mid-Session Connection Loss */}
      {isOffline && (
        <div className="bg-danger text-white py-2 px-4 text-center font-monospace small fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
          <span className="spinner-border spinner-border-sm" role="status"></span>
          ⚠️ Connection Lost: Showroom is currently in offline mode. Reconnecting to Database...
        </div>
      )}
      {/* Premium Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 border-bottom border-secondary border-opacity-25 shadow-sm">
        <div className="container-fluid px-4">

          <a className="navbar-brand fw-black tracking-wider d-flex align-items-center mb-0" href="#">
            <span className="text-warning me-2">⚡</span> LIVE MUSIC
          </a>
          {/* Mobile Toggle Button */}
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            {/* Flex container grouping text links and badge together with spacing handles */}
            <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-3 mt-3 mt-lg-0">
              {/* Monospaced Navigation Links */}
              <div className="navbar-nav flex-row font-monospace small me-lg-2">
                <a className="nav-link active px-3 text-warning mb-0" href="#">Showroom</a>
                <a className="nav-link px-3 mb-0 text-white-50" href="#">POS Backend</a>
              </div>
              {/* Shopping Session Tracker Badge */}
              <span className={`badge font-monospace px-3 py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center fw-bold ${
                isOffline ? 'bg-secondary text-white' : 'bg-warning text-dark'
              }`}>
                🛒 Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </span> 
            </div>
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

      {/* Main Product Grid */}
      <main className="container">
        <div className="row justify-content-start">
          {products.length > 0 ? (
            products.map(item => (
              <ProductCard key={item.id} product={item} onAddToCart={handleAddToCart}/>
            ))
          ) : (
            <div className="text-center py-5">
              <h4 className="text-muted">The showroom floor is empty.</h4>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Shopping Cart Summary Bar */}
      {cart.length > 0 && (
        <div className="fixed-bottom bg-dark text-white p-4 shadow-lg border-top border-secondary border-opacity-50 z-3">
          <div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h5 className="mb-1 text-warning fw-bold font-monospace">SHOPPING SESSION SELECTION</h5>
              <div className="d-flex gap-3 text-white-50 small flex-wrap">
                {cart.map(item => (
                  <span key={item.id} className="bg-secondary bg-opacity-25 border border-secondary border-opacity-25 px-3 py-1 rounded-3 d-inline-flex align-items-center gap-2">
                    <span className="text-white font-monospace">{item.name} (x{item.quantity})</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="btn btn-sm btn-outline-warning p-0 px-1.5 rounded-circle line-height-1 small"
                      style={{ width: '20px', height: '20px', lineHeight: '14px', fontSize: '12px' }}
                      title="Remove 1 unit"
                    >
                      −
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={isOffline}
              className={`btn ${isOffline ? 'btn-secondary text-white' : 'btn-warning text-dark'} fw-bold px-5 py-2 rounded-pill shadow`}
            >
              {isOffline ? "Server Offline" : `Proceed to Checkout ($${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;