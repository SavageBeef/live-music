import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './components/ProductCard';
import heroBgImage from './assets/katarina-bubenikova-nUd7uq3i0qs-unsplash.jpg'; // Import your local asset safely via Vite

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('live_music_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } 
    catch (err) {
      console.error("Failed to load cart from localStorage", err);
      return [];
    } 
  });
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState("Connecting..."); // Create a state to store the network error message/status
  const [isOffline, setIsOffline] = useState(false); // Track if the backend is offline
  const [submitting, setSubmitting] = useState(false); // Controls loading indicator during checkout
  const [isCartOpen, setIsCartOpen] = useState(false); // Toggles the cart drawer modal/offcanvas

  const isMounted = useRef(true); // Tracks the component lifespan across re-renders to prevent background thread state memory leaks
  const cartRef = useRef(cart); // Track cart in a ref so background heartbeat sync always reads the latest cart state

  // Synchronizes product catalog and reconciles DB stock with local cart
  const fetchProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => {
        if (!res.ok) throw new Error("Server responded with an error status: ${res.status}");
        return res.json();
      })
      .then(data => {
        if (isMounted.current) {
          // Reconcile database stock against active local cart quantities
          const reconciledProducts = data.map(product => {
            const inCart = cartRef.current.find(item => item.id === product.id);
            const cartQty = inCart ? inCart.quantity : 0;
            return {
              ...product,
              stock: Math.max(0, product.stock - cartQty)
            };
          });

          setProducts(reconciledProducts);
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

  // Sync cart state to localStorage & keep cartRef updated
  useEffect(() => {
    cartRef.current = cart;
    localStorage.setItem('live_music_cart', JSON.stringify(cart));
  }, [cart]);

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

  // Adds an item to cart and adjusts display stock temporarily
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

  // Adjusts quantity (+1 or -1) directly inside the Cart Drawer
  const handleUpdateQuantity = (productId, delta) => {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;

    if (delta > 0) {
      // Check if product display grid still has stock available to claim
      const productInGrid = products.find(p => p.id === productId);
      if (!productInGrid || productInGrid.stock <= 0) return;

      setCart(prev => prev.map(item => 
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      ));
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stock: p.stock - 1 } : p
      ));
    } else if (delta < 0) {
      if (cartItem.quantity === 1) {
        handleRemoveFromCart(productId);
      } else {
        setCart(prev => prev.map(item => 
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        ));
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, stock: p.stock + 1 } : p
        ));
      }
    }
  };

  // Completely removes an item line from cart and returns entire allocated stock to display grid
  const handleRemoveFromCart = (productId) => {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;

    setCart(prevCart => prevCart.filter(item => item.id !== productId));

    // Return all claimed units back to display stock
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === productId ? { ...p, stock: p.stock + cartItem.quantity } : p)
    );
  };

  // Executes an atomic checkout via POST /api/checkout
  const handleCheckout = async () => {
    if (cart.length === 0 || isOffline || submitting) return;

    setSubmitting(true);

    try {
      // Structure payload for POST /api/checkout
      const payload = {
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Displays exact rejection reason from backend (e.g. "Insufficient stock or invalid product ID: 1")
        throw new Error(data.details || data.error || "Checkout failed.");
      }

      // Success
      alert(`🎉 ${data.message}\nSale #${data.saleId} | Total: $${data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
      
      setCart([]);
      localStorage.removeItem('live_music_cart'); // Clear persisted cart storage
      setIsCartOpen(false);
      fetchProducts(); // Refresh real database state
    } catch (err) {
      alert(`⚠️ Transaction Rejected:\n${err.message}`);
      fetchProducts(); // Re-sync local stock state with DB after rollback
    } finally {
      setSubmitting(false);
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
              {/* Clickable Cart Button */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className={`btn font-monospace px-3 py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center fw-bold border-0 ${
                  isOffline ? 'btn-secondary text-white' : 'btn-warning text-dark'
                }`}
              >
                🛒 Cart <span className="badge bg-dark text-warning ms-2 rounded-pill">{totalCartCount}</span>
              </button> 
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

      {/* Persistent Bottom Action Bar */}
      {cart.length > 0 && (
        <div className="fixed-bottom bg-dark text-white p-3 shadow-lg border-top border-secondary border-opacity-50 z-3">
          <div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="text-warning fw-bold font-monospace small d-block">ACTIVE CART SESSION</span>
              <span className="fs-5 fw-bold font-monospace text-white">
                {totalCartCount} {totalCartCount === 1 ? 'Item' : 'Items'} — ${totalCartPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="d-flex gap-2">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="btn btn-outline-light fw-bold px-4 py-2 rounded-pill font-monospace"
              >
                Review Cart
              </button>
              <button 
                onClick={handleCheckout} 
                disabled={isOffline || submitting}
                className={`btn ${isOffline ? 'btn-secondary text-white' : 'btn-warning text-dark'} fw-bold px-4 py-2 rounded-pill font-monospace shadow d-flex align-items-center gap-2`}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Processing...
                  </>
                ) : isOffline ? (
                  "Server Offline"
                ) : (
                  `Pay $${totalCartPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Cart Modal / Drawer Overlay */}
      {isCartOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary border-opacity-50 rounded-4 shadow-lg">
              
              {/* Drawer Header */}
              <div className="modal-header border-bottom border-secondary border-opacity-25 px-4 py-3">
                <h5 className="modal-title font-monospace text-warning fw-bold d-flex align-items-center gap-2">
                  <span>🛒</span> CHECKOUT BASKET
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setIsCartOpen(false)}
                ></button>
              </div>

              {/* Drawer Body */}
              <div className="modal-body px-4 py-3">
                {cart.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-white-50 font-monospace mb-0">Your shopping basket is empty.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle mb-0">
                      <thead className="text-warning font-monospace small">
                        <tr>
                          <th>ITEM</th>
                          <th className="text-center">PRICE</th>
                          <th className="text-center">QTY</th>
                          <th className="text-end">SUBTOTAL</th>
                          <th className="text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map(item => (
                          <tr key={item.id}>
                            <td className="fw-bold font-monospace">{item.name}</td>
                            <td className="text-center font-monospace">${item.price.toFixed(2)}</td>
                            <td className="text-center">
                              <div className="d-inline-flex align-items-center gap-2 bg-secondary bg-opacity-25 px-2 py-1 rounded-pill border border-secondary border-opacity-25">
                                <button 
                                  onClick={() => handleUpdateQuantity(item.id, -1)}
                                  className="btn btn-sm btn-outline-warning p-0 px-2 rounded-circle"
                                  style={{ lineHeight: '1' }}
                                >
                                  −
                                </button>
                                <span className="font-monospace fw-bold px-1">{item.quantity}</span>
                                <button 
                                  onClick={() => handleUpdateQuantity(item.id, 1)}
                                  className="btn btn-sm btn-outline-warning p-0 px-2 rounded-circle"
                                  style={{ lineHeight: '1' }}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="text-end font-monospace fw-bold text-warning">
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                            <td className="text-center">
                              <button 
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                                title="Delete item"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="modal-footer border-top border-secondary border-opacity-25 px-4 py-3 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-white-50 font-monospace small d-block">TOTAL AMOUNT DUE</span>
                    <span className="fs-3 font-monospace fw-bold text-warning">
                      ${totalCartPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-outline-light font-monospace rounded-pill px-4"
                      onClick={() => setIsCartOpen(false)}
                    >
                      Close
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCheckout}
                      disabled={isOffline || submitting}
                      className="btn btn-warning text-dark font-monospace fw-bold rounded-pill px-5 shadow"
                    >
                      {submitting ? "Processing Transaction..." : "Complete Purchase"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;