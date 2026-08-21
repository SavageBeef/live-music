import React, { useState, useEffect } from 'react';

function ProductForm({ editingProduct, externalNotification, onCancelEdit, onProductSaved }) {
	// Form State Control Object (Tracks back-office intake values)
  const [form, setForm] = useState({
    name: '',
    brand: '',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    file: null
  });

  const [filePreview, setFilePreview] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

	// Sync external notifications to form state
	useEffect(() => {
		if (externalNotification?.message) {
			if (externalNotification.type === 'success') {
				setFormSuccess(externalNotification.message);
				setFormError(null);
			} else if (externalNotification.type === 'error') {
				setFormError(externalNotification.message);
				setFormSuccess(null);
			}
		}
	}, [externalNotification]);

  // Sync form inputs whenever editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        brand: editingProduct.brand,
        price: editingProduct.price,
        stock: editingProduct.stock,
        description: editingProduct.description || '',
        image_url: editingProduct.image_url || '',
        file: null
      });
      setFormError(null);
      setFormSuccess(null);
			// Clear any unsubmitted new file selections when entering edit mode
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    } else {
      resetFormState();
    }
  }, [editingProduct]);

	// Cancel the edit operation and reset the form to its default state
  const resetFormState = () => {
    setForm({
      name: '',
      brand: '',
      price: '',
      stock: '',
      description: '',
      image_url: '',
      file: null
    });
    if (filePreview) URL.revokeObjectURL(filePreview); // Free browser memory
    setFilePreview(null);
    const fileInput = document.getElementById('productImageInput'); // Clear the file input element cleanly!
    if (fileInput) fileInput.value = '';
  };

	// Updates specific controlled input state objects dynamically
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

	// Handles file selection and generates a local browser preview URL
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, file }));
      setFilePreview(URL.createObjectURL(file)); // Generate a temporary local URL for immediate rendering
    } else {
      setForm((prev) => ({ ...prev, file: null }));
      setFilePreview(null);
    }
  };

  const handleRemoveImage = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setForm((prev) => ({ ...prev, file: null, image_url: editingProduct ? '' : prev.image_url }));
    const fileInput = document.getElementById('productImageInput');
    if (fileInput) fileInput.value = '';
  };

	// Dispatches form submission payloads down to our new API route
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    let finalImageUrl = form.image_url;

    try {
			// If a file exists, upload it to the backend first
      if (form.file) {
        const formData = new FormData();
        formData.append('image', form.file);

        const uploadRes = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData
        });
				
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload image.");
        finalImageUrl = uploadData.imageUrl;
      }
			
			// Prepare payload (using finalImageUrl instead of direct form input)
      const payload = { ...form, image_url: finalImageUrl };
      delete payload.file; // Remove file object from JSON payload

			console.log("🚀 FRONTEND SENDING PAYLOAD:", payload);

			// Dynamic URL and method selection based on whether we're editing or creating a new product
      const editingId = editingProduct?.id;
      const url = editingId
        ? `http://localhost:5000/api/pos/update-product/${editingId}`
        : 'http://localhost:5000/api/pos/add-product';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process product submission.");

      if (editingId) {
        setFormSuccess(`Product changes saved successfully!`);
      } else {
        setFormSuccess(`Product "${form.name}" added successfully with ID #${data.product}.`);
      }

      resetFormState();
      if (onProductSaved) onProductSaved();
    } catch (error) {
      setFormError(`${error.message}`);
    }
  };

  const handleCancel = () => {
    resetFormState();
    setFormError(null);
    setFormSuccess(null);
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div className="bg-dark text-white rounded-4 border border-secondary border-opacity-25 p-4 shadow-lg font-monospace">
      <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-4">
        <h5 className="fw-bold text-warning mb-1">
          {editingProduct ? "📝 EDIT CATALOG ITEM" : "📥 ITEM INTAKE PANEL"}
        </h5>
        <p className="text-white-50 small mb-0">
          {editingProduct 
            ? `Modifying settings for active product ID #${editingProduct.id}.` 
            : "Publish an entirely new model selection to the showroom floor instantly."}
        </p>
      </div>

      {formSuccess && <div className="alert alert-success small py-2 px-3 border-0 rounded-3 mb-3 shadow-sm font-monospace">✅ {formSuccess}</div>}
      {formError && <div className="alert alert-danger small py-2 px-3 border-0 rounded-3 mb-3 shadow-sm font-monospace">❌ {formError}</div>}

      <form onSubmit={handleSubmit}>
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

            {(filePreview || (editingProduct && form.image_url)) && (
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
                  onClick={handleRemoveImage}
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
            {editingProduct && (
              <button 
                type="button" 
                onClick={handleCancel} 
                className="btn btn-outline-light fw-bold w-50 py-2.5 rounded-pill shadow-sm text-uppercase tracking-wider"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className={`btn ${editingProduct ? 'btn-success' : 'btn-warning'} text-dark fw-bold ${editingProduct ? 'w-50' : 'w-100'} py-2.5 rounded-pill shadow-sm transition-all text-uppercase tracking-wider`}
            >
              {editingProduct ? "Save Changes" : "Publish To Floor 🚀"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;