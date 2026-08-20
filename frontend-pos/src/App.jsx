import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SalesHistory from './components/SalesHistory';

function App() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [systemStatus, setSystemStatus] = useState('OFFLINE');
  const [hasConnected, setHasConnected] = useState(false);

  // Form State Control Object (Tracks back-office intake values)
  const [form, setForm] = useState({
    name: '',
    brand: '',
    price: '',
    stock: '',
    description: '',
    image_url: ''
  });

  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

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

  // Handles file selection and generates a local browser preview URL
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({ ...prev, file }));
      // Generate a temporary local URL for immediate rendering
      setFilePreview(URL.createObjectURL(file));
    } else {
      setForm(prev => ({ ...prev, file: null }));
      setFilePreview(null);
    }
  };

  // Updates specific controlled input state objects dynamically
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Dispatches form submission payloads down to our new API route
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    let finalImageUrl = form.image_url;

    // If a file exists, upload it to the backend first
    if (form.file) {
      const formData = new FormData();
      formData.append('image', form.file);

      const uploadRes = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setFormError(uploadData.error || "Failed to upload image.");
        return;
      }
      finalImageUrl = uploadData.imageUrl;
    }

    // Prepare payload (using finalImageUrl instead of direct form input)
    const payload = { ...form, image_url: finalImageUrl };
    delete payload.file; // Remove file object from JSON payload

    console.log("🚀 FRONTEND SENDING PAYLOAD:", payload);

    // Dynamic URL and method selection based on whether we're editing or creating a new product
    const url = editingId
      ? `http://localhost:5000/api/pos/update-product/${editingId}`
      : 'http://localhost:5000/api/pos/add-product';
    const method = editingId ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to process product submission.");
        return data;
      })
      .then((data) => {
        if (editingId) {
          setFormSuccess(`Product changes saved successfully!`);
          setEditingId(null); // Reset editing state after successful update
        } else {
          setFormSuccess(`Product "${form.name}" added successfully with ID #${data.product}.`);
        }

        // Clear the form after successful submission for next product record
        setForm({ name: '', brand: '', price: '', stock: '', description: '', image_url: '' });
        document.getElementById('productImageInput').value = ''; // <-- Clear the file input element cleanly!

        if (filePreview) URL.revokeObjectURL(filePreview); // Free browser memory
        setFilePreview(null);

        // Refresh the inventory to include the newly added/updated product
        fetchInventory();
      })
      .catch((error) => {
        setFormError(`❌ ${error.message}`);
      });
  };

  // Trigger the intake form to pre-fill with the selected product's data for editing
  const handleEditClick = (item) => {
    setFormError(null);
    setFormSuccess(null);
    setEditingId(item.id);
    setForm({
      name: item.name,
      brand: item.brand,
      price: item.price,
      stock: item.stock,
      description: item.description || '',
      image_url: item.image_url || ''
    });

    // Clear any unsubmitted new file selections when entering edit mode
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    const fileInput = document.getElementById('productImageInput');
    if (fileInput) fileInput.value = '';
  };

  // Cancel the edit operation and reset the form to its default state
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', brand: '', price: '', stock: '', description: '', image_url: '' });
    setFormError(null);
    setFormSuccess(null);

    if (filePreview) URL.revokeObjectURL(filePreview); // Free browser memory
    setFilePreview(null);
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
        setFormSuccess(`Product "${itemName}" has been successfully deleted from the catalog.`);
        if (editingId === id) handleCancelEdit(); // Reset form if the deleted product was being edited
        fetchInventory();
      })
      .catch((error) => {
        setFormError(`❌ Deletion Error: ${error.message}`);
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
                <div className="table-responsive bg-dark rounded-4 border border-secondary border-opacity-25 shadow-lg">
                  <table className="table table-dark table-hover align-middle mb-0 font-monospace text-nowrap">
                    <thead className="text-warning font-monospace small border-bottom border-secondary border-opacity-50">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="py-3">NAME</th>
                        <th className="py-3">BRAND</th>
                        <th className="py-3 text-end">PRICE</th>
                        <th className="py-3 text-center">CURRENT STOCK</th>
                        <th className="px-4 py-3 text-center">QUICK ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 fw-bold text-warning">#{item.id}</td>
                          <td className="fw-bold text-white">{item.name}</td>
                          <td>
                            <span className="badge bg-secondary bg-opacity-25 text-white border border-secondary border-opacity-25 fw-normal px-2.5 py-1">
                              {item.brand}
                            </span>
                          </td>
                          <td className="text-end fw-bold text-white">
                            ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-center">
                            {item.stock > 0 ? (
                              <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill fw-bold">
                                {item.stock} available
                              </span>
                            ) : (
                              <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 px-3 py-1.5 rounded-pill fw-bold">
                                Sold Out
                              </span>
                            )}
                          </td>
                          <td className="px-4 text-center">
                            <div className="btn-group gap-1">
                              <button 
                                onClick={() => handleOpenRestockModal(item)} 
                                className="btn btn-sm btn-warning text-dark font-monospace px-3 rounded-pill fw-bold shadow-sm transition-all small"
                              >
                                + Restock
                              </button>
                              <button 
                                onClick={() => handleEditClick(item)} 
                                className="btn btn-sm btn-outline-light font-monospace px-3 rounded-pill transition-all small"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(item.id, item.name)} 
                                className="btn btn-sm btn-outline-danger font-monospace px-3 rounded-pill transition-all small"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Dark Modern Intake Panel */}
              <div className="col-12 col-xl-4">
                <div className="bg-dark text-white rounded-4 border border-secondary border-opacity-25 p-4 shadow-lg font-monospace">
                  <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-4">
                    <h5 className="fw-bold text-warning mb-1">
                      {editingId ? "📝 EDIT CATALOG ITEM" : "📥 ITEM INTAKE PANEL"}
                    </h5>
                    <p className="text-white-50 small mb-0">
                      {editingId ? `Modifying settings for active product ID #${editingId}.` : "Publish an entirely new model selection to the showroom floor instantly."}
                    </p>
                  </div>

                  {formSuccess && <div className="alert alert-success small py-2 px-3 border-0 rounded-3 mb-3 shadow-sm font-monospace">✅ {formSuccess}</div>}
                  {formError && <div className="alert alert-danger small py-2 px-3 border-0 rounded-3 mb-3 shadow-sm font-monospace">❌ {formError}</div>}

                  <form onSubmit={handleCreateProduct}>
                    <div className="row g-3 small">
                      
                      <div className="col-12">
                        <label className="form-label fw-bold text-warning mb-1">Product Name *</label>
                        <input 
                          type="text" 
                          name="name" 
                          value={form.name} 
                          onChange={handleInputChange} 
                          className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 py-2 px-3 rounded-3" 
                          placeholder="e.g. Stratocaster Player" 
                          required 
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-warning mb-1">Brand Name *</label>
                        <input 
                          type="text" 
                          name="brand" 
                          value={form.brand} 
                          onChange={handleInputChange} 
                          className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 py-2 px-3 rounded-3" 
                          placeholder="e.g. Fender" 
                          required 
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold text-warning mb-1">Price ($USD) *</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          name="price" 
                          value={form.price} 
                          onChange={handleInputChange} 
                          className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 py-2 px-3 rounded-3" 
                          placeholder="0.00" 
                          required 
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold text-warning mb-1">Initial Stock Count *</label>
                        <input 
                          type="number" 
                          min="0" 
                          name="stock" 
                          value={form.stock} 
                          onChange={handleInputChange} 
                          className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 py-2 px-3 rounded-3" 
                          placeholder="0" 
                          required 
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold text-warning mb-1">Description</label>
                        <textarea 
                          name="description" 
                          rows="2" 
                          value={form.description} 
                          onChange={handleInputChange} 
                          className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 py-2 px-3 rounded-3" 
                          placeholder="Provide product features, tonal reviews, wood choices..."
                        ></textarea>
                      </div>

                      <div className="col-12 mb-2">
                        <label className="form-label fw-bold text-warning mb-1">Product Image</label>

                        {(filePreview || (editingId && form.image_url)) && (
                          <div className="d-flex align-items-center gap-3 p-2 mb-2 border border-secondary border-opacity-50 bg-secondary bg-opacity-10 rounded-3">
                            <img 
                              src={filePreview || form.image_url} 
                              alt="Preview" 
                              className="rounded border border-secondary bg-dark object-fit-contain" 
                              style={{ width: '50px', height: '50px' }} 
                            />
                            <div className="flex-grow-1 min-w-0">
                              <span className="d-block text-white-50 small text-truncate">
                                {filePreview ? "✨ Local Draft Selected" : "📦 Saved Database Asset"}
                              </span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                if (filePreview) URL.revokeObjectURL(filePreview);
                                setFilePreview(null);
                                setForm(prev => ({ ...prev, file: null, image_url: editingId ? '' : prev.image_url }));
                                document.getElementById('productImageInput').value = '';
                              }}
                              className="btn btn-sm btn-outline-danger font-monospace px-2 py-0.5"
                              style={{ fontSize: '0.7rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        <input
                          id="productImageInput" 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange} 
                          className="form-control form-control-sm bg-dark text-white border-secondary border-opacity-50 py-2 px-3 rounded-3" 
                        />
                      </div>

                      <div className="col-12 pt-2 d-flex gap-2">
                        {editingId && (
                          <button 
                            type="button" 
                            onClick={handleCancelEdit} 
                            className="btn btn-outline-light fw-bold w-50 py-2.5 rounded-pill shadow-sm text-uppercase tracking-wider"
                          >
                            Cancel
                          </button>
                        )}
                        <button 
                          type="submit" 
                          className={`btn ${editingId ? 'btn-success' : 'btn-warning'} text-dark fw-bold ${editingId ? 'w-50' : 'w-100'} py-2.5 rounded-pill shadow-sm transition-all text-uppercase tracking-wider`}
                        >
                          {editingId ? "Save Changes" : "Publish To Floor 🚀"}
                        </button>
                      </div>

                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sales Ledger & Receipts */
          <SalesHistory isOffline={systemStatus === 'OFFLINE'} />
        )}

      </div>

      {/* Restock Inventory Modal */}
      {restockItem && (() => {
        const addedQty = parseInt(restockQuantity, 10) || 0;
        const projectedTotal = restockItem.stock + addedQty;

        return (
          <div 
            className="modal fade show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
            onClick={handleCloseRestockModal}
          >
            <div 
              className="modal-dialog modal-dialog-centered font-monospace"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content bg-dark text-white border border-secondary border-opacity-50 shadow-lg rounded-4">
                <div className="modal-header border-secondary border-opacity-25 py-3">
                  <h5 className="modal-title fw-bold text-warning d-flex align-items-center gap-2 mb-0">
                    <span>📦</span> RESTOCK INVENTORY
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={handleCloseRestockModal}
                    aria-label="Close"
                  ></button>
                </div>

                <form onSubmit={handleConfirmRestock}>
                  <div className="modal-body py-4">
                    <div className="mb-3">
                      <span className="text-white-50 small d-block">Target Item:</span>
                      <span className="fs-5 fw-bold text-white">#{restockItem.id} - {restockItem.name}</span>
                    </div>

                    {/* Quantity Input Field */}
                    <div className="mb-4">
                      <label className="form-label fw-bold text-warning small mb-1">
                        Quantity to Add *
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        value={restockQuantity} 
                        onChange={(e) => setRestockQuantity(e.target.value)} 
                        className="form-control bg-dark text-white border-secondary border-opacity-50 py-2 px-3 rounded-3 fs-5 fw-bold" 
                        required 
                        autoFocus
                      />
                    </div>

                    {/* Dynamic Live Calculations Card */}
                    <div className="p-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 rounded-3">
                      <div className="d-flex justify-content-between align-items-center mb-2 small">
                        <span className="text-white-50">Current Stock:</span>
                        <span className="fw-bold text-white">{restockItem.stock} units</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 small">
                        <span className="text-white-50">Adding Quantity:</span>
                        <span className="fw-bold text-warning">+{addedQty} units</span>
                      </div>
                      <hr className="my-2 border-secondary border-opacity-25" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-white-50 small fw-bold">Projected New Total:</span>
                        <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-2.5 py-1.5 fw-bold fs-6">
                          {projectedTotal} units
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="modal-footer border-secondary border-opacity-25 py-3">
                    <button 
                      type="button" 
                      onClick={handleCloseRestockModal} 
                      className="btn btn-outline-light rounded-pill px-4 fw-semibold small"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-warning text-dark rounded-pill px-4 fw-bold shadow-sm small text-uppercase"
                    >
                      Confirm Restock 🚀
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default App;