import React from 'react';

function RestockModal({ 
  restockItem, 
  restockQuantity, 
  setRestockQuantity, 
  handleCloseRestockModal, 
  handleConfirmRestock 
}) {
  if (!restockItem) return null;

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
}

export default RestockModal;