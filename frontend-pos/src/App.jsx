import React, { useState, useEffect } from 'react';

function App() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the full catalog including out-of-stock items
  const fetchInventory = () => {
    fetch('http://localhost:5000/api/products')
      .then((res) => {
        if (!res.ok) throw new Error(`Error fetching inventory: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setInventory(data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError("Could not connect to back-office storage database.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Restock Function: Sends a restock increment request to the backend server
  const handleRestock = (id, itemName) => {
    const restockAmount = 10; // Default intake standard batch count

    fetch('http://localhost:5000/api/pos/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, quantity: restockAmount })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to process server restock.");
        return res.json();
      })
      .then(() => {
        // Refresh the local tracking grid to show the updated numbers
        fetchInventory();
      })
      .catch(err => {
        alert(`❌ Error restocking ${itemName}: ${err.message}`);
      });
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 pb-5" style={{ backgroundColor: '#faf6ee' }}>
      {/* Back Office Admin Navigation Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 mb-4 shadow-sm">
        <div className="container-fluid px-4">
          <span className="navbar-brand fw-black tracking-wider">
            <span className="text-warning me-2">⚡</span> LIVE MUSIC <span className="text-white-50 fw-normal ms-2 fs-6">| Back-Office POS</span>
          </span>
          <div className="navbar-nav ms-auto font-monospace small">
            <span className="text-white-50">System Status: <span className="text-warning fw-bold">ONLINE</span></span>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-4">
        {error ? (
          <div className="alert alert-danger shadow-sm border-start border-4 border-danger" role="alert">
            {error}
          </div>
        ) : (
          <div className="row">
            {/* Left Column: Master Live Database Tracking Sheet */}
            <div className="col-12 col-xl-8 mb-4">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white custom-card">
                <div className="card-header bg-white border-bottom border-light py-3.5 d-flex justify-content-between align-items-center px-4">
                  <h5 className="mb-0 fw-bold text-dark font-monospace tracking-tight">LIVE INVENTORY LEDGER</h5>
                  <button onClick={fetchInventory} className="btn btn-sm btn-outline-dark rounded-pill font-monospace px-3 py-1">
                    🔄 Refresh Data
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 font-monospace text-nowrap">
                      <thead className="table-dark text-uppercase fs-7">
                        <tr>
                          <th className="px-4 py-3 text-white-50">ID</th>
                          <th className="py-3 text-white-50">Item Description</th>
                          <th className="py-3 text-white-50">Brand</th>
                          <th className="py-3 text-end text-white-50">Price</th>
                          <th className="py-3 text-center text-white-50">Current Stock</th>
                          <th className="px-4 py-3 text-center text-white-50">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item) => (
                          <tr key={item.id} className={item.stock === 0 ? "table-danger bg-opacity-25" : ""}>
                            <td className="px-4 fw-bold text-muted">#{item.id}</td>
                            <td className="fw-bold text-dark">{item.name}</td>
                            <td><span className="badge bg-light text-dark font-monospace border fw-normal px-2 py-1">{item.brand}</span></td>
                            <td className="text-end fw-bold">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="text-center">
                              {item.stock > 0 ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill fw-bold">
                                  {item.stock} available
                                </span>
                              ) : (
                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-1.5 rounded-pill fw-bold">
                                  Sold Out
                                </span>
                              )}
                            </td>
                            <td className="px-4 text-center">
                              <button onClick={() => handleRestock(item.id, item.name)} className="btn btn-sm btn-warning text-dark px-3 rounded-pill fw-bold shadow-sm transition-all">
                                +10 Restock
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Placement Intake Panel */}
            <div className="col-12 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 p-5 bg-white text-center custom-card d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '340px' }}>
                <span className="fs-1 mb-3">📥</span>
                <h5 className="fw-bold text-dark font-monospace mb-2">Item Intake Panel</h5>
                <p className="text-muted small px-3 lh-base mb-0">
                  This workspace will host our dynamic creation entry forms, allowing staff to publish entirely new models straight to the showroom database instantly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;