import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SalesHistory from './components/SalesHistory';
import RestockModal from './components/RestockModal';
import InventoryTable from './components/InventoryTable';
import ProductForm from './components/ProductForm';

function App() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [systemStatus, setSystemStatus] = useState('OFFLINE');
  const [hasConnected, setHasConnected] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState({type: null, message: ''}); // { type: 'success' / 'error', message: string }

  const [activeView, setActiveView] = useState('inventory'); // 'inventory' | 'sales'

  // Restock Modal State Control
  const [restockItem, setRestockItem] = useState(null); // stores { id, name, stock } when active
  const [restockQuantity, setRestockQuantity] = useState(10);

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
        setSystemStatus('ONLINE');
        setHasConnected(true); // Track that we've had at least one good connection
      })
      .catch((err) => {
        console.warn("Backend server not found yet. Retrying in 5 seconds...");
        setError("Could not connect to back-office storage database.");
        setLoading(false);
        setSystemStatus('OFFLINE');
      });
  };

  useEffect(() => {
    fetchInventory();

    // Poll backend health every 5 seconds
    const interval = setInterval(fetchInventory, 5000);
    return () => clearInterval(interval);
  }, []);

  // Open modal with selected item context
  const handleOpenRestockModal = (item) => {
    setRestockItem(item);
    setRestockQuantity(10); // default default batch
  };

  // Close modal & reset state
  const handleCloseRestockModal = () => {
    setRestockItem(null);
    setRestockQuantity(10);
  };

  // Restock Function: Sends a restock increment request to the backend server
  const handleConfirmRestock = (e) => {
    e.preventDefault();
    const restockAmount = parseInt(restockQuantity, 10);
    if (isNaN(restockAmount) || restockAmount <= 0) {
      alert("❌ Invalid quantity. Please enter a positive number.");
      return;
    }
    
    handleCloseRestockModal();

    fetch('http://localhost:5000/api/pos/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: restockItem.id, quantity: restockAmount })
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
        alert(`❌ Error restocking ${restockItem.name}: ${err.message}`);
      });
  };

  // Trigger the intake form to pre-fill with the selected product's data for editing
  const handleEditClick = (item) => {
    setEditingProduct(item);
  };

  // Dispatch a server-side DELETE mutation sequence
  const handleDeleteProduct = (id, itemName) => {
    if (!window.confirm(`⚠️ Crucial Action: Are you sure you want to permanently delete "${itemName}" from the catalog? This action cannot be undone.`)) {
      return;
    }

    fetch(`http://localhost:5000/api/pos/delete-product/${id}`, {
      method: 'DELETE'
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete product.");
        return data;
      })
      .then(() => {
        setNotification({ 
          type: 'success', 
          message: `Product "${itemName}" has been successfully deleted from the catalog.`
        });
        if (editingProduct?.id === id) setEditingProduct(null); // Reset form if the deleted product was being edited
        fetchInventory();
      })
      .catch((error) => {
        setNotification({ 
          type: 'error', 
          message: `Deletion Error: ${error.message}`
        });
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
      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        systemStatus={systemStatus} 
      />

      <div className="container-fluid px-4">
        {error && (
          <div className="alert alert-danger shadow-sm border-start border-4 border-danger d-flex align-items-center justify-content-between mb-4" role="alert">
            <div>
              <strong>⚠️ {hasConnected ? 'Connection Lost:' : 'Server Unavailable:'}</strong> {error}
            </div>
            <span className="badge bg-danger text-uppercase font-monospace ms-2">
              Auto-Retrying Every 5s
            </span>
          </div>
        )}
          
        {activeView === 'inventory' ? (
          <div>
            {/* Header & Section Action Controls */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
              <div>
                <h2 className="fw-black text-dark font-monospace mb-1">
                  <span className="text-warning">📦</span> INVENTORY & INTAKE
                </h2>
                <p className="text-muted font-monospace small mb-0">
                  Manage live catalog items, track available stock counts, and handle intake updates.
                </p>
              </div>

              <button 
                onClick={fetchInventory} 
                disabled={systemStatus === 'OFFLINE'}
                className="btn btn-outline-dark rounded-pill font-monospace small px-3 py-1.5 d-flex align-items-center gap-2 shadow-sm fw-semibold"
              >
                <span>🔄</span>
                <span>Refresh Data</span>
              </button>
            </div>

            <div className="row">
              {/* Left Column: Master Live Database Tracking Sheet */}
              <div className="col-12 col-xl-8 mb-4">
                <InventoryTable 
                  inventory={inventory} 
                  handleOpenRestockModal={handleOpenRestockModal} 
                  handleEditClick={handleEditClick} 
                  handleDeleteProduct={handleDeleteProduct} 
                />
              </div>

              {/* Right Column: Dark Modern Intake Panel */}
              <div className="col-12 col-xl-4">
                <ProductForm 
                  editingProduct={editingProduct} 
                  externalNotification={notification}
                  onCancelEdit={() => setEditingProduct(null)} 
                  onProductSaved={() => {
                    setEditingProduct(null);
                    fetchInventory();
                  }} 
                />
              </div>
            </div>
          </div>
        ) : (
          /* Sales Ledger & Receipts */
          <SalesHistory isOffline={systemStatus === 'OFFLINE'} />
        )}

      </div>

      {/* Restock Inventory Modal */}
      <RestockModal 
        restockItem={restockItem} 
        restockQuantity={restockQuantity} 
        setRestockQuantity={setRestockQuantity} 
        handleCloseRestockModal={handleCloseRestockModal} 
        handleConfirmRestock={handleConfirmRestock} 
      />
    </div>
  );
}

export default App;